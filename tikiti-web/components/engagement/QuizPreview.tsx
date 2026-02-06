'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Quiz } from '@/types/engagement';

interface QuizPreviewProps {
  quiz: Quiz;
}

export function QuizPreview({ quiz }: QuizPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{quiz.title || 'Untitled Quiz/Poll'}</CardTitle>
        {quiz.description && (
          <CardDescription>{quiz.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          {quiz.questions.map((question, index) => (
            <div key={question.id} className="space-y-2">
              <Label>
                {index + 1}. {question.question}
              </Label>

              {question.type === 'multiple_choice' && (
                <div className="space-y-2">
                  {question.options?.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center space-x-2">
                      <input
                        type="radio"
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

              {question.type === 'true_false' && (
                <div className="space-y-2">
                  {question.options?.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center space-x-2">
                      <input
                        type="radio"
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
                  {[1, 2, 3, 4, 5].map((rating) => (
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

              {question.type === 'text' && (
                <Input type="text" placeholder="Enter your answer" />
              )}
            </div>
          ))}

          <Button type="submit" className="w-full">
            Submit {quiz.type === 'quiz' ? 'Quiz' : 'Poll'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
