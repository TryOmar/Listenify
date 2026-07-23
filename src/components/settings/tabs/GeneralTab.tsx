import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { Sun, Moon, Mic, Settings, Copy, Link, Info, ExternalLink, CheckCircle } from 'lucide-react';
import { LANGUAGES } from '../../../constants/languages';

export function GeneralTab() {
  const { general, updateGeneralSettings } = useSettingsStore();
  const [showMessage, setShowMessage] = useState(false);
  const [currentMic, setCurrentMic] = useState('');

  // Function to detect the current browser
  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes("Edg")) {
      return { name: "Edge", settingsUrl: "edge://settings/content/microphone" };
    } else if (userAgent.includes("Firefox")) {
      return { name: "Firefox", settingsUrl: "about:preferences#privacy" };
    } else if (userAgent.includes("Chrome")) {
      return { name: "Chrome", settingsUrl: "chrome://settings/content/microphone" };
    } else if (userAgent.includes("Safari")) {
      return { name: "Safari", settingsUrl: "x-apple.systempreferences:com.apple.preference.security?Privacy" };
    } else if (userAgent.includes("Opera")) {
      return { name: "Opera", settingsUrl: "opera://settings/content/microphone" };
    }
    return { name: "Unknown", settingsUrl: "#" };
  };

  const browserInfo = getBrowserInfo();

  // Effect to get the currently selected microphone
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const track = stream.getAudioTracks()[0];
        const deviceId = track.getSettings().deviceId;

        navigator.mediaDevices.enumerateDevices()
          .then(devices => {
            const mic = devices.find(device => device.deviceId === deviceId);
            setCurrentMic(mic ? mic.label : 'No microphone found');
          });
      })
      .catch(error => {
        console.error('Error accessing microphone:', error);
      });
  }, []);

  return (
    <section className="space-y-6 text-slate-900 dark:text-slate-100">
      {/* Existing General Settings Section */}
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">General Settings</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Theme</label>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 rounded-md">
                Active
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Choose between light and dark mode</span>
          </div>
          <div className="flex items-center gap-2">
            <Sun size={16} className={`transition-colors ${general.theme === 'light' ? 'text-amber-500 font-bold' : 'text-slate-400'}`} />
            <button
              onClick={() => updateGeneralSettings({
                theme: general.theme === 'light' ? 'dark' : 'light'
              })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${general.theme === 'dark' ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
              role="switch"
              aria-checked={general.theme === 'dark'}
            >
              <span className="sr-only">Toggle theme</span>
              <span
                className={`${general.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs`}
              />
            </button>
            <Moon size={16} className={`transition-colors ${general.theme === 'dark' ? 'text-blue-400 font-bold' : 'text-slate-400'}`} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Speech Language</label>
            <select
              value={general.speechLanguage}
              onChange={(e) => updateGeneralSettings({ speechLanguage: e.target.value })}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Translation Language</label>
            <select
              value={general.translationLanguage}
              onChange={(e) => updateGeneralSettings({ translationLanguage: e.target.value })}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Live Transcript Font Size ({general.fontSize}px)</label>
          </div>
          <input
            type="range"
            min="6"
            max="60"
            value={general.fontSize}
            onChange={(e) => updateGeneralSettings({
              fontSize: parseInt(e.target.value)
            })}
            className="w-full accent-blue-600"
          />
        </div>

        <div className="space-y-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">AI Chat Font Size ({general.aiChatFontSize || 16}px)</label>
          </div>
          <input
            type="range"
            min="6"
            max="60"
            value={general.aiChatFontSize || 16}
            onChange={(e) => updateGeneralSettings({
              aiChatFontSize: parseInt(e.target.value)
            })}
            className="w-full accent-blue-600"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
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
            className="w-full accent-blue-600"
          />
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Break Sentences</label>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-md">Recommended</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Break text into lines by punctuation</span>
              </div>
              <button
                onClick={() => updateGeneralSettings({ breakSentences: !general.breakSentences })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${general.breakSentences ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                role="switch"
                aria-checked={general.breakSentences}
              >
                <span
                  className={`${general.breakSentences ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs`}
                />
              </button>
            </div>
          </div>

          <div className={`transition-all duration-300 ease-in-out ${general.breakSentences ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 h-0 overflow-hidden'}`}>
            <div className="ml-4 pl-4 border-l-2 border-blue-500/30 dark:border-blue-400/30">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Line Break Style</label>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Choose spacing between sentences</span>
                </div>
                <select
                  value={general.lineBreakStyle}
                  onChange={(e) => updateGeneralSettings({ lineBreakStyle: e.target.value as 'single' | 'double' })}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs sm:text-sm focus:outline-none"
                  disabled={!general.breakSentences}
                >
                  <option value="single">Single Line Break</option>
                  <option value="double">Double Line Break</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Enable Transcript Saving</label>
            <span className="text-xs text-slate-500 dark:text-slate-400">Automatically save transcript chunks to history</span>
          </div>
          <button
            onClick={() => updateGeneralSettings({ enableTranscriptSaving: !general.enableTranscriptSaving })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${general.enableTranscriptSaving ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
            role="switch"
            aria-checked={general.enableTranscriptSaving}
          >
            <span className={`${general.enableTranscriptSaving ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Translation on Hover</label>
            <span className="text-xs text-slate-500 dark:text-slate-400">Show translation popup when hovering over a word in the transcript</span>
          </div>
          <button
            onClick={() => updateGeneralSettings({ enableTranslationOnHover: !general.enableTranslationOnHover })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${general.enableTranslationOnHover ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
            role="switch"
            aria-checked={general.enableTranslationOnHover}
          >
            <span className={`${general.enableTranslationOnHover ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs`} />
          </button>
        </div>

        {/* Microphone Configuration Section */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Mic className="text-blue-600 dark:text-blue-400 text-lg" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Microphone Settings</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400">Browser:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{browserInfo.name}</span>
              </div>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
              <div className="flex items-center gap-2">
                <Mic size={15} className="text-slate-500 dark:text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400">Input:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{currentMic || 'Your Selected Microphone'}</span>
              </div>
            </div>
            <button
              onClick={() => setShowMessage(!showMessage)}
              className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/80 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/60 transition text-xs font-semibold flex items-center gap-1.5 shrink-0"
            >
              <Settings size={14} />
              Configure
            </button>
          </div>

          {showMessage && (
            <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 rounded-xl p-4 space-y-3">
              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-3">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold">
                    <Info size={16} />
                    <span>Tips for Audio Input:</span>
                </div>
                <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <div className="space-y-1">
                        <p className="font-bold text-slate-900 dark:text-slate-100">Option 1: Using Microphone</p>
                        <ul className="ml-4 list-disc text-slate-600 dark:text-slate-400 space-y-0.5">
                            <li>Select your microphone as input to capture your voice</li>
                            <li>If your microphone is near speakers, it can capture both your voice and device audio</li>
                        </ul>
                    </div>
                    
                    <div className="space-y-1">
                        <p className="font-bold text-slate-900 dark:text-slate-100">Option 2: Using Stereo Mix</p>
                        <ul className="ml-4 list-disc text-slate-600 dark:text-slate-400 space-y-0.5">
                            <li>Select "Stereo Mix" to capture all device audio output</li>
                            <li>Not available on all devices by default</li>
                        </ul>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Link size={14} className="text-slate-400 shrink-0" />
                    <span className="text-xs font-mono truncate">{browserInfo.settingsUrl}</span>
                  </div>
                  <button 
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition shrink-0"
                    onClick={() => navigator.clipboard.writeText(browserInfo.settingsUrl)}
                    title="Copy settings URL"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}