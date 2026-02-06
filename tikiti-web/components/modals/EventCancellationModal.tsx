'use client';

import { useState } from 'react';
import { X, AlertTriangle, Mail, Loader2 } from 'lucide-react';

interface EventCancellationModalProps {
  eventName: string;
  attendeeCount: number;
  onConfirm: (refundInfo: string, sendNotifications: boolean) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function EventCancellationModal({
  eventName,
  attendeeCount,
  onConfirm,
  onCancel,
  loading = false,
}: EventCancellationModalProps) {
  const [sendNotifications, setSendNotifications] = useState(true);
  const [refundInfo, setRefundInfo] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const canConfirm = confirmText.toLowerCase() === 'cancel';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Cancel Event</h2>
              <p className="text-sm text-gray-500">This action cannot be undone</p>
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
          {/* Warning */}
          <div className="bg-red-50 rounded-xl p-4 mb-6 border border-red-200">
            <p className="text-red-800 font-medium mb-2">
              You are about to cancel &quot;{eventName}&quot;
            </p>
            <p className="text-red-700 text-sm">
              {attendeeCount > 0 ? (
                <>
                  This event has <strong>{attendeeCount}</strong> registered attendee
                  {attendeeCount !== 1 ? 's' : ''}. They will be notified of the cancellation.
                </>
              ) : (
                'This event has no registered attendees yet.'
              )}
            </p>
          </div>

          {/* Refund Information */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refund Information (optional)
            </label>
            <textarea
              value={refundInfo}
              onChange={(e) => setRefundInfo(e.target.value)}
              placeholder="e.g., Full refunds will be processed within 5-7 business days."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#333] focus:ring-1 focus:ring-[#333] outline-none transition-colors resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              This information will be included in the cancellation email to attendees.
            </p>
          </div>

          {/* Notification Option */}
          {attendeeCount > 0 && (
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
                      Send cancellation emails to attendees
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {attendeeCount} attendee{attendeeCount !== 1 ? 's' : ''} will receive a
                    cancellation notification.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Confirmation Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">cancel</span> to
              confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type 'cancel' to confirm"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-full border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Keep Event
            </button>
            <button
              type="button"
              onClick={() => onConfirm(refundInfo, sendNotifications)}
              disabled={loading || !canConfirm}
              className="flex-1 px-4 py-3 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Event'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
