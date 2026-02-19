'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { organizationService, Organization } from '@/lib/services/organizationService';
import { invitationService, Invitation } from '@/lib/services/invitationService';
import { getAllPlans, normalizePlanId, formatLimit, type Plan, type PlanId } from '@/lib/billing/plans';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2,
  Mail,
  Phone,
  Image,
  Bell,
  Users,
  CreditCard,
  Save,
  Upload,
  Check,
  ArrowRight,
  UserPlus,
  Clock,
  RefreshCw,
  X,
  Link2,
  Copy,
  Star,
  Zap,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/ui/toast';
import InviteMemberModal from '@/components/InviteMemberModal';

export default function SettingsPage() {
  const { currentOrganization, currentOrgRole, refreshOrganizations, user, userProfile } = useAuth();
  const { toast, toasts, dismiss } = useToast();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [orgData, setOrgData] = useState<Partial<Organization>>({});
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [activeTab, setActiveTab] = useState('general');
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Billing state
  const [billingLoading, setBillingLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const isOwnerOrAdmin = currentOrgRole === 'owner' || currentOrgRole === 'admin';
  const isOwner = currentOrgRole === 'owner';

  useEffect(() => {
    if (currentOrganization) {
      setOrgData({
        name: currentOrganization.name,
        email: currentOrganization.email || '',
        phone: currentOrganization.phone || '',
        settings: currentOrganization.settings || {
          branding: { logo: null, primaryColor: null, secondaryColor: null },
          notifications: { emailNotifications: true, pushNotifications: true, smsNotifications: false }
        }
      });
      loadMembers();
      loadInvitations();
    }
  }, [currentOrganization]);

  const loadMembers = async () => {
    if (!currentOrganization?.id) return;
    try {
      const orgMembers = await organizationService.getMembers(currentOrganization.id);
      setMembers(orgMembers);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const loadInvitations = async () => {
    if (!currentOrganization?.id) return;
    try {
      const orgInvitations = await invitationService.getByOrganization(currentOrganization.id);
      // Filter to show only pending invitations
      setInvitations(orgInvitations.filter(inv => inv.status === 'pending'));
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  // Handle Paystack callback — verify payment when redirected back
  useEffect(() => {
    const tab = searchParams.get('tab');
    const billing = searchParams.get('billing');
    const trxref = searchParams.get('trxref') || searchParams.get('reference');

    if (tab === 'subscription') {
      setActiveTab('subscription');
    }

    if (billing === 'verify' && trxref && currentOrganization?.id) {
      verifyPayment(trxref);
    }
  }, [searchParams, currentOrganization?.id]);

  const verifyPayment = async (reference: string) => {
    setVerifyingPayment(true);
    try {
      const response = await fetch('/api/billing/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference,
          orgId: currentOrganization?.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Subscription activated!',
          description: data.message || `You're now on the ${data.planName} plan.`,
          variant: 'success',
        });
        // Refresh org data to get updated subscription
        await refreshOrganizations();
      } else {
        toast({
          title: 'Payment verification failed',
          description: data.error || 'Please contact support if you were charged.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify payment. Please contact support.',
        variant: 'destructive',
      });
    } finally {
      setVerifyingPayment(false);
      // Clean URL params
      window.history.replaceState({}, '', '/dashboard/settings?tab=subscription');
    }
  };

  const handleUpgrade = async (planId: PlanId) => {
    if (!currentOrganization?.id || !isOwner) return;

    if (!currentOrganization.email) {
      toast({
        title: 'Email required',
        description: 'Please add an organization email in the General tab before upgrading.',
        variant: 'destructive',
      });
      return;
    }

    setBillingLoading(true);
    try {
      const response = await fetch('/api/billing/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          orgId: currentOrganization.id,
        }),
      });

      const data = await response.json();

      if (data.success && data.authorizationUrl) {
        // Redirect to Paystack checkout
        window.location.href = data.authorizationUrl;
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to initialize payment.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: 'Error',
        description: 'Failed to start upgrade. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBillingLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentOrganization?.id || !isOwner) return;

    setBillingLoading(true);
    try {
      const response = await fetch('/api/billing/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          orgId: currentOrganization.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Subscription cancelled',
          description: data.message,
          variant: 'success',
        });
        setShowCancelModal(false);
        await refreshOrganizations();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to cancel subscription.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBillingLoading(false);
    }
  };

  // Get current plan info
  const currentPlanId = normalizePlanId(currentOrganization?.subscription?.plan);
  const plans = getAllPlans();
  const planIcons: Record<PlanId, React.ReactNode> = {
    starter: <Zap className="w-6 h-6" />,
    pro: <Star className="w-6 h-6" />,
  };

  const handleInviteMember = async (email: string, role: string) => {
    if (!currentOrganization?.id || !user || !userProfile) {
      throw new Error('Organization or user not found');
    }

    // Create invitation
    const invitation = await invitationService.create({
      email,
      organizationId: currentOrganization.id,
      organizationName: currentOrganization.name,
      role: role as Invitation['role'],
      invitedBy: user.uid,
      inviterName: userProfile.displayName || user.email || 'Team Admin'
    });

    // Send invitation email (non-blocking — invitation is already created)
    let emailSent = false;
    try {
      const response = await fetch('/api/email/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          orgName: currentOrganization.name,
          inviterName: userProfile.displayName || user.email || 'Team Admin',
          role,
          inviteToken: invitation.token
        })
      });
      emailSent = response.ok;
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
    }

    // Reload invitations
    await loadInvitations();

    // Build invite link for manual sharing
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const inviteLink = `${baseUrl}/invite/${invitation.token}`;

    if (emailSent) {
      toast({
        title: 'Invitation sent',
        description: `An invitation has been sent to ${email}`,
        variant: 'success',
      });
    } else {
      // Copy link to clipboard automatically when email fails
      try {
        await navigator.clipboard.writeText(inviteLink);
        toast({
          title: 'Invitation created — link copied!',
          description: `Email couldn't be sent, but the invite link for ${email} has been copied to your clipboard. Share it manually.`,
          variant: 'default',
        });
      } catch {
        toast({
          title: 'Invitation created',
          description: `Email couldn't be sent. Copy the invite link from the pending invitations list below.`,
          variant: 'default',
        });
      }
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const newInvitation = await invitationService.resend(invitationId);

      // Send invitation email (non-blocking — new invitation already created)
      const invitation = invitations.find(inv => inv.id === invitationId);
      let emailSent = false;
      if (invitation) {
        try {
          const response = await fetch('/api/email/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: invitation.email,
              orgName: currentOrganization?.name,
              inviterName: userProfile?.displayName || user?.email || 'Team Admin',
              role: invitation.role,
              inviteToken: newInvitation.token
            })
          });
          emailSent = response.ok;
        } catch (emailError) {
          console.error('Failed to send resend email:', emailError);
        }
      }

      await loadInvitations();

      if (emailSent) {
        toast({
          title: 'Invitation resent',
          description: 'A new invitation has been sent',
          variant: 'success',
        });
      } else {
        // Auto-copy invite link when email fails
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        const inviteLink = `${baseUrl}/invite/${newInvitation.token}`;
        try {
          await navigator.clipboard.writeText(inviteLink);
          toast({
            title: 'Invitation renewed — link copied!',
            description: `Email couldn't be sent, but the invite link has been copied to your clipboard.`,
            variant: 'default',
          });
        } catch {
          toast({
            title: 'Invitation renewed',
            description: `Email couldn't be sent. Use the copy link button to share the invite manually.`,
            variant: 'default',
          });
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend invitation',
        variant: 'destructive',
      });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await invitationService.cancel(invitationId);
      await loadInvitations();

      toast({
        title: 'Invitation cancelled',
        description: 'The invitation has been cancelled',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel invitation',
        variant: 'destructive',
      });
    }
  };

  const handleCopyInviteLink = async (invitation: Invitation) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const inviteUrl = `${baseUrl}/invite/${invitation.token}`;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast({
        title: 'Link copied',
        description: `Invite link for ${invitation.email} copied to clipboard`,
        variant: 'success',
      });
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = inviteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast({
        title: 'Link copied',
        description: `Invite link for ${invitation.email} copied to clipboard`,
        variant: 'success',
      });
    }
  };

  const handleSaveGeneral = async () => {
    if (!currentOrganization?.id || !isOwnerOrAdmin) return;

    setSaving(true);
    try {
      await organizationService.update(currentOrganization.id, {
        name: orgData.name,
        email: orgData.email,
        phone: orgData.phone
      });
      await refreshOrganizations();
      toast({
        title: 'Settings updated',
        description: 'Your organization information has been updated successfully.',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBranding = async () => {
    if (!currentOrganization?.id || !isOwnerOrAdmin) return;

    setSaving(true);
    try {
      await organizationService.update(currentOrganization.id, {
        settings: orgData.settings
      });
      await refreshOrganizations();
      toast({
        title: 'Branding updated',
        description: 'Your branding settings have been updated successfully.',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update branding.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!currentOrganization?.id || !isOwnerOrAdmin) return;

    setSaving(true);
    try {
      await organizationService.update(currentOrganization.id, {
        settings: orgData.settings
      });
      await refreshOrganizations();
      toast({
        title: 'Notifications updated',
        description: 'Your notification preferences have been updated successfully.',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update notifications.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'branding', label: 'Branding', icon: Image },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
  ];

  const getRoleStyles = (role: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      owner: { bg: 'bg-purple-100', text: 'text-purple-800' },
      admin: { bg: 'bg-blue-100', text: 'text-blue-800' },
      member: { bg: 'bg-[#f0f0f0]', text: 'text-[#333]' },
    };
    return styles[role] || styles.member;
  };

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-extrabold text-[#333]">Settings</h1>
          <p className="text-base font-semibold text-[#333]">
            Manage organization settings
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-[#f0f0f0] rounded-[40px] p-2.5 inline-flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-[30px] text-base font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-[#333]'
                    : 'text-[#333] hover:bg-white/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <div className="bg-white border border-black/10 rounded-[24px] p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-[16px] bg-[#f0f0f0] flex items-center justify-center">
              <Building2 className="w-7 h-7 text-[#333]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#333]">Organization Information</h2>
              <p className="text-base text-[#333]">Update your organization's basic information</p>
            </div>
          </div>

          <div className="space-y-5 max-w-lg">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-semibold text-[#333]">Organization Name *</Label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#86868b]" />
                <Input
                  id="name"
                  value={orgData.name || ''}
                  onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                  className="pl-12 h-12 rounded-[16px] border-black/10 bg-[#f0f0f0] focus:bg-white text-base"
                  disabled={!isOwnerOrAdmin || saving}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-semibold text-[#333]">Organization Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#86868b]" />
                <Input
                  id="email"
                  type="email"
                  value={orgData.email || ''}
                  onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                  className="pl-12 h-12 rounded-[16px] border-black/10 bg-[#f0f0f0] focus:bg-white text-base"
                  placeholder="contact@organization.com"
                  disabled={!isOwnerOrAdmin || saving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base font-semibold text-[#333]">Organization Phone</Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#86868b]" />
                <Input
                  id="phone"
                  type="tel"
                  value={orgData.phone || ''}
                  onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                  className="pl-12 h-12 rounded-[16px] border-black/10 bg-[#f0f0f0] focus:bg-white text-base"
                  placeholder="+1234567890"
                  disabled={!isOwnerOrAdmin || saving}
                />
              </div>
            </div>

            {isOwnerOrAdmin && (
              <button
                onClick={handleSaveGeneral}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#333] text-white px-6 py-3 rounded-full text-base font-semibold hover:bg-[#444] transition-colors disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'branding' && (
        <div className="bg-white border border-black/10 rounded-[24px] p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-[16px] bg-[#f0f0f0] flex items-center justify-center">
              <Image className="w-7 h-7 text-[#333]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#333]">Branding</h2>
              <p className="text-base text-[#333]">Customize your organization's appearance</p>
            </div>
          </div>

          <div className="space-y-6 max-w-lg">
            <div className="space-y-3">
              <Label className="text-base font-semibold text-[#333]">Logo</Label>
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 border-2 border-dashed border-black/20 rounded-[16px] flex items-center justify-center bg-[#f0f0f0]">
                  {orgData.settings?.branding?.logo ? (
                    <img src={orgData.settings.branding.logo} alt="Logo" className="w-full h-full object-contain rounded-[16px]" />
                  ) : (
                    <Image className="h-8 w-8 text-[#86868b]" />
                  )}
                </div>
                <button
                  disabled={!isOwnerOrAdmin || saving}
                  className="inline-flex items-center gap-2 bg-[#f0f0f0] text-[#333] px-5 py-3 rounded-full text-base font-semibold hover:bg-[#e8e8e8] transition-colors disabled:opacity-50"
                >
                  <Upload className="w-5 h-5" />
                  Upload Logo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="primaryColor" className="text-base font-semibold text-[#333]">Primary Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={orgData.settings?.branding?.primaryColor || '#333333'}
                    onChange={(e) => setOrgData({
                      ...orgData,
                      settings: {
                        branding: {
                          ...orgData.settings?.branding,
                          primaryColor: e.target.value
                        },
                        notifications: orgData.settings?.notifications ?? { emailNotifications: true, pushNotifications: true, smsNotifications: false }
                      }
                    })}
                    className="w-12 h-12 rounded-[12px] border-black/10 p-1"
                    disabled={!isOwnerOrAdmin || saving}
                  />
                  <Input
                    type="text"
                    value={orgData.settings?.branding?.primaryColor || ''}
                    onChange={(e) => setOrgData({
                      ...orgData,
                      settings: {
                        branding: {
                          ...orgData.settings?.branding,
                          primaryColor: e.target.value
                        },
                        notifications: orgData.settings?.notifications ?? { emailNotifications: true, pushNotifications: true, smsNotifications: false }
                      }
                    })}
                    placeholder="#333333"
                    className="h-12 rounded-[16px] border-black/10 bg-[#f0f0f0] focus:bg-white text-base flex-1"
                    disabled={!isOwnerOrAdmin || saving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor" className="text-base font-semibold text-[#333]">Secondary Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={orgData.settings?.branding?.secondaryColor || '#f0f0f0'}
                    onChange={(e) => setOrgData({
                      ...orgData,
                      settings: {
                        branding: {
                          ...orgData.settings?.branding,
                          secondaryColor: e.target.value
                        },
                        notifications: orgData.settings?.notifications ?? { emailNotifications: true, pushNotifications: true, smsNotifications: false }
                      }
                    })}
                    className="w-12 h-12 rounded-[12px] border-black/10 p-1"
                    disabled={!isOwnerOrAdmin || saving}
                  />
                  <Input
                    type="text"
                    value={orgData.settings?.branding?.secondaryColor || ''}
                    onChange={(e) => setOrgData({
                      ...orgData,
                      settings: {
                        branding: {
                          ...orgData.settings?.branding,
                          secondaryColor: e.target.value
                        },
                        notifications: orgData.settings?.notifications ?? { emailNotifications: true, pushNotifications: true, smsNotifications: false }
                      }
                    })}
                    placeholder="#f0f0f0"
                    className="h-12 rounded-[16px] border-black/10 bg-[#f0f0f0] focus:bg-white text-base flex-1"
                    disabled={!isOwnerOrAdmin || saving}
                  />
                </div>
              </div>
            </div>

            {isOwnerOrAdmin && (
              <button
                onClick={handleSaveBranding}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#333] text-white px-6 py-3 rounded-full text-base font-semibold hover:bg-[#444] transition-colors disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Branding'}
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="bg-white border border-black/10 rounded-[24px] p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-[16px] bg-[#f0f0f0] flex items-center justify-center">
              <Bell className="w-7 h-7 text-[#333]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#333]">Notification Preferences</h2>
              <p className="text-base text-[#333]">Configure how you receive notifications</p>
            </div>
          </div>

          <div className="space-y-4 max-w-lg">
            <div className="flex items-center justify-between p-5 bg-[#f0f0f0] rounded-[16px]">
              <div>
                <p className="text-base font-semibold text-[#333]">Email Notifications</p>
                <p className="text-sm text-[#86868b]">Receive notifications via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={orgData.settings?.notifications?.emailNotifications ?? true}
                  onChange={(e) => setOrgData({
                    ...orgData,
                    settings: {
                      branding: orgData.settings?.branding ?? { logo: null, primaryColor: null, secondaryColor: null },
                      notifications: {
                        emailNotifications: e.target.checked,
                        pushNotifications: orgData.settings?.notifications?.pushNotifications ?? true,
                        smsNotifications: orgData.settings?.notifications?.smsNotifications ?? false
                      }
                    }
                  })}
                  disabled={!isOwnerOrAdmin || saving}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#333]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-5 bg-[#f0f0f0] rounded-[16px]">
              <div>
                <p className="text-base font-semibold text-[#333]">Push Notifications</p>
                <p className="text-sm text-[#86868b]">Receive push notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={orgData.settings?.notifications?.pushNotifications ?? true}
                  onChange={(e) => setOrgData({
                    ...orgData,
                    settings: {
                      branding: orgData.settings?.branding ?? { logo: null, primaryColor: null, secondaryColor: null },
                      notifications: {
                        emailNotifications: orgData.settings?.notifications?.emailNotifications ?? true,
                        pushNotifications: e.target.checked,
                        smsNotifications: orgData.settings?.notifications?.smsNotifications ?? false
                      }
                    }
                  })}
                  disabled={!isOwnerOrAdmin || saving}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#333]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-5 bg-[#f0f0f0] rounded-[16px]">
              <div>
                <p className="text-base font-semibold text-[#333]">SMS Notifications</p>
                <p className="text-sm text-[#86868b]">Receive notifications via SMS</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={orgData.settings?.notifications?.smsNotifications ?? false}
                  onChange={(e) => setOrgData({
                    ...orgData,
                    settings: {
                      branding: orgData.settings?.branding ?? { logo: null, primaryColor: null, secondaryColor: null },
                      notifications: {
                        emailNotifications: orgData.settings?.notifications?.emailNotifications ?? true,
                        pushNotifications: orgData.settings?.notifications?.pushNotifications ?? true,
                        smsNotifications: e.target.checked
                      }
                    }
                  })}
                  disabled={!isOwnerOrAdmin || saving}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#333]"></div>
              </label>
            </div>

            {isOwnerOrAdmin && (
              <button
                onClick={handleSaveNotifications}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#333] text-white px-6 py-3 rounded-full text-base font-semibold hover:bg-[#444] transition-colors disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="space-y-5">
          {/* Team Members Card */}
          <div className="bg-white border border-black/10 rounded-[24px] overflow-hidden">
            <div className="px-6 py-5 border-b border-black/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-[16px] bg-[#f0f0f0] flex items-center justify-center">
                  <Users className="w-7 h-7 text-[#333]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#333]">Team Members</h2>
                  <p className="text-base text-[#333]">Manage your team and their roles</p>
                </div>
              </div>
              {isOwnerOrAdmin && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center gap-2 bg-[#333] text-white px-5 py-3 rounded-full text-base font-semibold hover:bg-[#444] transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                  Invite Member
                </button>
              )}
            </div>

            <div className="divide-y divide-black/5">
              {members.map((member) => {
                const roleStyle = getRoleStyles(member.role);
                return (
                  <div key={member.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#fafafa] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#2b2525] text-white flex items-center justify-center font-extrabold text-lg">
                        {member.userProfile?.displayName?.[0] || member.userProfile?.email?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="text-base font-semibold text-[#333]">{member.userProfile?.displayName || 'No name'}</p>
                        <p className="text-sm text-[#86868b]">{member.userProfile?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${roleStyle.bg} ${roleStyle.text}`}>
                        {member.role}
                      </span>
                      {member.status === 'active' ? (
                        <span className="px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-4 py-2 rounded-full text-sm font-semibold bg-[#f0f0f0] text-[#86868b]">
                          {member.status}
                        </span>
                      )}
                      <button className="w-10 h-10 rounded-full bg-[#f0f0f0] flex items-center justify-center hover:bg-[#e8e8e8] transition-colors">
                        <ArrowRight className="w-5 h-5 text-[#333]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Invitations Card */}
          {isOwnerOrAdmin && invitations.length > 0 && (
            <div className="bg-white border border-black/10 rounded-[24px] overflow-hidden">
              <div className="px-6 py-5 border-b border-black/10 flex items-center gap-4">
                <div className="w-14 h-14 rounded-[16px] bg-amber-100 flex items-center justify-center">
                  <Clock className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#333]">Pending Invitations</h2>
                  <p className="text-base text-[#333]">{invitations.length} invitation{invitations.length !== 1 ? 's' : ''} awaiting response</p>
                </div>
              </div>

              <div className="divide-y divide-black/5">
                {invitations.map((invitation) => {
                  const roleStyle = getRoleStyles(invitation.role);
                  return (
                    <div key={invitation.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#fafafa] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-extrabold text-lg">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-[#333]">{invitation.email}</p>
                          <p className="text-sm text-[#86868b]">
                            Invited by {invitation.inviterName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${roleStyle.bg} ${roleStyle.text}`}>
                          {invitation.role.replace('_', ' ')}
                        </span>
                        <span className="px-4 py-2 rounded-full text-sm font-semibold bg-amber-100 text-amber-800">
                          Pending
                        </span>
                        <button
                          onClick={() => handleCopyInviteLink(invitation)}
                          className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors"
                          title="Copy invite link"
                        >
                          <Link2 className="w-5 h-5 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleResendInvitation(invitation.id!)}
                          className="w-10 h-10 rounded-full bg-[#f0f0f0] flex items-center justify-center hover:bg-[#e8e8e8] transition-colors"
                          title="Resend invitation"
                        >
                          <RefreshCw className="w-5 h-5 text-[#333]" />
                        </button>
                        <button
                          onClick={() => handleCancelInvitation(invitation.id!)}
                          className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                          title="Cancel invitation"
                        >
                          <X className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'subscription' && (
        <div className="space-y-5">
          {/* Payment verification banner */}
          {verifyingPayment && (
            <div className="bg-blue-50 border border-blue-200 rounded-[24px] p-6 flex items-center gap-4">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <div>
                <p className="text-base font-semibold text-blue-900">Verifying your payment...</p>
                <p className="text-sm text-blue-700">Please wait while we confirm your subscription.</p>
              </div>
            </div>
          )}

          {/* Past due warning */}
          {currentOrganization?.subscription?.status === 'past_due' && (
            <div className="bg-red-50 border border-red-200 rounded-[24px] p-6 flex items-center gap-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="text-base font-semibold text-red-900">Payment failed</p>
                <p className="text-sm text-red-700">Your last payment failed. Please update your payment method to keep your plan active.</p>
              </div>
            </div>
          )}

          {/* Current plan summary */}
          <div className="bg-white border border-black/10 rounded-[24px] p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-[16px] bg-[#f0f0f0] flex items-center justify-center">
                <CreditCard className="w-7 h-7 text-[#333]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#333]">Subscription</h2>
                <p className="text-base text-[#86868b]">Manage your plan and billing</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-[#f0f0f0] rounded-[20px] mb-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[14px] bg-white flex items-center justify-center text-[#333]">
                  {planIcons[currentPlanId]}
                </div>
                <div>
                  <p className="text-sm text-[#86868b]">Current Plan</p>
                  <p className="text-2xl font-bold text-[#333] capitalize">
                    {currentPlanId === 'starter' ? 'Free' : 'Pro'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {(currentOrganization?.subscription as any)?.cancelAtPeriodEnd && (
                  <span className="px-4 py-2 rounded-full text-sm font-semibold bg-amber-100 text-amber-800">
                    Cancels at period end
                  </span>
                )}
                <span className={`px-4 py-2 rounded-full text-base font-semibold ${
                  currentOrganization?.subscription?.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : currentOrganization?.subscription?.status === 'past_due'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-[#e8e8e8] text-[#86868b]'
                }`}>
                  {currentOrganization?.subscription?.status === 'past_due' ? 'Past Due' :
                   currentOrganization?.subscription?.status || 'Active'}
                </span>
              </div>
            </div>

            {/* Billing info for paid plans */}
            {currentPlanId !== 'starter' && currentOrganization?.subscription?.nextPaymentDate && (
              <div className="flex items-center gap-6 px-6 py-3 text-sm text-[#86868b]">
                <span>Next billing: {new Date(currentOrganization.subscription.nextPaymentDate?.seconds ? currentOrganization.subscription.nextPaymentDate.seconds * 1000 : currentOrganization.subscription.nextPaymentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            )}
          </div>

          {/* Plan comparison cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              const isUpgrade = plans.indexOf(plan) > plans.findIndex(p => p.id === currentPlanId);
              const isDowngrade = plans.indexOf(plan) < plans.findIndex(p => p.id === currentPlanId);

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white border rounded-[24px] p-6 flex flex-col ${
                    plan.highlighted && !isCurrent
                      ? 'border-[#333] border-2'
                      : isCurrent
                      ? 'border-green-300 border-2 bg-green-50/30'
                      : 'border-black/10'
                  }`}
                >
                  {/* Recommended badge */}
                  {plan.highlighted && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 bg-[#333] text-white px-4 py-1.5 rounded-full text-xs font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        Recommended
                      </span>
                    </div>
                  )}

                  {/* Current plan badge */}
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 bg-green-600 text-white px-4 py-1.5 rounded-full text-xs font-bold">
                        <Check className="w-3.5 h-3.5" />
                        Current Plan
                      </span>
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="flex items-center gap-3 mb-4 mt-2">
                    <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${
                      isCurrent ? 'bg-green-100 text-green-700' : 'bg-[#f0f0f0] text-[#333]'
                    }`}>
                      {planIcons[plan.id]}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#333]">{plan.name}</h3>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    {plan.price === 0 ? (
                      <p className="text-3xl font-extrabold text-[#333]">Free</p>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-[#333]">${plan.price}</span>
                        <span className="text-sm font-semibold text-[#86868b]">/mo</span>
                      </div>
                    )}
                    <p className="text-sm text-[#86868b] mt-1">{plan.description}</p>
                  </div>

                  {/* Limits */}
                  <div className="space-y-3 mb-6 flex-1">
                    <p className="text-xs font-bold text-[#86868b] uppercase tracking-wider">Limits</p>
                    <div className="space-y-2">
                      {[
                        { label: 'Active events', value: plan.limits.maxActiveEvents },
                        { label: 'Attendees/event', value: plan.limits.maxAttendeesPerEvent },
                        { label: 'Team members', value: plan.limits.maxTeamMembers },
                        { label: 'Speakers/event', value: plan.limits.maxSpeakersPerEvent },
                      ].map((limit) => (
                        <div key={limit.label} className="flex items-center justify-between text-sm">
                          <span className="text-[#86868b]">{limit.label}</span>
                          <span className="font-semibold text-[#333]">{formatLimit(limit.value)}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs font-bold text-[#86868b] uppercase tracking-wider pt-2">Features</p>
                    <div className="space-y-2">
                      {[
                        { label: 'AI description', enabled: plan.features.aiDescription },
                        { label: 'Bulk email', enabled: plan.features.bulkEmail },
                        { label: 'Analytics export', enabled: plan.features.analyticsExport },
                        { label: 'Custom branding', enabled: plan.features.customBranding },
                        { label: 'Priority support', enabled: plan.features.prioritySupport },
                      ].map((feature) => (
                        <div key={feature.label} className="flex items-center gap-2 text-sm">
                          {feature.enabled ? (
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                              <Check className="w-3 h-3 text-green-600" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-[#f0f0f0] flex items-center justify-center">
                              <X className="w-3 h-3 text-[#ccc]" />
                            </div>
                          )}
                          <span className={feature.enabled ? 'text-[#333]' : 'text-[#ccc]'}>
                            {feature.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="mt-auto">
                    {isCurrent ? (
                      currentPlanId !== 'starter' && isOwner ? (
                        <button
                          onClick={() => setShowCancelModal(true)}
                          disabled={billingLoading}
                          className="w-full py-3 rounded-full text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          Cancel Plan
                        </button>
                      ) : (
                        <div className="w-full py-3 rounded-full text-sm font-semibold text-center text-[#86868b] bg-[#f0f0f0]">
                          Current Plan
                        </div>
                      )
                    ) : isUpgrade && isOwner ? (
                      <button
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={billingLoading}
                        className={`w-full py-3 rounded-full text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                          plan.highlighted
                            ? 'bg-[#333] text-white hover:bg-[#444]'
                            : 'bg-[#f0f0f0] text-[#333] hover:bg-[#e8e8e8]'
                        }`}
                      >
                        {billingLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            Upgrade to {plan.name}
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    ) : !isOwner ? (
                      <div className="w-full py-3 rounded-full text-sm font-semibold text-center text-[#86868b] bg-[#f0f0f0]">
                        Only owners can manage billing
                      </div>
                    ) : (
                      <div className="w-full py-3 rounded-full text-sm font-semibold text-center text-[#86868b] bg-[#f0f0f0]">
                        {plan.name}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cancel confirmation modal */}
          {showCancelModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-[24px] p-8 max-w-md w-full mx-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-[#333]">Cancel Subscription?</h3>
                </div>
                <p className="text-base text-[#86868b] mb-6">
                  Your plan will be downgraded to the Free plan at the end of your current billing period.
                  You&apos;ll be limited to 1 active event and won&apos;t have access to priority support.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 py-3 rounded-full text-sm font-semibold bg-[#f0f0f0] text-[#333] hover:bg-[#e8e8e8] transition-colors"
                  >
                    Keep My Plan
                  </button>
                  <button
                    onClick={handleCancelSubscription}
                    disabled={billingLoading}
                    className="flex-1 py-3 rounded-full text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {billingLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Yes, Cancel'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInviteMember}
        organizationName={currentOrganization?.name || 'your organization'}
      />

      {/* Toast Notifications - Centered */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} position="top-center" />
    </div>
  );
}
