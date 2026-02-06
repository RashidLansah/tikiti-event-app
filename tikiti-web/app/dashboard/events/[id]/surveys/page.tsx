'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { surveyService } from '@/lib/services/surveyService';
import { Survey } from '@/types/engagement';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Trash2, Eye, X, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SurveyBuilder } from '@/components/surveys/SurveyBuilder';
import { SurveyResults } from '@/components/surveys/SurveyResults';

export default function SurveysPage() {
  const params = useParams();
  const { toast, toasts } = useToast();
  const eventId = params.id as string;
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [viewingResults, setViewingResults] = useState<Survey | null>(null);

  useEffect(() => {
    loadSurveys();
  }, [eventId]);

  const loadSurveys = async () => {
    setLoading(true);
    try {
      const allSurveys = await surveyService.getSurveysByEvent(eventId);
      setSurveys(allSurveys);
    } catch (error) {
      console.error('Error loading surveys:', error);
      toast({
        title: 'Error',
        description: 'Failed to load surveys',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (survey: Survey) => {
    try {
      if (editingSurvey?.id) {
        await surveyService.updateSurvey(eventId, editingSurvey.id, survey);
        toast({
          title: 'Success',
          description: 'Survey updated successfully',
        });
      } else {
        await surveyService.createSurvey(eventId, survey);
        toast({
          title: 'Success',
          description: 'Survey created successfully',
        });
      }
      setShowBuilder(false);
      setEditingSurvey(null);
      loadSurveys();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (surveyId: string) => {
    if (!confirm('Are you sure you want to delete this survey?')) return;

    try {
      await surveyService.deleteSurvey(eventId, surveyId);
      toast({
        title: 'Success',
        description: 'Survey deleted successfully',
      });
      loadSurveys();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete',
        variant: 'destructive',
      });
    }
  };

  const handlePublish = async (surveyId: string) => {
    try {
      await surveyService.publishSurvey(eventId, surveyId);
      toast({
        title: 'Success',
        description: 'Survey published successfully',
      });
      loadSurveys();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish',
        variant: 'destructive',
      });
    }
  };

  const handleClose = async (surveyId: string) => {
    try {
      await surveyService.closeSurvey(eventId, surveyId);
      toast({
        title: 'Success',
        description: 'Survey closed successfully',
      });
      loadSurveys();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to close',
        variant: 'destructive',
      });
    }
  };

  if (showBuilder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowBuilder(false);
              setEditingSurvey(null);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {editingSurvey ? 'Edit' : 'Create'} Survey
            </h1>
          </div>
        </div>

        <SurveyBuilder
          initialSurvey={editingSurvey || undefined}
          eventId={eventId}
          onSave={handleSave}
          onCancel={() => {
            setShowBuilder(false);
            setEditingSurvey(null);
          }}
        />

        {/* Toast Notifications */}
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`p-4 rounded-lg shadow-lg max-w-sm ${
                t.variant === 'destructive'
                  ? 'bg-red-50 text-red-900 border border-red-200'
                  : 'bg-green-50 text-green-900 border border-green-200'
              }`}
            >
              {t.title && <p className="font-semibold">{t.title}</p>}
              {t.description && <p className="text-sm">{t.description}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (viewingResults) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setViewingResults(null)}>
            <X className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Survey Results</h1>
            <p className="text-gray-600 mt-1">{viewingResults.title}</p>
          </div>
        </div>

        <SurveyResults eventId={eventId} survey={viewingResults} />

        {/* Toast Notifications */}
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`p-4 rounded-lg shadow-lg max-w-sm ${
                t.variant === 'destructive'
                  ? 'bg-red-50 text-red-900 border border-red-200'
                  : 'bg-green-50 text-green-900 border border-green-200'
              }`}
            >
              {t.title && <p className="font-semibold">{t.title}</p>}
              {t.description && <p className="text-sm">{t.description}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Surveys & Feedback</h1>
          <p className="text-gray-600 mt-1">
            Collect feedback from your attendees after events
          </p>
        </div>
        <Button onClick={() => setShowBuilder(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Survey
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      ) : surveys.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No surveys created yet</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowBuilder(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Survey
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {surveys.map((survey) => (
            <Card key={survey.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{survey.title}</CardTitle>
                    {survey.description && (
                      <CardDescription>{survey.description}</CardDescription>
                    )}
                  </div>
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
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{survey.questions.length} question(s)</span>
                  {survey.settings.allowAnonymous && (
                    <>
                      <span>•</span>
                      <span>Anonymous allowed</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingSurvey(survey);
                      setShowBuilder(true);
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  {survey.status === 'draft' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => survey.id && handlePublish(survey.id)}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Publish
                    </Button>
                  )}
                  {survey.status === 'active' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingResults(survey)}
                      >
                        <BarChart3 className="mr-2 h-4 w-4" />
                        View Results
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => survey.id && handleClose(survey.id)}
                      >
                        Close
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => survey.id && handleDelete(survey.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-lg shadow-lg max-w-sm ${
              t.variant === 'destructive'
                ? 'bg-red-50 text-red-900 border border-red-200'
                : 'bg-green-50 text-green-900 border border-green-200'
            }`}
          >
            {t.title && <p className="font-semibold">{t.title}</p>}
            {t.description && <p className="text-sm">{t.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
