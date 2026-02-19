'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  LogOut,
  Bell,
  MessageSquare,
  FileText,
  Building2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Events', href: '/dashboard/events', icon: Calendar },
  { name: 'Attendees', href: '/dashboard/attendees', icon: Users },
  { name: 'Messages', href: '/dashboard/messaging', icon: MessageSquare },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
];

export function NewDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, userProfile, logout, currentOrganization, currentOrgRole } = useAuth();

  const userInitials = userProfile?.displayName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user?.email?.[0].toUpperCase() || 'U';

  // Get org initials for fallback logo
  const orgInitials = currentOrganization?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'TK';

  // Get branding colors (with fallbacks)
  const primaryColor = currentOrganization?.settings?.branding?.primaryColor || '#333';
  const secondaryColor = currentOrganization?.settings?.branding?.secondaryColor || '#f0f0f0';
  const logoUrl = currentOrganization?.settings?.branding?.logo;

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        backgroundColor: '#fefff7',
        fontFamily: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif'
      }}
    >
      {/* Header */}
      <header className="shrink-0 px-8 lg:px-16 xl:px-32 py-6">
        <div className="flex items-center justify-between gap-6">
          {/* Organization Logo & Name */}
          <Link href="/dashboard" className="flex items-center gap-4 hover:opacity-90 transition-opacity">
            {/* Organization Logo */}
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={currentOrganization?.name || 'Organization'}
                width={48}
                height={48}
                className="w-12 h-12 rounded-xl object-cover"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: primaryColor }}
              >
                {orgInitials}
              </div>
            )}

            {/* Organization Name */}
            <div className="flex flex-col items-start">
              <span className="text-xl font-bold text-[#333] leading-tight">
                {currentOrganization?.name || 'Tikiti'}
              </span>
              <span className="text-xs text-[#86868b]">
                Event Management
              </span>
            </div>
          </Link>

          {/* Center Navigation - Pill style */}
          <nav
            className="hidden lg:flex items-center gap-1 rounded-[40px] px-2.5 py-2.5"
            style={{ backgroundColor: secondaryColor }}
          >
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === item.href || pathname?.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-[30px] text-base transition-all duration-200',
                    isActive
                      ? 'bg-white font-semibold'
                      : 'font-medium hover:bg-white/50'
                  )}
                  style={{ color: primaryColor }}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Settings */}
            <Link
              href="/dashboard/settings"
              className="w-12 h-12 rounded-full flex items-center justify-center hover:opacity-80 transition-colors"
              style={{ backgroundColor: secondaryColor }}
            >
              <Settings className="h-5 w-5" style={{ color: primaryColor }} />
            </Link>

            {/* Notifications */}
            <button
              className="w-12 h-12 rounded-full flex items-center justify-center hover:opacity-80 transition-colors relative"
              style={{ backgroundColor: secondaryColor }}
            >
              <Bell className="h-5 w-5" style={{ color: primaryColor }} />
            </button>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                >
                  {userInitials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-lg border-black/10 p-2">
                <div className="px-3 py-3">
                  <p className="font-semibold text-[#333]">{userProfile?.displayName || 'User'}</p>
                  <p className="text-sm text-[#86868b]">{user?.email}</p>
                  {currentOrgRole && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#f0f0f0]">
                      <Building2 className="h-3 w-3 text-[#86868b]" />
                      <span className="text-xs text-[#86868b] capitalize">{currentOrgRole.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link href="/dashboard/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link href="/dashboard/settings?tab=team" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team Members
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={async () => {
                    await logout();
                    window.location.href = '/login';
                  }}
                  className="rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 px-8 lg:px-16 xl:px-32 overflow-auto">
        <div className="min-h-full pb-16">
          {children}
        </div>
      </main>
    </div>
  );
}
