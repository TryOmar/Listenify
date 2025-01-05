import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Settings as SettingsIcon, X, RotateCcw } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { GeneralTab } from './tabs/GeneralTab';
import { WordsTab } from './tabs/WordsTab';
import { TextTab } from './tabs/TextTab';
import { PromptsTab } from './tabs/PromptsTab';
import { ModelsTab } from './tabs/ModelsTab';
import { SettingsNavButton } from './SettingsNavButton';

const TABS = [
  { id: 'general', label: 'General', icon: SettingsIcon, component: GeneralTab },
  { id: 'words', label: 'Words', icon: SettingsIcon, component: WordsTab },
  { id: 'text', label: 'Text', icon: SettingsIcon, component: TextTab },
  { id: 'prompts', label: 'Prompts', icon: SettingsIcon, component: PromptsTab },
  { id: 'models', label: 'Models', icon: SettingsIcon, component: ModelsTab },
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
        <button className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
          <SettingsIcon size={20} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-in fade-in-0 z-[100]" />
        <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-3xl max-h-[85vh] bg-white rounded-xl shadow-xl animate-in fade-in-0 zoom-in-95 z-[100]">
          <Dialog.Title className="sr-only">Settings</Dialog.Title>
          <div className="flex h-[85vh]">
            {/* Sidebar */}
            <div className="w-64 p-4 border-r border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Settings</h2>
                <button
                  onClick={resetToDefaults}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                  title="Reset to defaults"
                >
                  <RotateCcw size={20} />
                </button>
              </div>

              <nav className="space-y-1">
                {TABS.map((tab) => (
                  <SettingsNavButton
                    key={tab.id}
                    icon={tab.icon}
                    label={tab.label}
                    active={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                  />
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {ActiveComponent && <ActiveComponent />}
            </div>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}