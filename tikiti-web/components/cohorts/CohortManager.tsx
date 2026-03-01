'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit, Calendar, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Cohort } from '@/types/cohort';

interface CohortManagerProps {
  cohorts: Record<string, Cohort>;
  eventId: string;
  onSave: (cohorts: Record<string, Cohort>) => Promise<void>;
}

const emptyCohort = (): Partial<Cohort> => ({
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  time: '',
  capacity: 50,
});

export function CohortManager({ cohorts, eventId, onSave }: CohortManagerProps) {
  const { toast } = useToast();
  const [localCohorts, setLocalCohorts] = useState<Record<string, Cohort>>(cohorts || {});
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Cohort>>(emptyCohort());
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const cohortList = Object.entries(localCohorts).sort(
    ([, a], [, b]) => a.startDate.localeCompare(b.startDate)
  );

  const openAdd = () => {
    setEditingId(null);
    setFormData(emptyCohort());
    setShowAddEdit(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setFormData({ ...localCohorts[id] });
    setShowAddEdit(true);
  };

  const handleSaveCohort = async () => {
    if (!formData.name?.trim() || !formData.startDate || !formData.capacity) {
      toast({ title: 'Missing fields', description: 'Name, start date, and capacity are required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const updated = { ...localCohorts };
      const id = editingId || `cohort-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      if (editingId && updated[editingId]) {
        // Editing existing cohort — preserve ticket counts
        updated[id] = {
          ...updated[editingId],
          name: formData.name!.trim(),
          description: formData.description?.trim() || '',
          startDate: formData.startDate!,
          endDate: formData.endDate || '',
          time: formData.time || '',
          capacity: formData.capacity!,
          availableTickets: formData.capacity! - (updated[editingId].soldTickets || 0),
        };
      } else {
        // New cohort
        updated[id] = {
          id,
          name: formData.name!.trim(),
          description: formData.description?.trim() || '',
          startDate: formData.startDate!,
          endDate: formData.endDate || '',
          time: formData.time || '',
          capacity: formData.capacity!,
          soldTickets: 0,
          availableTickets: formData.capacity!,
          status: 'active',
        };
      }

      await onSave(updated);
      setLocalCohorts(updated);
      setShowAddEdit(false);
      toast({ title: editingId ? 'Cohort updated' : 'Cohort added', variant: 'success' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save cohort', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      const updated = { ...localCohorts };
      delete updated[id];
      await onSave(updated);
      setLocalCohorts(updated);
      setDeleteConfirmId(null);
      toast({ title: 'Cohort removed', variant: 'success' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to remove cohort', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Cohorts</h3>
          <p className="text-sm text-gray-500">
            Manage separate runs of this event on different dates
          </p>
        </div>
        <Button onClick={openAdd} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Cohort
        </Button>
      </div>

      {cohortList.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <Users className="mx-auto h-10 w-10 mb-3 text-gray-400" />
            <p>No cohorts yet</p>
            <p className="text-sm mt-1">Add cohorts to run this event multiple times on different dates</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cohortList.map(([id, cohort]) => (
            <Card key={id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{cohort.name}</h4>
                      <Badge variant={cohort.status === 'active' ? 'default' : 'secondary'}>
                        {cohort.status}
                      </Badge>
                    </div>
                    {cohort.description && (
                      <p className="text-sm text-gray-500 mt-1">{cohort.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(cohort.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {cohort.endDate && cohort.endDate !== cohort.startDate && (
                          <> - {new Date(cohort.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {cohort.soldTickets}/{cohort.capacity} registered
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddEdit} onOpenChange={(val) => { if (!saving) setShowAddEdit(val); }}>
        <DialogContent className="sm:max-w-[440px] rounded-[20px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Cohort' : 'Add Cohort'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update cohort details' : 'Add a new cohort with its own dates and capacity'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. January Cohort, Morning Batch"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description for this cohort"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate || undefined}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={formData.time || ''}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Capacity *</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.capacity || ''}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAddEdit(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSaveCohort} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingId ? 'Update' : 'Add Cohort'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(val) => { if (!val) setDeleteConfirmId(null); }}
        title="Remove Cohort"
        description="Are you sure you want to remove this cohort? Existing attendees will not be removed."
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
      />
    </div>
  );
}
