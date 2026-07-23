import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Sliders, Wrench, MessageSquareText, Cpu, Settings as SettingsIcon, X, RotateCcw } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { GeneralTab } from './tabs/GeneralTab';
import { ActionsTab } from './tabs/ActionsTab';
import { PromptsTab } from './tabs/PromptsTab';
import { ModelsTab } from './tabs/ModelsTab';
import { SettingsNavButton } from './SettingsNavButton';

const TABS = [
  { id: 'general', label: 'General', icon: Sliders, component: GeneralTab },
  { id: 'actions', label: 'Actions', icon: Wrench, component: ActionsTab },
  { id: 'prompts', label: 'Prompts', icon: MessageSquareText, component: PromptsTab },
  { id: 'models', label: 'Models', icon: Cpu, component: ModelsTab },
] as const;

type TabId = typeof TABS[number]['id'];

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const { resetToDefaults } = useSettingsStore();

  const ActiveComponent = TABS.find(tab => tab.id === activeTab)?.component;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className="p-1.5 sm:p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          title="Settings"
        >
          <SettingsIcon size={17} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in-0 z-[100]" />
        <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[98vw] sm:w-[90vw] max-w-5xl h-[90vh] sm:h-[88vh] max-h-[850px] bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-2xl animate-in fade-in-0 zoom-in-95 z-[100] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
          <Dialog.Title className="sr-only">Settings</Dialog.Title>

          {/* Modal Header */}
          <div className="flex items-center justify-between px-3 py-2.5 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <SettingsIcon size={18} />
              </div>
              <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-slate-100">Settings</h2>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={resetToDefaults}
                className="inline-flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200/80 dark:border-slate-700"
                title="Reset to default settings"
              >
                <RotateCcw size={13} />
                <span className="hidden xs:inline">Reset Defaults</span>
              </button>
              <Dialog.Close asChild>
                <button
                  className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close settings"
                >
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Body Container */}
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            {/* Navigation Bar / Sidebar */}
            <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible p-2 md:p-4 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 shrink-0 gap-1 sm:gap-1.5 md:w-56">
              {TABS.map((tab) => (
                <SettingsNavButton
                  key={tab.id}
                  icon={tab.icon}
                  label={tab.label}
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </div>

            {/* Active Tab Content Area */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
              {ActiveComponent && <ActiveComponent />}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}