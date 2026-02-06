'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  FileText,
  Image as ImageIcon,
  X,
  Eye,
  Edit3,
  Check,
  Loader2,
  Upload,
} from 'lucide-react';

// Template types
export type TemplateType = 'professional' | 'modern' | 'minimal' | 'bold';

interface ReportImage {
  id: string;
  url: string;
  caption: string;
  file?: File;
}

interface ReportSection {
  id: string;
  title: string;
  content: string;
  isEditing?: boolean;
}

interface ReportData {
  title: string;
  subtitle: string;
  date: string;
  sections: ReportSection[];
  images: ReportImage[];
  metrics: {
    label: string;
    value: string;
  }[];
  charts?: {
    registrationData: { date: string; count: number }[];
    statusData: { name: string; value: number }[];
  };
}

interface ReportExporterProps {
  eventName: string;
  initialReport: string;
  reportData: ReportData;
  onClose?: () => void;
}

// Template configurations
const templates: Record<TemplateType, {
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  headerStyle: string;
}> = {
  professional: {
    name: 'Professional',
    description: 'Clean and corporate look with navy blue accents',
    primaryColor: '#1e3a5f',
    secondaryColor: '#f8fafc',
    accentColor: '#3b82f6',
    fontFamily: 'Georgia, serif',
    headerStyle: 'border-bottom: 3px solid #1e3a5f;',
  },
  modern: {
    name: 'Modern',
    description: 'Bold and contemporary with gradient accents',
    primaryColor: '#7c3aed',
    secondaryColor: '#faf5ff',
    accentColor: '#a855f7',
    fontFamily: 'Inter, sans-serif',
    headerStyle: 'background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 20px;',
  },
  minimal: {
    name: 'Minimal',
    description: 'Simple and elegant with subtle styling',
    primaryColor: '#374151',
    secondaryColor: '#ffffff',
    accentColor: '#10b981',
    fontFamily: 'system-ui, sans-serif',
    headerStyle: 'border-left: 4px solid #10b981; padding-left: 16px;',
  },
  bold: {
    name: 'Bold',
    description: 'Modern dark theme with orange accents - great for visual reports',
    primaryColor: '#333333',
    secondaryColor: '#fefff7',
    accentColor: '#f97316',
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
    headerStyle: 'background: #333333; color: white; padding: 40px;',
  },
};

export function ReportExporter({
  eventName,
  initialReport,
  reportData,
  onClose,
}: ReportExporterProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('professional');
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx'>('pdf');
  const [showPreview, setShowPreview] = useState(false);
  const [images, setImages] = useState<ReportImage[]>(reportData.images || []);
  const [sections, setSections] = useState<ReportSection[]>(() => {
    // Parse the AI report into sections
    const parsedSections: ReportSection[] = [];
    const lines = initialReport.split('\n');
    let currentSection: ReportSection | null = null;
    let currentContent: string[] = [];

    lines.forEach((line) => {
      if (line.startsWith('## ')) {
        if (currentSection) {
          currentSection.content = currentContent.join('\n').trim();
          parsedSections.push(currentSection);
        }
        currentSection = {
          id: `section-${parsedSections.length}`,
          title: line.replace('## ', '').trim(),
          content: '',
        };
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    });

    if (currentSection !== null) {
      (currentSection as ReportSection).content = currentContent.join('\n').trim();
      parsedSections.push(currentSection as ReportSection);
    }

    return parsedSections.length > 0 ? parsedSections : [{
      id: 'section-0',
      title: 'Report Content',
      content: initialReport,
    }];
  });
  const [reportTitle, setReportTitle] = useState(reportData.title || `${eventName} - Event Report`);
  const [reportSubtitle, setReportSubtitle] = useState(reportData.subtitle || `Generated on ${new Date().toLocaleDateString()}`);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImage: ReportImage = {
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: reader.result as string,
          caption: file.name.replace(/\.[^/.]+$/, ''),
          file,
        };
        setImages((prev) => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const updateImageCaption = (id: string, caption: string) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, caption } : img))
    );
  };

  const updateSectionContent = (id: string, content: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === id ? { ...section, content } : section
      )
    );
  };

  const updateSectionTitle = (id: string, title: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === id ? { ...section, title } : section
      )
    );
  };

  const toggleSectionEdit = (id: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === id ? { ...section, isEditing: !section.isEditing } : section
      )
    );
  };

  const addNewSection = () => {
    const newSection: ReportSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      content: 'Enter content here...',
      isEditing: true,
    };
    setSections((prev) => [...prev, newSection]);
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((section) => section.id !== id));
  };

  const generatePDF = async () => {
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;

    const template = templates[selectedTemplate];
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Helper function to add new page if needed
    const checkAddPage = (requiredSpace: number) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // Header background for modern and bold templates
    if (selectedTemplate === 'modern') {
      doc.setFillColor(124, 58, 237);
      doc.rect(0, 0, pageWidth, 50, 'F');
      doc.setTextColor(255, 255, 255);
    } else if (selectedTemplate === 'bold') {
      doc.setFillColor(51, 51, 51);
      doc.rect(0, 0, pageWidth, 80, 'F');
      // Add orange decorative elements (vertical ovals on right side)
      doc.setFillColor(249, 115, 22);
      doc.ellipse(pageWidth - 25, 30, 10, 20, 'F');
      doc.ellipse(pageWidth - 45, 30, 8, 16, 'F');
      doc.ellipse(pageWidth - 62, 30, 6, 12, 'F');
      doc.setTextColor(255, 255, 255);
      yPos = 25; // Adjust starting position for bold template
    } else {
      doc.setTextColor(template.primaryColor);
    }

    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(reportTitle, pageWidth - 2 * margin);
    doc.text(titleLines, margin, yPos + 10);
    yPos += 10 + (titleLines.length * 10);

    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    if (selectedTemplate !== 'modern') {
      doc.setTextColor(100, 100, 100);
    }
    doc.text(reportSubtitle, margin, yPos + 5);
    yPos += 20;

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Divider line
    if (selectedTemplate === 'professional') {
      doc.setDrawColor(template.primaryColor);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
    } else if (selectedTemplate === 'minimal') {
      doc.setDrawColor(template.accentColor);
      doc.setLineWidth(1);
      doc.line(margin, yPos, margin + 30, yPos);
      yPos += 10;
    } else {
      yPos += 10;
    }

    // Metrics section
    if (reportData.metrics && reportData.metrics.length > 0) {
      checkAddPage(40);
      doc.setFontSize(selectedTemplate === 'bold' ? 16 : 14);
      doc.setFont('helvetica', 'bold');

      if (selectedTemplate === 'bold') {
        doc.setTextColor(249, 115, 22); // Orange for bold template
      } else {
        doc.setTextColor(template.primaryColor);
      }
      doc.text('Key Metrics', margin, yPos);
      yPos += selectedTemplate === 'bold' ? 12 : 8;

      doc.setTextColor(0, 0, 0);

      const metricsPerRow = 3;
      const metricWidth = (pageWidth - 2 * margin) / metricsPerRow;
      const metricCardHeight = selectedTemplate === 'bold' ? 25 : 15;

      reportData.metrics.forEach((metric, index) => {
        const col = index % metricsPerRow;
        const row = Math.floor(index / metricsPerRow);

        if (col === 0 && row > 0) {
          yPos += metricCardHeight + 5;
          checkAddPage(metricCardHeight + 10);
        }

        const xPos = margin + col * metricWidth;

        // For bold template, draw card background
        if (selectedTemplate === 'bold') {
          doc.setFillColor(248, 248, 248);
          doc.setDrawColor(230, 230, 230);
          doc.roundedRect(xPos, yPos - 5, metricWidth - 5, metricCardHeight, 3, 3, 'FD');
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(selectedTemplate === 'bold' ? 18 : 14);
        doc.setTextColor(51, 51, 51);
        doc.text(metric.value, xPos + (selectedTemplate === 'bold' ? 5 : 0), yPos + (selectedTemplate === 'bold' ? 5 : 0));

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(selectedTemplate === 'bold' ? 8 : 9);
        doc.setTextColor(134, 134, 139);
        doc.text(metric.label, xPos + (selectedTemplate === 'bold' ? 5 : 0), yPos + (selectedTemplate === 'bold' ? 12 : 5));
        doc.setTextColor(0, 0, 0);
      });

      yPos += metricCardHeight + 15;
    }

    // Sections
    for (const section of sections) {
      checkAddPage(30);

      // Section title
      doc.setFontSize(selectedTemplate === 'bold' ? 16 : 14);
      doc.setFont('helvetica', 'bold');

      if (selectedTemplate === 'bold') {
        // Orange accent line before title
        doc.setFillColor(249, 115, 22);
        doc.rect(margin, yPos - 1, 20, 2, 'F');
        yPos += 8;
        doc.setTextColor(51, 51, 51);
        doc.text(section.title, margin, yPos);
      } else if (selectedTemplate === 'minimal') {
        doc.setTextColor(template.primaryColor);
        doc.setDrawColor(template.accentColor);
        doc.setLineWidth(2);
        doc.line(margin, yPos - 2, margin, yPos + 5);
        doc.text(section.title, margin + 5, yPos + 3);
      } else {
        doc.setTextColor(template.primaryColor);
        doc.text(section.title, margin, yPos + 3);
      }

      yPos += 10;

      // Section content
      doc.setFontSize(selectedTemplate === 'bold' ? 11 : 10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);

      const contentLines = doc.splitTextToSize(
        section.content.replace(/\*\*/g, '').replace(/- /g, '• '),
        pageWidth - 2 * margin
      );

      for (const line of contentLines) {
        checkAddPage(7);
        doc.text(line, margin, yPos);
        yPos += selectedTemplate === 'bold' ? 6 : 5;
      }

      yPos += selectedTemplate === 'bold' ? 15 : 10;
    }

    // Images
    if (images.length > 0) {
      checkAddPage(50);
      doc.setFontSize(selectedTemplate === 'bold' ? 16 : 14);
      doc.setFont('helvetica', 'bold');

      if (selectedTemplate === 'bold') {
        doc.setTextColor(249, 115, 22); // Orange
        doc.text('Event Highlights', margin, yPos);
      } else {
        doc.setTextColor(template.primaryColor);
        doc.text('Attachments', margin, yPos);
      }
      yPos += 12;

      // For bold template, show images in a grid (2 per row if more than 2)
      if (selectedTemplate === 'bold' && images.length > 1) {
        const imagesPerRow = Math.min(images.length, 3);
        const imgWidth = (pageWidth - 2 * margin - (imagesPerRow - 1) * 5) / imagesPerRow;
        const imgHeight = 50;

        for (let i = 0; i < images.length; i++) {
          const col = i % imagesPerRow;
          const image = images[i];

          if (col === 0 && i > 0) {
            yPos += imgHeight + 20;
            checkAddPage(imgHeight + 25);
          }

          const xPos = margin + col * (imgWidth + 5);

          try {
            doc.addImage(image.url, 'JPEG', xPos, yPos, imgWidth, imgHeight);

            // Highlight label
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(249, 115, 22);
            doc.text(`HIGHLIGHT ${i + 1}`, xPos, yPos + imgHeight + 5);

            // Caption
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 51, 51);
            const captionLines = doc.splitTextToSize(image.caption, imgWidth);
            doc.text(captionLines[0] || '', xPos, yPos + imgHeight + 10);
          } catch (e) {
            console.error('Error adding image to PDF:', e);
          }
        }
        yPos += imgHeight + 25;
      } else {
        // Default single-column layout for other templates
        for (const image of images) {
          checkAddPage(80);

          try {
            const imgWidth = pageWidth - 2 * margin;
            const imgHeight = 60;
            doc.addImage(image.url, 'JPEG', margin, yPos, imgWidth, imgHeight);
            yPos += imgHeight + 5;

            // Caption
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 100, 100);
            doc.text(image.caption, margin, yPos);
            yPos += 15;
          } catch (e) {
            console.error('Error adding image to PDF:', e);
          }
        }
      }
    }

    // Footer on each page
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${totalPages} | Generated by Tikiti`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    doc.save(`${eventName.replace(/\s+/g, '_')}_Report.pdf`);
  };

  const generateDOCX = async () => {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, AlignmentType, BorderStyle } = await import('docx');
    const { saveAs } = await import('file-saver');

    const template = templates[selectedTemplate];

    // Convert hex color to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      } : { r: 0, g: 0, b: 0 };
    };

    const primaryRgb = hexToRgb(template.primaryColor);

    const children: any[] = [];

    // Title
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: reportTitle,
            bold: true,
            size: 48,
            color: template.primaryColor.replace('#', ''),
          }),
        ],
        spacing: { after: 200 },
      })
    );

    // Subtitle
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: reportSubtitle,
            size: 24,
            color: '666666',
            italics: true,
          }),
        ],
        spacing: { after: 400 },
        border: selectedTemplate === 'professional' ? {
          bottom: {
            color: template.primaryColor.replace('#', ''),
            space: 10,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        } : undefined,
      })
    );

    // Metrics
    if (reportData.metrics && reportData.metrics.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Key Metrics',
              bold: true,
              size: 28,
              color: template.primaryColor.replace('#', ''),
            }),
          ],
          spacing: { before: 400, after: 200 },
        })
      );

      reportData.metrics.forEach((metric) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${metric.value}`,
                bold: true,
                size: 28,
              }),
              new TextRun({
                text: ` - ${metric.label}`,
                size: 22,
                color: '666666',
              }),
            ],
            spacing: { after: 100 },
          })
        );
      });
    }

    // Sections
    for (const section of sections) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: section.title,
              bold: true,
              size: 28,
              color: template.primaryColor.replace('#', ''),
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        })
      );

      // Split content into paragraphs
      const paragraphs = section.content.split('\n').filter((p) => p.trim());

      for (const para of paragraphs) {
        const cleanPara = para.replace(/\*\*/g, '').trim();
        if (cleanPara.startsWith('- ') || cleanPara.startsWith('• ')) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: cleanPara.replace(/^[-•]\s*/, ''),
                  size: 22,
                }),
              ],
              bullet: { level: 0 },
              spacing: { after: 100 },
            })
          );
        } else if (cleanPara) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: cleanPara,
                  size: 22,
                }),
              ],
              spacing: { after: 150 },
            })
          );
        }
      }
    }

    // Images section
    if (images.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Attachments',
              bold: true,
              size: 28,
              color: template.primaryColor.replace('#', ''),
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        })
      );

      for (const image of images) {
        // Add image caption
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: image.caption,
                italics: true,
                size: 20,
                color: '666666',
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );

        // Note: Adding actual images to DOCX requires the image data
        // For now, we'll add a placeholder text
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `[Image: ${image.caption}]`,
                size: 20,
                color: '999999',
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
    }

    // Footer
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '---',
            size: 20,
            color: 'CCCCCC',
          }),
        ],
        spacing: { before: 400 },
        alignment: AlignmentType.CENTER,
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Generated by Tikiti Event Management',
            size: 18,
            color: '999999',
            italics: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
      })
    );

    const doc = new Document({
      sections: [{
        properties: {},
        children,
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${eventName.replace(/\s+/g, '_')}_Report.docx`);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (exportFormat === 'pdf') {
        await generatePDF();
      } else {
        await generateDOCX();
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderPreview = () => {
    const template = templates[selectedTemplate];

    return (
      <div
        ref={previewRef}
        className="bg-white rounded-lg shadow-lg overflow-hidden"
        style={{ fontFamily: template.fontFamily }}
      >
        {/* Header */}
        <div
          className={`p-6 ${selectedTemplate === 'bold' ? 'relative overflow-hidden' : ''}`}
          style={{
            background: selectedTemplate === 'modern'
              ? `linear-gradient(135deg, ${template.primaryColor}, ${template.accentColor})`
              : selectedTemplate === 'bold'
              ? template.primaryColor
              : template.secondaryColor,
            borderBottom: selectedTemplate === 'professional'
              ? `3px solid ${template.primaryColor}`
              : selectedTemplate === 'minimal'
              ? `1px solid #e5e7eb`
              : 'none',
            minHeight: selectedTemplate === 'bold' ? '180px' : 'auto',
            paddingTop: selectedTemplate === 'bold' ? '40px' : '24px',
            paddingBottom: selectedTemplate === 'bold' ? '40px' : '24px',
          }}
        >
          {/* Bold template decorative elements */}
          {selectedTemplate === 'bold' && (
            <div className="absolute top-4 right-4 flex gap-2">
              <div className="w-8 h-16 bg-[#f97316] rounded-full" />
              <div className="w-7 h-14 bg-[#f97316] rounded-full" />
              <div className="w-6 h-12 bg-[#f97316] rounded-full" />
            </div>
          )}
          <h1
            className={`font-bold ${selectedTemplate === 'bold' ? 'text-3xl' : 'text-2xl'}`}
            style={{
              color: selectedTemplate === 'modern' || selectedTemplate === 'bold' ? 'white' : template.primaryColor,
            }}
          >
            {reportTitle}
          </h1>
          <p
            className="mt-2"
            style={{
              color: selectedTemplate === 'modern' || selectedTemplate === 'bold' ? 'rgba(255,255,255,0.8)' : '#6b7280',
            }}
          >
            {reportSubtitle}
          </p>
          {selectedTemplate === 'bold' && (
            <div className="mt-4 flex items-center gap-2">
              <div className="w-8 h-1 bg-[#f97316] rounded" />
              <span className="text-white/60 text-sm">Event Report</span>
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Metrics */}
          {reportData.metrics && reportData.metrics.length > 0 && (
            <div>
              <h2
                className={`font-semibold mb-4 ${selectedTemplate === 'bold' ? 'text-xl' : 'text-lg'}`}
                style={{ color: selectedTemplate === 'bold' ? template.accentColor : template.primaryColor }}
              >
                Key Metrics
              </h2>
              <div className={`grid gap-4 ${selectedTemplate === 'bold' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-3'}`}>
                {reportData.metrics.map((metric, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl ${
                      selectedTemplate === 'bold'
                        ? 'border border-black/10 bg-white'
                        : 'text-center p-3 bg-gray-50 rounded-lg'
                    }`}
                  >
                    <div className={`font-bold ${selectedTemplate === 'bold' ? 'text-4xl text-[#333]' : 'text-2xl'}`}>
                      {metric.value}
                    </div>
                    <div className={`mt-1 ${selectedTemplate === 'bold' ? 'text-sm text-[#86868b]' : 'text-xs text-gray-500'}`}>
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sections */}
          {sections.map((section) => (
            <div key={section.id} className="relative group">
              <div className="flex items-start justify-between">
                <div
                  className="flex-1"
                  style={{
                    borderLeft: selectedTemplate === 'minimal'
                      ? `3px solid ${template.accentColor}`
                      : 'none',
                    paddingLeft: selectedTemplate === 'minimal' ? '12px' : '0',
                  }}
                >
                  {section.isEditing ? (
                    <Input
                      value={section.title}
                      onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                      className="text-lg font-semibold mb-2"
                      style={{ color: template.primaryColor }}
                    />
                  ) : (
                    <h2
                      className="text-lg font-semibold mb-2"
                      style={{ color: template.primaryColor }}
                    >
                      {section.title}
                    </h2>
                  )}

                  {section.isEditing ? (
                    <Textarea
                      value={section.content}
                      onChange={(e) => updateSectionContent(section.id, e.target.value)}
                      rows={6}
                      className="text-sm"
                    />
                  ) : (
                    <div className="text-sm text-gray-600 whitespace-pre-wrap">
                      {section.content}
                    </div>
                  )}
                </div>

                <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleSectionEdit(section.id)}
                  >
                    {section.isEditing ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Edit3 className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500"
                    onClick={() => removeSection(section.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addNewSection}>
            + Add Section
          </Button>

          {/* Images */}
          {images.length > 0 && (
            <div>
              <h2
                className={`font-semibold mb-4 ${selectedTemplate === 'bold' ? 'text-xl' : 'text-lg'}`}
                style={{ color: selectedTemplate === 'bold' ? template.accentColor : template.primaryColor }}
              >
                {selectedTemplate === 'bold' ? 'Event Highlights' : 'Attachments'}
              </h2>
              <div className={`grid gap-4 ${selectedTemplate === 'bold' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {images.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.url}
                      alt={image.caption}
                      className={`w-full object-cover ${selectedTemplate === 'bold' ? 'h-48 rounded-xl' : 'h-40 rounded-lg'}`}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(image.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {selectedTemplate === 'bold' && (
                      <div className="mt-3">
                        <span className="text-xs font-semibold" style={{ color: template.accentColor }}>
                          HIGHLIGHT {index + 1}
                        </span>
                      </div>
                    )}
                    <Input
                      value={image.caption}
                      onChange={(e) => updateImageCaption(image.id, e.target.value)}
                      placeholder="Image caption"
                      className={`mt-1 ${selectedTemplate === 'bold' ? 'text-sm font-medium border-0 bg-transparent p-0 h-auto' : 'text-xs'}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t text-center text-xs text-gray-400">
          Generated by Tikiti Event Management
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Template</CardTitle>
          <CardDescription>Select a design template for your report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.keys(templates) as TemplateType[]).map((key) => {
              const template = templates[key];
              return (
                <div
                  key={key}
                  onClick={() => setSelectedTemplate(key)}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    selectedTemplate === key
                      ? 'border-primary shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    className="h-20 rounded-md mb-3 relative overflow-hidden"
                    style={{
                      background: key === 'modern'
                        ? `linear-gradient(135deg, ${template.primaryColor}, ${template.accentColor})`
                        : key === 'bold'
                        ? template.primaryColor
                        : template.secondaryColor,
                      borderLeft: key === 'minimal' ? `4px solid ${template.accentColor}` : 'none',
                      borderBottom: key === 'professional' ? `3px solid ${template.primaryColor}` : 'none',
                    }}
                  >
                    {key === 'bold' && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        <div className="w-3 h-6 bg-[#f97316] rounded-full" />
                        <div className="w-2.5 h-5 bg-[#f97316] rounded-full" />
                        <div className="w-2 h-4 bg-[#f97316] rounded-full" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold">{template.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Report Details */}
      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
          <CardDescription>Customize your report title and add images</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Report Title</Label>
              <Input
                id="title"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={reportSubtitle}
                onChange={(e) => setReportSubtitle(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Event Photos</Label>
            <p className="text-sm text-gray-500">
              Add photos from your event to include in the report. These will appear in the "Event Highlights" section.
            </p>

            {/* Upload area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                multiple
                className="hidden"
              />
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-700">
                Click to upload event photos
              </p>
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG up to 10MB each (max 6 images recommended)
              </p>
            </div>

            {/* Image preview grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {images.map((img, index) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={img.url}
                      alt={img.caption}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
                      <button
                        onClick={() => removeImage(img.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-sm text-gray-500">
              {images.length} of 6 images added
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Preview & Edit</CardTitle>
              <CardDescription>Review and edit your report before exporting</CardDescription>
            </div>
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="mr-2 h-4 w-4" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          </div>
        </CardHeader>
        {showPreview && (
          <CardContent>
            <div className="max-h-[600px] overflow-y-auto border rounded-lg">
              {renderPreview()}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export</CardTitle>
          <CardDescription>Choose format and download your report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={exportFormat} onValueChange={(v: 'pdf' | 'docx') => setExportFormat(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="docx">Word Document</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export {exportFormat.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
