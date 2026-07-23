import React, { useEffect, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { speakText } from '../lib/tts';

interface TranslationMatch {
  translation: string;
}

interface TranslationHoverPopupProps {
  word: string;
  position: { x: number; y: number };
  cache: Record<string, { matches: TranslationMatch[] }>;
  setCache: React.Dispatch<React.SetStateAction<Record<string, { matches: TranslationMatch[] }>>>;
  index: number;
  setIndex: (idx: number) => void;
  onClose: () => void;
  wordRect?: DOMRect; // NEW: bounding rect of the word span
}

// LRU cache helper
function updateLRUCache<T>(cache: Record<string, T>, key: string, value: T, max: number): Record<string, T> {
  const newCache = { ...cache };
  if (newCache[key]) {
    delete newCache[key]; // Remove to re-insert for LRU
  }
  newCache[key] = value;
  const keys = Object.keys(newCache);
  if (keys.length > max) {
    delete newCache[keys[0]]; // Remove oldest
  }
  return newCache;
}

export const TranslationHoverPopup: React.FC<TranslationHoverPopupProps> = ({
  word,
  position,
  cache,
  setCache,
  index,
  setIndex,
  onClose,
  wordRect,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translations, setTranslations] = useState<TranslationMatch[]>([]);

  // Always get the latest language codes from the store
  const { speechLanguage, translationLanguage } = useSettingsStore.getState().general;
  const langpair = `${speechLanguage}|${translationLanguage}`;
  const cacheKey = `${word}|${langpair}`;

  // Fetch translation if not cached
  useEffect(() => {
    let isMounted = true;
    // If cached for this word+langpair, use it and reset scroll position
    if (cache[cacheKey]) {
      const unique = (cache[cacheKey].matches || []).filter((item: TranslationMatch, idx: number, arr: TranslationMatch[]) => arr.findIndex((t: TranslationMatch) => t.translation === item.translation) === idx);
      setTranslations(unique);
      setLoading(false);
      setError(null);
      setIndex(0); // Always reset to first translation on hover
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${langpair}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        setCache(prev => updateLRUCache(prev, cacheKey, data, 20));
        const unique = (data.matches || []).filter((item: TranslationMatch, idx: number, arr: TranslationMatch[]) => arr.findIndex((t: TranslationMatch) => t.translation === item.translation) === idx);
        setTranslations(unique);
        setLoading(false);
        setIndex(0); // Always reset to first translation on fetch
      })
      .catch(() => {
        if (!isMounted) return;
        setError('Failed to fetch translation');
        setLoading(false);
      });
    return () => { isMounted = false; };
    // eslint-disable-next-line
  }, [word, setCache, cache, langpair]);

  // Global mouse wheel: cycle translations as long as popup is visible
  useEffect(() => {
    if (!translations.length) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      let newIndex = index;
      if (e.deltaY > 0) {
        newIndex = (index + 1) % translations.length;
      } else if (e.deltaY < 0) {
        newIndex = (index - 1 + translations.length) % translations.length;
      }
      setIndex(newIndex);
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [translations, setIndex, index]);

  // Keyboard navigation: left/right arrows and A/D keys
  useEffect(() => {
    if (!translations.length) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      let newIndex = index;
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        newIndex = (index + 1) % translations.length;
        setIndex(newIndex);
        e.preventDefault();
        e.stopPropagation();
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        newIndex = (index - 1 + translations.length) % translations.length;
        setIndex(newIndex);
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [translations, index, setIndex]);

  const topPos = wordRect ? wordRect.top - 8 : position.y - 40;
  const leftPos = wordRect ? wordRect.left + wordRect.width / 2 : position.x;

  return (
    <div
      ref={popupRef}
      className="fixed z-[90] pointer-events-auto min-w-[140px] max-w-[260px] bg-slate-900 dark:bg-slate-800 border border-slate-700 dark:border-slate-600 text-white rounded-2xl p-3 sm:p-4 text-center shadow-2xl dark:shadow-blue-900/20 transition-all duration-150 ring-1 ring-white/10"
      style={{
        left: leftPos,
        top: topPos - 4,
        transform: 'translate(-50%, -100%)',
      }}
    >
      {loading && <div className="text-xs text-slate-400 animate-pulse">Loading...</div>}
      {error && <div className="text-xs text-red-400 font-medium">{error}</div>}
      {!loading && !error && translations.length > 0 && (
        <div className="relative">
          <div className="flex items-center justify-center gap-2 mb-0.5">
            <div className="font-bold text-base sm:text-lg text-white">{translations[index]?.translation}</div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                speakText(translations[index]?.translation, translationLanguage);
              }}
              className="p-1 text-slate-400 hover:text-white transition-colors shrink-0"
              title="Listen to translation (TTS)"
            >
              <Volume2 size={16} />
            </button>
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">{index + 1} / {translations.length}</div>
        </div>
      )}
      {!loading && !error && translations.length === 0 && <div className="text-xs text-slate-400">No translation found</div>}
    </div>
  );
}; 