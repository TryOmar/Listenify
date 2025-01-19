import React, { useState, useRef, useEffect } from 'react';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { useToastStore } from '../../../store/useToastStore';
import { Mic, ChevronDown } from 'lucide-react';

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

interface AudioDevice {
  deviceId: string;
  label: string;
}

export function GeneralTab() {
  const { general, updateGeneralSettings } = useSettingsStore();
  const { addToast } = useToastStore();
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadAudioDevices = async () => {
    if (audioDevices.length > 0) {
      setIsDropdownOpen(true);
      return;
    }
    if (isLoadingDevices) return;

    setIsLoadingDevices(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());

      await new Promise(resolve => setTimeout(resolve, 500));

      const devices = await navigator.mediaDevices.enumerateDevices();
      const cleanLabel = (label: string) => {
        return label
          .replace(/^Communications - /, '')
          .replace(/^Default - /, '')
          .trim();
      };

      // Get unique devices by cleaned label
      const uniqueDevices = new Map<string, AudioDevice>();
      devices
        .filter(device => device.kind === 'audioinput')
        .forEach(device => {
          const label = device.label || `Microphone ${device.deviceId.slice(0, 5)}...`;
          const cleanedLabel = cleanLabel(label);

          // Keep the first occurrence of each device
          if (!uniqueDevices.has(cleanedLabel)) {
            uniqueDevices.set(cleanedLabel, {
              deviceId: device.deviceId,
              label: cleanedLabel
            });
          }
        });

      setAudioDevices(Array.from(uniqueDevices.values()));
      setIsDropdownOpen(true);

      if (uniqueDevices.size === 0) {
        addToast('No audio input devices found', 'error');
      }
    } catch (error) {
      console.error('Error getting audio devices:', error);
      addToast('Failed to access microphone. Please check your permissions.', 'error');
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const handleDeviceSelect = (deviceId: string, label?: string) => {
    updateGeneralSettings({
      audioDeviceId: deviceId,
      audioDeviceLabel: label || 'Default Microphone'
    });
    setIsDropdownOpen(false);
  };

  const handleDropdownClick = () => {
    if (!audioDevices.length) {
      loadAudioDevices();
    } else {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const getSelectedLabel = () => {
    if (general.audioDeviceId === 'default') {
      return 'Default Microphone';
    }
    const selectedDevice = audioDevices.find(device => device.deviceId === general.audioDeviceId);
    return selectedDevice?.label || 'No device selected';
  };

  return (
    <section className="space-y-6">
      <h3 className="text-lg font-semibold">General Settings</h3>

      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Audio Input Device</label>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleDropdownClick}
                disabled={isLoadingDevices}
                className={`w-full px-3 py-2 pr-10 border rounded-lg text-left transition-colors duration-200 
                  ${isLoadingDevices ? 'bg-gray-50' : 'bg-white'}
                  ${isDropdownOpen ? 'border-blue-500' : 'border-gray-300'}
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {getSelectedLabel()}
              </button>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                {isLoadingDevices ? (
                  <div className="h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <Mic className={`h-4 w-4 transition-colors duration-200 
                      ${isDropdownOpen ? 'text-blue-500' : 'text-gray-500'}`} />
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 
                      ${isDropdownOpen ? 'transform rotate-180 text-blue-500' : 'text-gray-500'}`} />
                  </div>
                )}
              </div>
              {isDropdownOpen && audioDevices.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                  <div className="py-1">
                    <button
                      onClick={() => handleDeviceSelect('default')}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-100 
                        ${general.audioDeviceId === 'default' ? 'bg-blue-50 text-blue-600' : ''}`}
                    >
                      Default System Microphone
                    </button>
                    {audioDevices.length > 0 && (
                      <>
                        <div className="border-t border-gray-200 my-1"></div>
                        <div className="px-3 py-1 text-xs text-gray-500">Available Devices</div>
                      </>
                    )}
                    {audioDevices.map((device) => (
                      <button
                        key={device.deviceId}
                        onClick={() => handleDeviceSelect(device.deviceId, device.label)}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-100 
                          ${general.audioDeviceId === device.deviceId ? 'bg-blue-50 text-blue-600' : ''}`}
                      >
                        {device.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

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