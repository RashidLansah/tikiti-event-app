'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { engagementService } from '@/lib/services/engagementService';
import { Quiz, QuizResponse } from '@/types/engagement';
import { BarChart3, Users, TrendingUp } from 'lucide-react';

interface LiveResultsProps {
  eventId: string;
  quiz: Quiz;
}

export function LiveResults({ eventId, quiz }: LiveResultsProps) {
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (quiz.id) {
      loadResponses();
      // Poll for new responses every 5 seconds
      const interval = setInterval(loadResponses, 5000);
      return () => clearInterval(interval);
    }
  }, [eventId, quiz.id]);

  const loadResponses = async () => {
    if (!quiz.id) return;
    try {
      const quizResponses = await engagementService.getQuizResponses(eventId, quiz.id);
      setResponses(quizResponses);
    } catch (error) {
      console.error('Error loading responses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalResponses = responses.length;
  const averageScore =
    quiz.type === 'quiz' && responses.length > 0
      ? responses.reduce((sum, r) => sum + (r.totalScore || 0), 0) / responses.length
      : null;

  // Aggregate answers for multiple choice questions
  const getAnswerDistribution = (questionId: string) => {
    const distribution: Record<string, number> = {};
    responses.forEach((response) => {
      const answer = response.answers.find((a) => a.questionId === questionId);
      if (answer) {
        const answerKey = String(answer.answer);
        distribution[answerKey] = (distribution[answerKey] || 0) + 1;
      }
    });
    return distribution;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Loading results...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResponses}</div>
          </CardContent>
        </Card>

        {averageScore !== null && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageScore.toFixed(1)}</div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <Badge variant={quiz.status === 'active' ? 'default' : 'secondary'}>
              {quiz.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Question Results */}
      <div className="space-y-4">
        {quiz.questions.map((question, index) => {
          const distribution = getAnswerDistribution(question.id);
          const totalForQuestion = Object.values(distribution).reduce((sum, val) => sum + val, 0);

          return (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Q{index + 1}: {question.question}
                </CardTitle>
                <CardDescription>
                  {totalForQuestion} response{totalForQuestion !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {question.type === 'multiple_choice' || question.type === 'true_false' ? (
                  <div className="space-y-3">
                    {question.options?.map((option) => {
                      const count = distribution[option] || 0;
                      const percentage =
                        totalForQuestion > 0 ? (count / totalForQuestion) * 100 : 0;

                      return (
                        <div key={option} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{option}</span>
                            <span className="font-medium">
                              {count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {responses
                      .filter((r) =>
                        r.answers.some((a) => a.questionId === question.id)
                      )
                      .slice(0, 10)
                      .map((response, idx) => {
                        const answer = response.answers.find((a) => a.questionId === question.id);
                        return (
                          <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                            {answer?.answer || 'No answer'}
                          </div>
                        );
                      })}
                    {responses.length > 10 && (
                      <p className="text-xs text-gray-500">
                        Showing first 10 of {responses.length} responses
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Responses */}
      {responses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Responses</CardTitle>
            <CardDescription>Latest submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {responses.slice(0, 5).map((response) => (
                <div
                  key={response.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{response.userName}</p>
                    <p className="text-sm text-gray-500">
                      {response.submittedAt
                        ? typeof response.submittedAt === 'object' && 'toDate' in response.submittedAt
                          ? response.submittedAt.toDate().toLocaleString()
                          : new Date(response.submittedAt).toLocaleString()
                        : 'Just now'}
                    </p>
                  </div>
                  {response.totalScore !== undefined && (
                    <Badge variant="default">
                      {response.totalScore} points
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
