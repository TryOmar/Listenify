import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SettingsNavButtonProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick: () => void;
}

export function SettingsNavButton({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: SettingsNavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
        active
          ? 'bg-blue-50 text-blue-600'
          : 'text-gray-600 hover:bg-gray-100'
      )}
    >
      <Icon size={20} className={active ? 'text-blue-600' : 'text-gray-500'} />
      <span className="font-medium">{label}</span>
    </button>
  );
}