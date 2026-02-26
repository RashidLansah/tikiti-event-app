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
import { Plus, Trash2, Edit, Save, Play, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Quiz, QuizQuestion, QuestionType, QuizType, QuizTrigger, TriggerType } from '@/types/engagement';
import { QuestionEditor } from './QuestionEditor';
import { TriggerConfig } from './TriggerConfig';
import { QuizPreview } from './QuizPreview';

interface QuizBuilderProps {
  initialQuiz?: Quiz;
  eventId: string;
  onSave: (quiz: Quiz) => void;
  onCancel?: () => void;
}

export function QuizBuilder({ initialQuiz, eventId, onSave, onCancel }: QuizBuilderProps) {
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<Quiz>(
    initialQuiz || {
      title: '',
      description: '',
      type: 'poll',
      questions: [],
      trigger: { type: 'manual' },
      status: 'draft',
      settings: {
        showResults: true,
        allowMultipleAttempts: false,
      },
    }
  );
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showTriggerConfig, setShowTriggerConfig] = useState(false);

  const addQuestion = (type: QuestionType) => {
    const newQuestion: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: '',
      type,
      ...(type === 'multiple_choice' ? { options: ['Option 1', 'Option 2'] } : {}),
      ...(type === 'true_false' ? { options: ['True', 'False'] } : {}),
      ...(quiz.type === 'quiz' ? { points: 1 } : {}),
    };
    setQuiz({
      ...quiz,
      questions: [...quiz.questions, newQuestion],
    });
    setEditingQuestion(newQuestion);
  };

  const updateQuestion = (questionId: string, updates: Partial<QuizQuestion>) => {
    setQuiz({
      ...quiz,
      questions: quiz.questions.map((q) =>
        q.id === questionId ? { ...q, ...updates } : q
      ),
    });
    if (editingQuestion?.id === questionId) {
      setEditingQuestion({ ...editingQuestion, ...updates });
    }
  };

  const deleteQuestion = (questionId: string) => {
    setQuiz({
      ...quiz,
      questions: quiz.questions.filter((q) => q.id !== questionId),
    });
    if (editingQuestion?.id === questionId) {
      setEditingQuestion(null);
    }
  };

  const handleSave = () => {
    // Validate
    if (!quiz.title.trim()) {
      toast({ title: 'Missing title', description: 'Please enter a title for the quiz/poll.', variant: 'destructive' });
      return;
    }
    if (quiz.questions.length === 0) {
      toast({ title: 'No questions', description: 'Please add at least one question.', variant: 'destructive' });
      return;
    }
    const invalidQuestions = quiz.questions.filter((q) => !q.question.trim());
    if (invalidQuestions.length > 0) {
      toast({ title: 'Incomplete questions', description: 'Please complete all question texts before saving.', variant: 'destructive' });
      return;
    }
    onSave(quiz);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {quiz.type === 'quiz' ? 'Quiz' : 'Poll'} Builder
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Create engaging {quiz.type === 'quiz' ? 'quizzes' : 'polls'} for your event
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
            Save {quiz.type === 'quiz' ? 'Quiz' : 'Poll'}
          </Button>
        </div>
      </div>

      {showPreview ? (
        <QuizPreview quiz={quiz} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Panel - Quiz Details & Questions */}
          <div className="space-y-4">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={quiz.type}
                    onValueChange={(value: QuizType) =>
                      setQuiz({ ...quiz, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="poll">Poll</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={quiz.title}
                    onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                    placeholder="Enter quiz/poll title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={quiz.description || ''}
                    onChange={(e) =>
                      setQuiz({ ...quiz, description: e.target.value })
                    }
                    placeholder="Enter description (optional)"
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
                      {quiz.questions.length} question
                      {quiz.questions.length !== 1 ? 's' : ''}
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
                    onClick={() => addQuestion('multiple_choice')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Multiple Choice
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addQuestion('true_false')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    True/False
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addQuestion('rating')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Rating Scale
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addQuestion('text')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Text Answer
                  </Button>
                </div>

                {/* Questions List */}
                {quiz.questions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No questions added yet</p>
                    <p className="text-sm mt-2">Click the buttons above to add questions</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {quiz.questions.map((question, index) => (
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
                            <Badge variant="outline" className="text-xs">
                              {question.type}
                            </Badge>
                            {quiz.type === 'quiz' && question.points && (
                              <Badge variant="outline" className="text-xs">
                                {question.points} pts
                              </Badge>
                            )}
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
                  <Label htmlFor="showResults">Show Results</Label>
                  <input
                    id="showResults"
                    type="checkbox"
                    checked={quiz.settings.showResults}
                    onChange={(e) =>
                      setQuiz({
                        ...quiz,
                        settings: { ...quiz.settings, showResults: e.target.checked },
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowMultipleAttempts">Allow Multiple Attempts</Label>
                  <input
                    id="allowMultipleAttempts"
                    type="checkbox"
                    checked={quiz.settings.allowMultipleAttempts}
                    onChange={(e) =>
                      setQuiz({
                        ...quiz,
                        settings: {
                          ...quiz.settings,
                          allowMultipleAttempts: e.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Trigger Configuration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Trigger Settings</CardTitle>
                    <CardDescription>When should this {quiz.type} be activated?</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTriggerConfig(!showTriggerConfig)}
                  >
                    {showTriggerConfig ? 'Hide' : 'Configure'}
                  </Button>
                </div>
              </CardHeader>
              {showTriggerConfig && (
                <CardContent>
                  <TriggerConfig
                    trigger={quiz.trigger}
                    onUpdate={(trigger) => setQuiz({ ...quiz, trigger })}
                  />
                </CardContent>
              )}
            </Card>
          </div>

          {/* Right Panel - Question Editor */}
          <div>
            {editingQuestion ? (
              <QuestionEditor
                question={editingQuestion}
                quizType={quiz.type}
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
