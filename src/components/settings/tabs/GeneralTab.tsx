import React from 'react';
import { useSettingsStore } from '../../../store/useSettingsStore';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
  { value: 'bn', label: 'Bengali' },
  { value: 'tr', label: 'Turkish' },
  { value: 'nl', label: 'Dutch' },
  { value: 'pl', label: 'Polish' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'th', label: 'Thai' },
  { value: 'id', label: 'Indonesian' },
  { value: 'ms', label: 'Malay' },
  { value: 'fa', label: 'Persian' },
];

export function GeneralTab() {
  const { general, updateGeneralSettings } = useSettingsStore();

  return (
    <section className="space-y-6">
      <h3 className="text-lg font-semibold">General Settings</h3>

      <div className="space-y-4">
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

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Break Sentences</label>
              <button
                onClick={() => updateGeneralSettings({ breakSentences: !general.breakSentences })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${general.breakSentences ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                role="switch"
                aria-checked={general.breakSentences}
              >
                <span
                  className={`${general.breakSentences ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </button>
            </div>
            <span className="text-sm text-gray-600">Break text into lines by punctuation</span>
          </div>

          <div className={`transition-all duration-300 ease-in-out ${general.breakSentences ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Line Break Style</label>
              <select
                value={general.lineBreakStyle}
                onChange={(e) => updateGeneralSettings({ lineBreakStyle: e.target.value as 'single' | 'double' })}
                className="px-3 py-2 border rounded-lg"
                disabled={!general.breakSentences}
              >
                <option value="single">Single Line Break</option>
                <option value="double">Double Line Break</option>
              </select>
              <span className="text-sm text-gray-600">Choose spacing between sentences</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Theme</label>
          <button
            onClick={() => updateGeneralSettings({
              theme: general.theme === 'light' ? 'dark' : 'light'
            })}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            {general.theme === 'light' ? '🌞 Light' : '🌙 Dark'}
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Font Size ({general.fontSize}px)</label>
          <input
            type="range"
            min="12"
            max="60"
            value={general.fontSize}
            onChange={(e) => updateGeneralSettings({
              fontSize: parseInt(e.target.value)
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
      </div>
    </section>
  );
}