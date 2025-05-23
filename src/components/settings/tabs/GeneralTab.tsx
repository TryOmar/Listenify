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
    <section className="space-y-6">
      {/* Existing General Settings Section */}
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

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Enable Transcript Saving</label>
            <span className="text-sm text-gray-600">Automatically save transcript chunks to history</span>
          </div>
          <button
            onClick={() => updateGeneralSettings({ enableTranscriptSaving: !general.enableTranscriptSaving })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${general.enableTranscriptSaving ? 'bg-blue-500' : 'bg-gray-200'}`}
            role="switch"
            aria-checked={general.enableTranscriptSaving}
          >
            <span className={`${general.enableTranscriptSaving ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
          </button>
        </div>

        {/* Moved Microphone Configuration Section */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Mic className="text-gray-700 text-lg" />
            <h3 className="text-lg font-semibold">Microphone Settings</h3>
          </div>

          <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-md">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <i className={`lucide-${browserInfo.name.toLowerCase()} text-gray-600`} />
                <span className="text-sm">
                  <span className="text-gray-500">Browser:</span>{' '}
                  <span className="font-medium">{browserInfo.name}</span>
                </span>
              </div>
              <div className="w-px h-4 bg-gray-300" /> {/* Vertical divider */}
              <div className="flex items-center gap-2">
                <Mic className="text-gray-600" />
                <span className="text-sm">
                  <span className="text-gray-500">Input:</span>{' '}
                  <span className="font-medium">{currentMic || 'Your Selected Microphone'}</span>
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowMessage(!showMessage)}
              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition text-sm flex items-center gap-1"
            >
              <Settings className="text-sm" />
              Configure
            </button>
          </div>

          {showMessage && (
            <div className="bg-blue-50 rounded-md p-3">
              <div className="text-sm text-gray-700 space-y-3">
                <div className="flex items-center gap-2 text-blue-700">
                    <Info />
                    <span className="font-medium">Tips for Audio Input:</span>
                </div>
                <div className="space-y-3 text-sm text-gray-700">
                    <div className="space-y-1.5">
                        <p className="font-medium">Option 1: Using Microphone</p>
                        <ul className="ml-4 list-disc text-gray-600">
                            <li>Select your microphone as input to capture your voice</li>
                            <li>If your microphone is near speakers, it can capture both your voice and device audio</li>
                        </ul>
                    </div>
                    
                    <div className="space-y-1.5">
                        <p className="font-medium">Option 2: Using Stereo Mix</p>
                        <ul className="ml-4 list-disc text-gray-600">
                            <li>Select "Stereo Mix" to capture all device audio output</li>
                            <li>Not available on all devices by default</li>
                            <li>Check your sound settings to enable if available</li>
                        </ul>
                    </div>

                    <div className="space-y-1.5">
                        <p className="font-medium">Option 3: Virtual Audio Cable</p>
                        <ul className="ml-4 list-disc text-gray-600">
                            <li>Install virtual audio cable software to route device audio to input</li>
                            <li>Recommended options: VB-Cable, Voicemeeter</li>
                            <li>Provides most reliable way to capture system audio</li>
                        </ul>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-blue-700">
                  <Info />
                  <span className="font-medium">How to configure:</span>
                </div>
                <ul className="list-none space-y-1.5 ml-6">
                  <li className="flex items-center gap-2">
                    <Copy className="text-gray-500 text-sm" />
                    Copy the settings URL
                  </li>
                  <li className="flex items-center gap-2">
                    <ExternalLink className="text-gray-500 text-sm" />
                    Open it in your browser
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="text-gray-500 text-sm" />
                    Select your preferred microphone
                  </li>
                </ul>
                <div className="bg-white text-gray-800 p-2 rounded flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <Link className="text-gray-500" />
                    <span className="text-sm font-mono">{browserInfo.settingsUrl}</span>
                  </div>
                  <button 
                    className="text-blue-600 hover:text-blue-700 p-1.5 rounded-md hover:bg-blue-50 transition"
                    onClick={() => navigator.clipboard.writeText(browserInfo.settingsUrl)}
                  >
                    <Copy className="text-sm" />
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