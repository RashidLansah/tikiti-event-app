'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Survey } from '@/types/engagement';

interface SurveyPreviewProps {
  survey: Survey;
}

export function SurveyPreview({ survey }: SurveyPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{survey.title || 'Untitled Survey'}</CardTitle>
        {survey.description && (
          <CardDescription>{survey.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {survey.settings.showProgress && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>0 / {survey.questions.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }} />
            </div>
          </div>
        )}

        <form className="space-y-6">
          {survey.questions.map((question, index) => (
            <div key={question.id} className="space-y-2">
              <Label>
                {index + 1}. {question.question}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </Label>

              {question.type === 'text' && (
                <textarea
                  placeholder="Enter your answer"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required={question.required}
                />
              )}

              {question.type === 'multiple_choice' && (
                <div className="space-y-2">
                  {question.options?.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`${question.id}-${optIndex}`}
                        name={question.id}
                        value={option}
                        required={question.required}
                        className="h-4 w-4"
                      />
                      <Label htmlFor={`${question.id}-${optIndex}`} className="font-normal">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {question.type === 'checkbox' && (
                <div className="space-y-2">
                  {question.options?.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`${question.id}-${optIndex}`}
                        name={question.id}
                        value={option}
                        className="h-4 w-4"
                      />
                      <Label htmlFor={`${question.id}-${optIndex}`} className="font-normal">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {question.type === 'rating' && (
                <div className="flex items-center gap-2">
                  {Array.from(
                    { length: (question.max || 5) - (question.min || 1) + 1 },
                    (_, i) => i + (question.min || 1)
                  ).map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-primary"
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              )}

              {question.type === 'scale' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    {question.labels?.min && (
                      <span className="text-sm text-gray-600">{question.labels.min}</span>
                    )}
                    {question.labels?.max && (
                      <span className="text-sm text-gray-600">{question.labels.max}</span>
                    )}
                  </div>
                  <input
                    type="range"
                    min={question.min || 0}
                    max={question.max || 5}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{question.min || 0}</span>
                    <span>{question.max || 5}</span>
                  </div>
                </div>
              )}

              {question.type === 'nps' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Not likely</span>
                    <span className="text-sm text-gray-600">Very likely</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 11 }, (_, i) => i).map((score) => (
                      <button
                        key={score}
                        type="button"
                        className="w-8 h-8 rounded border border-gray-300 hover:border-primary hover:bg-primary/10"
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          <Button type="submit" className="w-full">
            Submit Survey
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
