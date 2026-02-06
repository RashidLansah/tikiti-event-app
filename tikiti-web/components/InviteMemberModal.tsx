'use client';

import { useState } from 'react';
import { X, Mail, UserPlus, Shield, Calendar, Ticket } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: string) => Promise<void>;
  organizationName: string;
}

const roles = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full access to manage team, events, and settings',
    icon: Shield,
    permissions: ['Manage team members', 'Create & edit events', 'View analytics', 'Export data']
  },
  {
    id: 'project_manager',
    name: 'Project Manager',
    description: 'Create and manage events, view analytics',
    icon: Calendar,
    permissions: ['Create & edit events', 'Manage attendees', 'View analytics', 'Scan tickets']
  },
  {
    id: 'gate_staff',
    name: 'Gate Staff',
    description: 'Scan tickets and manage check-ins',
    icon: Ticket,
    permissions: ['Scan tickets', 'View attendee list']
  }
];

export default function InviteMemberModal({
  isOpen,
  onClose,
  onInvite,
  organizationName
}: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('project_manager');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedRole = roles.find(r => r.id === role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await onInvite(email, role);
      setEmail('');
      setRole('project_manager');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-[24px] w-full max-w-lg mx-4 p-8 shadow-2xl"
        style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#f0f0f0] flex items-center justify-center hover:bg-[#e8e8e8] transition-colors"
        >
          <X className="w-5 h-5 text-[#333]" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-[16px] bg-[#f0f0f0] flex items-center justify-center">
            <UserPlus className="w-7 h-7 text-[#333]" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#333]">Invite Team Member</h2>
            <p className="text-base text-[#86868b]">Invite someone to join {organizationName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email input */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-semibold text-[#333]">
              Email Address *
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#86868b]" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="pl-12 h-12 rounded-[16px] border-black/10 bg-[#f0f0f0] focus:bg-white text-base"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Role selection */}
          <div className="space-y-2">
            <Label className="text-base font-semibold text-[#333]">
              Role *
            </Label>
            <Select value={role} onValueChange={setRole} disabled={loading}>
              <SelectTrigger className="h-12 rounded-[16px] border-black/10 bg-[#f0f0f0] text-base">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="rounded-[16px]">
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    <div className="flex items-center gap-2">
                      <r.icon className="w-4 h-4" />
                      <span>{r.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role permissions preview */}
          {selectedRole && (
            <div className="bg-[#f0f0f0] rounded-[16px] p-5">
              <div className="flex items-center gap-3 mb-3">
                <selectedRole.icon className="w-5 h-5 text-[#333]" />
                <span className="text-base font-semibold text-[#333]">{selectedRole.name}</span>
              </div>
              <p className="text-sm text-[#86868b] mb-3">{selectedRole.description}</p>
              <div className="flex flex-wrap gap-2">
                {selectedRole.permissions.map((perm, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-white rounded-full text-xs font-medium text-[#333]"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-[12px] text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-12 px-6 rounded-full text-base font-semibold bg-[#f0f0f0] text-[#333] hover:bg-[#e8e8e8] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email}
              className="flex-1 h-12 px-6 rounded-full text-base font-semibold bg-[#333] text-white hover:bg-[#444] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Send Invitation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
