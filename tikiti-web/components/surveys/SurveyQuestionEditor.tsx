'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, X } from 'lucide-react';
import { SurveyQuestion } from '@/types/engagement';

interface SurveyQuestionEditorProps {
  question: SurveyQuestion;
  onUpdate: (updates: Partial<SurveyQuestion>) => void;
  onClose: () => void;
}

export function SurveyQuestionEditor({
  question,
  onUpdate,
  onClose,
}: SurveyQuestionEditorProps) {
  const [questionText, setQuestionText] = useState(question.question);
  const [required, setRequired] = useState(question.required);
  const [options, setOptions] = useState<string[]>(question.options || ['']);
  const [min, setMin] = useState(question.min?.toString() || '1');
  const [max, setMax] = useState(question.max?.toString() || '5');
  const [minLabel, setMinLabel] = useState(question.labels?.min || '');
  const [maxLabel, setMaxLabel] = useState(question.labels?.max || '');

  const hasOptions = question.type === 'multiple_choice' || question.type === 'checkbox';
  const hasScale = question.type === 'scale' || question.type === 'rating' || question.type === 'nps';

  useEffect(() => {
    onUpdate({
      question: questionText,
      required,
      options: hasOptions ? options.filter((opt) => opt.trim()) : undefined,
      min: hasScale ? parseInt(min) || 0 : undefined,
      max: hasScale ? parseInt(max) || 5 : undefined,
      labels:
        hasScale && (minLabel || maxLabel)
          ? {
              min: minLabel || undefined,
              max: maxLabel || undefined,
            }
          : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionText, required, options, min, max, minLabel, maxLabel]);

  const addOption = () => {
    setOptions([...options, '']);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Edit Question</CardTitle>
            <CardDescription>Configure question properties</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="questionText">Question Text *</Label>
          <textarea
            id="questionText"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Enter your question"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="required">Required</Label>
          <input
            id="required"
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
        </div>

        {/* Options for Multiple Choice and Checkbox */}
        {hasOptions && (
          <div className="space-y-2">
            <Label>Options *</Label>
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                {options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addOption}>
              <Plus className="mr-2 h-4 w-4" />
              Add Option
            </Button>
          </div>
        )}

        {/* Scale settings for Rating, Scale, and NPS */}
        {hasScale && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min">Minimum</Label>
                <Input
                  id="min"
                  type="number"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max">Maximum</Label>
                <Input
                  id="max"
                  type="number"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                  min="1"
                />
              </div>
            </div>
            {question.type === 'scale' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="minLabel">Minimum Label (optional)</Label>
                  <Input
                    id="minLabel"
                    value={minLabel}
                    onChange={(e) => setMinLabel(e.target.value)}
                    placeholder="e.g., Poor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLabel">Maximum Label (optional)</Label>
                  <Input
                    id="maxLabel"
                    value={maxLabel}
                    onChange={(e) => setMaxLabel(e.target.value)}
                    placeholder="e.g., Excellent"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Question Type Info */}
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-500">
            <strong>Type:</strong> {question.type.replace('_', ' ')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
