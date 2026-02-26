'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Eye, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Survey, SurveyQuestion } from '@/types/engagement';
import { SurveyQuestionEditor } from './SurveyQuestionEditor';
import { SurveyPreview } from './SurveyPreview';

interface SurveyBuilderProps {
  initialSurvey?: Survey;
  eventId: string;
  onSave: (survey: Survey) => void;
  onCancel?: () => void;
}

export function SurveyBuilder({ initialSurvey, eventId, onSave, onCancel }: SurveyBuilderProps) {
  const { toast } = useToast();
  const [survey, setSurvey] = useState<Survey>(
    initialSurvey || {
      title: '',
      description: '',
      questions: [],
      status: 'draft',
      eventId,
      settings: {
        allowAnonymous: true,
        oneResponsePerUser: true,
        showProgress: true,
      },
    }
  );
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const addQuestion = (type: SurveyQuestion['type']) => {
    const newQuestion: SurveyQuestion = {
      id: `q-${Date.now()}`,
      question: '',
      type,
      required: false,
      ...(type === 'multiple_choice' || type === 'checkbox'
        ? { options: ['Option 1', 'Option 2'] }
        : {}),
      ...(type === 'scale' || type === 'rating'
        ? { min: type === 'scale' ? 0 : 1, max: 5 }
        : {}),
    };
    setSurvey({
      ...survey,
      questions: [...survey.questions, newQuestion],
    });
    setEditingQuestion(newQuestion);
  };

  const updateQuestion = (questionId: string, updates: Partial<SurveyQuestion>) => {
    setSurvey({
      ...survey,
      questions: survey.questions.map((q) =>
        q.id === questionId ? { ...q, ...updates } : q
      ),
    });
    if (editingQuestion?.id === questionId) {
      setEditingQuestion({ ...editingQuestion, ...updates });
    }
  };

  const deleteQuestion = (questionId: string) => {
    setSurvey({
      ...survey,
      questions: survey.questions.filter((q) => q.id !== questionId),
    });
    if (editingQuestion?.id === questionId) {
      setEditingQuestion(null);
    }
  };

  const handleSave = () => {
    // Validate
    if (!survey.title.trim()) {
      toast({ title: 'Missing title', description: 'Please enter a title for the survey.', variant: 'destructive' });
      return;
    }
    if (survey.questions.length === 0) {
      toast({ title: 'No questions', description: 'Please add at least one question.', variant: 'destructive' });
      return;
    }
    const invalidQuestions = survey.questions.filter((q) => !q.question.trim());
    if (invalidQuestions.length > 0) {
      toast({ title: 'Incomplete questions', description: 'Please complete all question texts before saving.', variant: 'destructive' });
      return;
    }
    onSave(survey);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Survey Builder</h2>
          <p className="text-sm text-gray-500 mt-1">
            Create surveys to collect feedback from your attendees
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
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
            Save Survey
          </Button>
        </div>
      </div>

      {showPreview ? (
        <SurveyPreview survey={survey} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Panel - Survey Details & Questions */}
          <div className="space-y-4">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Survey Title *</Label>
                  <Input
                    id="title"
                    value={survey.title}
                    onChange={(e) => setSurvey({ ...survey, title: e.target.value })}
                    placeholder="Enter survey title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={survey.description || ''}
                    onChange={(e) =>
                      setSurvey({ ...survey, description: e.target.value })
                    }
                    placeholder="Enter survey description (optional)"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Questions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Questions</CardTitle>
                    <CardDescription>
                      {survey.questions.length} question
                      {survey.questions.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Question Buttons */}
                <div className="grid grid-cols-2 gap-2 pb-4 border-b">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addQuestion('text')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Text
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addQuestion('rating')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Rating
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addQuestion('multiple_choice')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Multiple Choice
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addQuestion('checkbox')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Checkbox
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addQuestion('scale')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Scale
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addQuestion('nps')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    NPS
                  </Button>
                </div>

                {/* Questions List */}
                {survey.questions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No questions added yet</p>
                    <p className="text-sm mt-2">Click the buttons above to add questions</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {survey.questions.map((question, index) => (
                      <div
                        key={question.id}
                        className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                          editingQuestion?.id === question.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setEditingQuestion(question)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              Q{index + 1}
                            </Badge>
                            {question.required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {question.type}
                            </Badge>
                            <span className="font-medium">
                              {question.question || `Question ${index + 1}`}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteQuestion(question.id);
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

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowAnonymous">Allow Anonymous Responses</Label>
                  <input
                    id="allowAnonymous"
                    type="checkbox"
                    checked={survey.settings.allowAnonymous}
                    onChange={(e) =>
                      setSurvey({
                        ...survey,
                        settings: { ...survey.settings, allowAnonymous: e.target.checked },
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="oneResponsePerUser">One Response Per User</Label>
                  <input
                    id="oneResponsePerUser"
                    type="checkbox"
                    checked={survey.settings.oneResponsePerUser}
                    onChange={(e) =>
                      setSurvey({
                        ...survey,
                        settings: {
                          ...survey.settings,
                          oneResponsePerUser: e.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="showProgress">Show Progress</Label>
                  <input
                    id="showProgress"
                    type="checkbox"
                    checked={survey.settings.showProgress}
                    onChange={(e) =>
                      setSurvey({
                        ...survey,
                        settings: { ...survey.settings, showProgress: e.target.checked },
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Question Editor */}
          <div>
            {editingQuestion ? (
              <SurveyQuestionEditor
                question={editingQuestion}
                onUpdate={(updates) => updateQuestion(editingQuestion.id, updates)}
                onClose={() => setEditingQuestion(null)}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <p>Select a question to edit or add a new question</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
