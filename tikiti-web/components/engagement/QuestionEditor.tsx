'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, X } from 'lucide-react';
import { QuizQuestion, QuizType } from '@/types/engagement';

interface QuestionEditorProps {
  question: QuizQuestion;
  quizType: QuizType;
  onUpdate: (updates: Partial<QuizQuestion>) => void;
  onClose: () => void;
}

export function QuestionEditor({
  question,
  quizType,
  onUpdate,
  onClose,
}: QuestionEditorProps) {
  const [questionText, setQuestionText] = useState(question.question);
  const [options, setOptions] = useState<string[]>(question.options || ['']);
  const [correctAnswer, setCorrectAnswer] = useState(question.correctAnswer);
  const [points, setPoints] = useState(question.points?.toString() || '1');

  const hasOptions = question.type === 'multiple_choice' || question.type === 'true_false';
  const isQuiz = quizType === 'quiz';

  useEffect(() => {
    onUpdate({
      question: questionText,
      options: hasOptions ? options.filter((opt) => opt.trim()) : undefined,
      correctAnswer: isQuiz && hasOptions ? correctAnswer : undefined,
      points: isQuiz ? parseInt(points) || 1 : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionText, options, correctAnswer, points]);

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
      // If correct answer was the removed option, reset it
      if (correctAnswer === options[index]) {
        setCorrectAnswer(undefined);
      }
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

        {/* Options for Multiple Choice and True/False */}
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
                {isQuiz && (
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={correctAnswer === option}
                    onChange={() => setCorrectAnswer(option)}
                    className="h-4 w-4"
                  />
                )}
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
            {isQuiz && (
              <p className="text-xs text-gray-500 mt-2">
                Select the radio button next to the correct answer
              </p>
            )}
          </div>
        )}

        {/* Points for Quizzes */}
        {isQuiz && (
          <div className="space-y-2">
            <Label htmlFor="points">Points</Label>
            <Input
              id="points"
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              min="1"
            />
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
