'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, Mail, Loader2 } from 'lucide-react';

interface Change {
  field: string;
  oldValue: string;
  newValue: string;
}

interface EventUpdateConfirmationModalProps {
  changes: Change[];
  onConfirm: (sendNotifications: boolean) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function EventUpdateConfirmationModal({
  changes,
  onConfirm,
  onCancel,
  loading = false,
}: EventUpdateConfirmationModalProps) {
  const [sendNotifications, setSendNotifications] = useState(true);

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      date: 'Event Date',
      time: 'Event Time',
      location: 'Venue',
      address: 'Address',
    };
    return labels[field] || field;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Confirm Event Changes</h2>
              <p className="text-sm text-gray-500">Important details have been modified</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            You&apos;re about to change important event details. Please review the changes:
          </p>

          {/* Changes List */}
          <div className="space-y-3 mb-6">
            {changes.map((change, index) => (
              <div
                key={index}
                className="bg-amber-50 rounded-xl p-4 border border-amber-200"
              >
                <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide mb-1">
                  {getFieldLabel(change.field)}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 line-through text-sm">
                    {change.oldValue || 'Not set'}
                  </span>
                  <span className="text-amber-600">→</span>
                  <span className="text-gray-900 font-medium">{change.newValue}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Notification Option */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendNotifications}
                onChange={(e) => setSendNotifications(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-[#333] focus:ring-[#333]"
              />
              <div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-900">
                    Notify attendees about these changes
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  All ticket holders will receive an email notification about the updated event
                  details.
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-full border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Go Back
            </button>
            <button
              type="button"
              onClick={() => onConfirm(sendNotifications)}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-full bg-[#333] text-white font-medium hover:bg-[#444] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Confirm Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
