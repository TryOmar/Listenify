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
        'flex items-center gap-2 sm:gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap',
        'w-auto md:w-full text-left',
        active
          ? 'bg-blue-600 text-white shadow-xs'
          : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
      )}
    >
      <Icon size={18} className={active ? 'text-white' : 'text-slate-500'} />
      <span>{label}</span>
    </button>
  );
}