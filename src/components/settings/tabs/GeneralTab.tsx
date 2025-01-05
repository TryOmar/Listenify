import React from 'react';
import { useSettingsStore } from '../../../store/useSettingsStore';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
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