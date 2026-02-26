'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { eventService } from '@/lib/services/eventService';
import { engagementService } from '@/lib/services/engagementService';
import { Quiz } from '@/types/engagement';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowLeft, Play, Trash2, Eye, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuizBuilder } from '@/components/engagement/QuizBuilder';
import { LiveResults } from '@/components/engagement/LiveResults';

export default function EngagementPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const eventId = params.id as string;
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [polls, setPolls] = useState<Quiz[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [quizType, setQuizType] = useState<'quiz' | 'poll'>('poll');
  const [viewingResults, setViewingResults] = useState<Quiz | null>(null);

  useEffect(() => {
    loadEngagement();
  }, [eventId]);

  const loadEngagement = async () => {
    setLoading(true);
    try {
      const allItems = await engagementService.getQuizzesByEvent(eventId);
      setQuizzes(allItems.filter((q) => q.type === 'quiz'));
      setPolls(allItems.filter((q) => q.type === 'poll'));
    } catch (error) {
      console.error('Error loading engagement:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quizzes and polls',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (quiz: Quiz) => {
    try {
      if (editingQuiz?.id) {
        await engagementService.updateQuiz(eventId, editingQuiz.id, quiz);
        toast({
          title: 'Success',
          description: `${quiz.type === 'quiz' ? 'Quiz' : 'Poll'} updated successfully`,
        });
      } else {
        await engagementService.createQuiz(eventId, quiz);
        toast({
          title: 'Success',
          description: `${quiz.type === 'quiz' ? 'Quiz' : 'Poll'} created successfully`,
        });
      }
      setShowBuilder(false);
      setEditingQuiz(null);
      loadEngagement();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (quizId: string, type: string) => {
    setDeleteConfirm({ id: quizId, type });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await engagementService.deleteQuiz(eventId, deleteConfirm.id);
      toast({
        title: 'Success',
        description: `${deleteConfirm.type} deleted successfully`,
      });
      loadEngagement();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete',
        variant: 'destructive',
      });
    }
  };

  const handleStart = async (quizId: string) => {
    try {
      await engagementService.startQuiz(eventId, quizId);
      toast({
        title: 'Success',
        description: 'Quiz/Poll started successfully',
      });
      loadEngagement();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start',
        variant: 'destructive',
      });
    }
  };

  if (showBuilder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => {
            setShowBuilder(false);
            setEditingQuiz(null);
          }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {editingQuiz ? 'Edit' : 'Create'} {quizType === 'quiz' ? 'Quiz' : 'Poll'}
            </h1>
          </div>
        </div>

        <QuizBuilder
          initialQuiz={editingQuiz || undefined}
          eventId={eventId}
          onSave={handleSave}
          onCancel={() => {
            setShowBuilder(false);
            setEditingQuiz(null);
          }}
        />

      </div>
    );
  }

  if (viewingResults) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setViewingResults(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Live Results</h1>
            <p className="text-gray-600 mt-1">{viewingResults.title}</p>
          </div>
        </div>

        <LiveResults eventId={eventId} quiz={viewingResults} />

      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Engagement</h1>
          <p className="text-gray-600 mt-1">
            Create quizzes and polls to engage your attendees
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setQuizType('poll');
              setShowBuilder(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Poll
          </Button>
          <Button
            onClick={() => {
              setQuizType('quiz');
              setShowBuilder(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Quiz
          </Button>
        </div>
      </div>

      <Tabs defaultValue="polls" className="space-y-6">
        <TabsList>
          <TabsTrigger value="polls">Polls ({polls.length})</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes ({quizzes.length})</TabsTrigger>
        </TabsList>

        {/* Polls Tab */}
        <TabsContent value="polls">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : polls.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No polls created yet</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setQuizType('poll');
                    setShowBuilder(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Poll
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {polls.map((poll) => (
                <Card key={poll.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{poll.title}</CardTitle>
                        {poll.description && (
                          <CardDescription>{poll.description}</CardDescription>
                        )}
                      </div>
                      <Badge
                        variant={
                          poll.status === 'active'
                            ? 'default'
                            : poll.status === 'completed'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {poll.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{poll.questions.length} question(s)</span>
                      <span>•</span>
                      <span>{poll.trigger.type} trigger</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingQuiz(poll);
                          setShowBuilder(true);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      {poll.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingResults(poll)}
                        >
                          <BarChart3 className="mr-2 h-4 w-4" />
                          View Results
                        </Button>
                      )}
                      {poll.status !== 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => poll.id && handleStart(poll.id)}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Start
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => poll.id && handleDelete(poll.id, 'poll')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : quizzes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No quizzes created yet</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setQuizType('quiz');
                    setShowBuilder(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Quiz
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {quizzes.map((quiz) => (
                <Card key={quiz.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{quiz.title}</CardTitle>
                        {quiz.description && (
                          <CardDescription>{quiz.description}</CardDescription>
                        )}
                      </div>
                      <Badge
                        variant={
                          quiz.status === 'active'
                            ? 'default'
                            : quiz.status === 'completed'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {quiz.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{quiz.questions.length} question(s)</span>
                      <span>•</span>
                      <span>
                        {quiz.questions.reduce((sum, q) => sum + (q.points || 0), 0)} points
                      </span>
                      <span>•</span>
                      <span>{quiz.trigger.type} trigger</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingQuiz(quiz);
                          setShowBuilder(true);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      {quiz.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingResults(quiz)}
                        >
                          <BarChart3 className="mr-2 h-4 w-4" />
                          View Results
                        </Button>
                      )}
                      {quiz.status !== 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => quiz.id && handleStart(quiz.id)}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Start
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => quiz.id && handleDelete(quiz.id, 'quiz')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title={`Delete ${deleteConfirm?.type || 'item'}`}
        description={`Are you sure you want to delete this ${deleteConfirm?.type || 'item'}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
