'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RegistrationForm } from '@/types/form';

interface FormPreviewProps {
  form: RegistrationForm;
}

export function FormPreview({ form }: FormPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Preview</CardTitle>
        <CardDescription>
          This is how your registration form will appear to attendees
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          {form.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>

              {field.type === 'text' && (
                <Input
                  id={field.id}
                  type="text"
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}

              {field.type === 'email' && (
                <Input
                  id={field.id}
                  type="email"
                  placeholder={field.placeholder || 'your@email.com'}
                  required={field.required}
                />
              )}

              {field.type === 'phone' && (
                <Input
                  id={field.id}
                  type="tel"
                  placeholder={field.placeholder || '+1234567890'}
                  required={field.required}
                />
              )}

              {field.type === 'number' && (
                <Input
                  id={field.id}
                  type="number"
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}

              {field.type === 'dropdown' && (
                <select
                  id={field.id}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  required={field.required}
                >
                  <option value="">Select an option...</option>
                  {field.options?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}

              {field.type === 'radio' && (
                <div className="space-y-2">
                  {field.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`${field.id}-${index}`}
                        name={field.id}
                        value={option}
                        required={field.required}
                        className="h-4 w-4"
                      />
                      <Label htmlFor={`${field.id}-${index}`} className="font-normal">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {field.type === 'checkbox' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={field.id}
                    required={field.required}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor={field.id} className="font-normal">
                    {field.label}
                  </Label>
                </div>
              )}

              {field.type === 'file' && (
                <Input
                  id={field.id}
                  type="file"
                  required={field.required}
                />
              )}
            </div>
          ))}

          {form.consentRequired && (
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="consent"
                  required={form.consentRequired}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="consent" className="font-normal">
                  {form.consentText || 'I agree to the terms and conditions'}
                </Label>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full">
            Submit Registration
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
