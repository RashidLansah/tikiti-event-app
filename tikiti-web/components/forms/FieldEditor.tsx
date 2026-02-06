'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Trash2 } from 'lucide-react';
import { FormField, FieldType } from '@/types/form';

interface FieldEditorProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onClose: () => void;
}

export function FieldEditor({ field, onUpdate, onClose }: FieldEditorProps) {
  const [label, setLabel] = useState(field.label);
  const [placeholder, setPlaceholder] = useState(field.placeholder || '');
  const [required, setRequired] = useState(field.required);
  const [options, setOptions] = useState<string[]>(field.options || ['']);
  const [minLength, setMinLength] = useState(field.validation?.minLength?.toString() || '');
  const [maxLength, setMaxLength] = useState(field.validation?.maxLength?.toString() || '');

  const hasOptions = field.type === 'dropdown' || field.type === 'radio';

  useEffect(() => {
    onUpdate({
      label,
      placeholder: placeholder || undefined,
      required,
      options: hasOptions ? options.filter((opt) => opt.trim()) : undefined,
      validation: {
        ...(minLength ? { minLength: parseInt(minLength) } : {}),
        ...(maxLength ? { maxLength: parseInt(maxLength) } : {}),
      },
    });
  }, [label, placeholder, required, options, minLength, maxLength]);

  const addOption = () => {
    setOptions([...options, '']);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    if (options.length > 1) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Edit Field</CardTitle>
            <CardDescription>Configure field properties</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="label">Field Label *</Label>
          <Input
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Enter field label"
            required
          />
        </div>

        {field.type !== 'checkbox' && field.type !== 'radio' && (
          <div className="space-y-2">
            <Label htmlFor="placeholder">Placeholder</Label>
            <Input
              id="placeholder"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              placeholder="Enter placeholder text"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="required">Required Field</Label>
          <input
            id="required"
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
        </div>

        {/* Options for Dropdown and Radio */}
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
                {options.length > 1 && (
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

        {/* Validation for Text Fields */}
        {(field.type === 'text' || field.type === 'email' || field.type === 'phone') && (
          <div className="space-y-4 pt-4 border-t">
            <Label>Validation Rules</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minLength">Min Length</Label>
                <Input
                  id="minLength"
                  type="number"
                  value={minLength}
                  onChange={(e) => setMinLength(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxLength">Max Length</Label>
                <Input
                  id="maxLength"
                  type="number"
                  value={maxLength}
                  onChange={(e) => setMaxLength(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
        )}

        {/* Field Type Info */}
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-500">
            <strong>Type:</strong> {field.type}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
