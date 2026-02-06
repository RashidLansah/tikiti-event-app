'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical, Eye, Save } from 'lucide-react';
import { FormField, FieldType, RegistrationForm } from '@/types/form';
import { FieldEditor } from './FieldEditor';
import { FormPreview } from './FormPreview';

interface FormBuilderProps {
  initialForm?: RegistrationForm;
  onSave: (form: RegistrationForm) => void;
  onCancel?: () => void;
}

export function FormBuilder({ initialForm, onSave, onCancel }: FormBuilderProps) {
  const [form, setForm] = useState<RegistrationForm>(
    initialForm || {
      fields: [],
      consentRequired: false,
      consentText: '',
    }
  );
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: '',
      required: false,
      placeholder: type === 'text' ? 'Enter text...' : undefined,
      ...(type === 'dropdown' || type === 'radio' ? { options: ['Option 1'] } : {}),
    };
    setForm({
      ...form,
      fields: [...form.fields, newField],
    });
    setEditingField(newField);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setForm({
      ...form,
      fields: form.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
    });
    if (editingField?.id === fieldId) {
      setEditingField({ ...editingField, ...updates });
    }
  };

  const deleteField = (fieldId: string) => {
    setForm({
      ...form,
      fields: form.fields.filter((f) => f.id !== fieldId),
    });
    if (editingField?.id === fieldId) {
      setEditingField(null);
    }
  };

  const handleSave = () => {
    // Validate that all fields have labels
    const invalidFields = form.fields.filter((f) => !f.label.trim());
    if (invalidFields.length > 0) {
      alert('Please add labels to all fields before saving.');
      return;
    }
    onSave(form);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Custom Registration Form</h2>
          <p className="text-sm text-gray-500 mt-1">
            Build a custom form for event registration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {showPreview ? 'Hide Preview' : 'Preview'}
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Form
          </Button>
        </div>
      </div>

      {showPreview ? (
        <FormPreview form={form} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Field List */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Form Fields</CardTitle>
                <CardDescription>
                  Add fields to your registration form
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Field Buttons */}
                <div className="grid grid-cols-2 gap-2 pb-4 border-b">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addField('text')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Text
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addField('email')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addField('phone')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Phone
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addField('number')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Number
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addField('dropdown')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Dropdown
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addField('radio')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Radio
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addField('checkbox')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Checkbox
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addField('file')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    File Upload
                  </Button>
                </div>

                {/* Fields List */}
                {form.fields.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No fields added yet</p>
                    <p className="text-sm mt-2">Click the buttons above to add fields</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {form.fields.map((field, index) => (
                      <div
                        key={field.id}
                        className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                          editingField?.id === field.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setEditingField(field)}
                      >
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {field.type}
                            </Badge>
                            <span className="font-medium">
                              {field.label || `Field ${index + 1}`}
                            </span>
                            {field.required && (
                              <Badge variant="outline" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteField(field.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Consent Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Consent Settings</CardTitle>
                <CardDescription>
                  Add a consent checkbox if required
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="consentRequired">Require Consent</Label>
                  <input
                    id="consentRequired"
                    type="checkbox"
                    checked={form.consentRequired}
                    onChange={(e) =>
                      setForm({ ...form, consentRequired: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </div>
                {form.consentRequired && (
                  <div className="space-y-2">
                    <Label htmlFor="consentText">Consent Text</Label>
                    <Input
                      id="consentText"
                      value={form.consentText || ''}
                      onChange={(e) =>
                        setForm({ ...form, consentText: e.target.value })
                      }
                      placeholder="I agree to the terms and conditions..."
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Field Editor */}
          <div>
            {editingField ? (
              <FieldEditor
                field={editingField}
                onUpdate={(updates) => updateField(editingField.id, updates)}
                onClose={() => setEditingField(null)}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <p>Select a field to edit its properties</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
