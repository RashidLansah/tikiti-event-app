'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, Plus, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function OrganizationSwitcher() {
  const { organizations, currentOrganization, switchOrganization, isOrganizationOwner } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSwitch = async (orgId: string) => {
    if (orgId === currentOrganization?.id) return;
    
    setLoading(true);
    try {
      await switchOrganization(orgId);
    } catch (error) {
      console.error('Error switching organization:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentOrganization && organizations.length === 0) {
    return (
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => router.push('/dashboard/onboard')}
      >
        <Plus className="mr-2 h-4 w-4" />
        Create Organization
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between" disabled={loading}>
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate text-sm font-medium">
              {currentOrganization?.name || 'Select Organization'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSwitch(org.id!)}
            className={currentOrganization?.id === org.id ? 'bg-accent' : ''}
          >
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">{org.name}</span>
              <span className="text-xs text-gray-500 capitalize">{org.role}</span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/dashboard/onboard')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
