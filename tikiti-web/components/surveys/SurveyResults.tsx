'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { surveyService } from '@/lib/services/surveyService';
import { Survey, SurveyResponse } from '@/types/engagement';
import { Users, TrendingUp, FileText } from 'lucide-react';

interface SurveyResultsProps {
  eventId: string;
  survey: Survey;
}

export function SurveyResults({ eventId, survey }: SurveyResultsProps) {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (survey.id) {
      loadResponses();
    }
  }, [eventId, survey.id]);

  const loadResponses = async () => {
    if (!survey.id) return;
    try {
      const surveyResponses = await surveyService.getSurveyResponses(eventId, survey.id);
      setResponses(surveyResponses);
    } catch (error) {
      console.error('Error loading responses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalResponses = responses.length;
  const responseRate = totalResponses > 0 ? ((totalResponses / 100) * 100).toFixed(1) : '0'; // Placeholder

  // Aggregate answers for questions
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

  // Calculate average for numeric questions
  const getAverageAnswer = (questionId: string) => {
    const numericAnswers = responses
      .map((response) => {
        const answer = response.answers.find((a) => a.questionId === questionId);
        return answer ? parseFloat(answer.answer) : null;
      })
      .filter((val) => val !== null) as number[];

    if (numericAnswers.length === 0) return null;
    return numericAnswers.reduce((sum, val) => sum + val, 0) / numericAnswers.length;
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responseRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                survey.status === 'active'
                  ? 'default'
                  : survey.status === 'closed'
                  ? 'secondary'
                  : 'outline'
              }
            >
              {survey.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Question Results */}
      <div className="space-y-4">
        {survey.questions.map((question, index) => {
          const distribution = getAnswerDistribution(question.id);
          const totalForQuestion = Object.values(distribution).reduce((sum, val) => sum + val, 0);
          const average = getAverageAnswer(question.id);

          return (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Q{index + 1}: {question.question}
                </CardTitle>
                <CardDescription>
                  {totalForQuestion} response{totalForQuestion !== 1 ? 's' : ''}
                  {average !== null && ` • Average: ${average.toFixed(2)}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {question.type === 'multiple_choice' || question.type === 'checkbox' ? (
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
                ) : question.type === 'rating' || question.type === 'scale' || question.type === 'nps' ? (
                  <div className="space-y-2">
                    {average !== null && (
                      <div className="text-3xl font-bold text-primary">{average.toFixed(2)}</div>
                    )}
                    {question.type === 'nps' && (
                      <div className="grid grid-cols-11 gap-1">
                        {Array.from({ length: 11 }, (_, i) => i).map((score) => {
                          const count = distribution[score.toString()] || 0;
                          return (
                            <div key={score} className="text-center">
                              <div className="text-xs">{count}</div>
                              <div className="w-full bg-gray-200 rounded h-16 flex items-end">
                                <div
                                  className="w-full bg-primary rounded transition-all"
                                  style={{
                                    height: `${totalForQuestion > 0 ? (count / totalForQuestion) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <div className="text-xs">{score}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
                          <div key={idx} className="p-3 bg-gray-50 rounded text-sm">
                            <div className="font-medium mb-1">
                              {response.userName || response.email || 'Anonymous'}
                            </div>
                            <div>{answer?.answer || 'No answer'}</div>
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

      {/* All Responses Table */}
      {responses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Responses</CardTitle>
            <CardDescription>Complete survey responses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Respondent</th>
                    <th className="text-left p-2">Submitted</th>
                    <th className="text-left p-2">Answers</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((response) => (
                    <tr key={response.id} className="border-b">
                      <td className="p-2">
                        {response.userName || response.email || 'Anonymous'}
                      </td>
                      <td className="p-2">
                        {response.submittedAt
                          ? typeof response.submittedAt === 'object' && 'toDate' in response.submittedAt
                            ? response.submittedAt.toDate().toLocaleString()
                            : new Date(response.submittedAt).toLocaleString()
                          : 'Unknown'}
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {response.answers.map((answer, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              Q{idx + 1}: {String(answer.answer).slice(0, 20)}
                              {String(answer.answer).length > 20 ? '...' : ''}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
