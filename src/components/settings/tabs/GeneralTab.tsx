import React from 'react';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { Sun, Moon } from 'lucide-react';
import { LANGUAGES } from '../../../constants/languages';

export function GeneralTab() {
  const { general, updateGeneralSettings } = useSettingsStore();

  return (
    <section className="space-y-6">
      <h3 className="text-lg font-semibold">General Settings</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Theme</label>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 border border-gray-200 text-gray-500 rounded">Coming Soon</span>
            </div>
            <span className="text-sm text-gray-600">Choose between light and dark mode</span>
          </div>
          <div className="flex items-center gap-2">
            <Sun size={16} className={`transition-colors ${general.theme === 'light' ? 'text-blue-500' : 'text-gray-400'}`} />
            <button
              onClick={() => updateGeneralSettings({
                theme: general.theme === 'light' ? 'dark' : 'light'
              })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${general.theme === 'dark' ? 'bg-blue-500' : 'bg-gray-200'}`}
              role="switch"
              aria-checked={general.theme === 'dark'}
            >
              <span className="sr-only">Toggle theme</span>
              <span
                className={`${general.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
            <Moon size={16} className={`transition-colors ${general.theme === 'dark' ? 'text-blue-500' : 'text-gray-400'}`} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Speech Language</label>
            <select
              value={general.speechLanguage}
              onChange={(e) => updateGeneralSettings({ speechLanguage: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Translation Language</label>
            <select
              value={general.translationLanguage}
              onChange={(e) => updateGeneralSettings({ translationLanguage: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Live Transcript Font Size ({general.fontSize}px)</label>
          </div>
          <input
            type="range"
            min="6"
            max="60"
            value={general.fontSize}
            onChange={(e) => updateGeneralSettings({
              fontSize: parseInt(e.target.value)
            })}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">AI Chat Font Size ({general.aiChatFontSize || 16}px)</label>
          </div>
          <input
            type="range"
            min="6"
            max="60"
            value={general.aiChatFontSize || 16}
            onChange={(e) => updateGeneralSettings({
              aiChatFontSize: parseInt(e.target.value)
            })}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Maximum Words ({general.maxWords})
          </label>
          <input
            type="range"
            min="50"
            max="5000"
            step="50"
            value={general.maxWords}
            onChange={(e) => updateGeneralSettings({
              maxWords: parseInt(e.target.value)
            })}
            className="w-full"
          />
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Break Sentences</label>
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 border border-gray-200 text-gray-500 rounded">Edge Recommended</span>
                </div>
                <span className="text-sm text-gray-600">Break text into lines by punctuation</span>
              </div>
              <button
                onClick={() => updateGeneralSettings({ breakSentences: !general.breakSentences })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${general.breakSentences ? 'bg-blue-500' : 'bg-gray-200'}`}
                role="switch"
                aria-checked={general.breakSentences}
              >
                <span
                  className={`${general.breakSentences ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </button>
            </div>
          </div>

          <div className={`transition-all duration-300 ease-in-out ${general.breakSentences ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 h-0 overflow-hidden'}`}>
            <div className="ml-4 pl-4 border-l-2 border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Line Break Style</label>
                  <span className="text-sm text-gray-600">Choose spacing between sentences</span>
                </div>
                <select
                  value={general.lineBreakStyle}
                  onChange={(e) => updateGeneralSettings({ lineBreakStyle: e.target.value as 'single' | 'double' })}
                  className="px-3 py-1.5 border rounded-lg text-sm bg-white"
                  disabled={!general.breakSentences}
                >
                  <option value="single">Single Line Break</option>
                  <option value="double">Double Line Break</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}