'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QuizTrigger, TriggerType } from '@/types/engagement';

interface TriggerConfigProps {
  trigger: QuizTrigger;
  onUpdate: (trigger: QuizTrigger) => void;
}

export function TriggerConfig({ trigger, onUpdate }: TriggerConfigProps) {
  const handleTypeChange = (type: TriggerType) => {
    onUpdate({
      type,
      scheduledTime: type === 'scheduled' ? trigger.scheduledTime : undefined,
      sessionId: type === 'session_end' ? trigger.sessionId : undefined,
      programTrigger: type === 'program' ? trigger.programTrigger : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Trigger Type</Label>
        <Select value={trigger.type} onValueChange={handleTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual Start</SelectItem>
            <SelectItem value="scheduled">Scheduled Time</SelectItem>
            <SelectItem value="session_end">After Session Ends</SelectItem>
            <SelectItem value="program">Program-Based Trigger</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {trigger.type === 'scheduled' && (
        <div className="space-y-2">
          <Label htmlFor="scheduledTime">Scheduled Time</Label>
          <Input
            id="scheduledTime"
            type="datetime-local"
            value={
              trigger.scheduledTime
                ? new Date(trigger.scheduledTime.toDate?.() || trigger.scheduledTime)
                    .toISOString()
                    .slice(0, 16)
                : ''
            }
            onChange={(e) =>
              onUpdate({
                ...trigger,
                scheduledTime: new Date(e.target.value),
              })
            }
          />
        </div>
      )}

      {trigger.type === 'session_end' && (
        <div className="space-y-2">
          <Label htmlFor="sessionId">Session ID</Label>
          <Input
            id="sessionId"
            value={trigger.sessionId || ''}
            onChange={(e) =>
              onUpdate({ ...trigger, sessionId: e.target.value })
            }
            placeholder="Enter session ID"
          />
          <p className="text-xs text-gray-500">
            The quiz will start when this session ends
          </p>
        </div>
      )}

      {trigger.type === 'program' && (
        <div className="space-y-2">
          <Label htmlFor="programTrigger">Program Trigger</Label>
          <Input
            id="programTrigger"
            value={trigger.programTrigger || ''}
            onChange={(e) =>
              onUpdate({ ...trigger, programTrigger: e.target.value })
            }
            placeholder="e.g., 'lunch_break'"
          />
          <p className="text-xs text-gray-500">
            Trigger based on program event or marker
          </p>
        </div>
      )}

      {trigger.type === 'manual' && (
        <p className="text-sm text-gray-500">
          You'll need to manually start this quiz/poll from the event dashboard.
        </p>
      )}
    </div>
  );
}
