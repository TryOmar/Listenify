import React, { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';

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

  // Calculate style: above the word, centered
  let style: React.CSSProperties;
  if (wordRect) {
    style = {
      position: 'fixed',
      left: wordRect.left + wordRect.width / 2,
      top: wordRect.top - 8, // 8px gap above word
      transform: 'translate(-50%, -100%)',
      zIndex: 9999,
      pointerEvents: 'auto',
      minWidth: 120,
      maxWidth: 200,
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: 6,
      boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
      padding: '6px 10px',
      fontSize: 14,
      color: '#222',
      transition: 'opacity 0.1s',
      textAlign: 'center',
    };
  } else {
    style = {
      position: 'fixed',
      left: position.x,
      top: position.y - 40,
      zIndex: 9999,
      pointerEvents: 'auto',
      minWidth: 120,
      maxWidth: 200,
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: 6,
      boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
      padding: '6px 10px',
      fontSize: 14,
      color: '#222',
      transition: 'opacity 0.1s',
      textAlign: 'center',
    };
  }

  // Hide on mouse leave
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.relatedTarget as Node)) {
        onClose();
      }
    };
    const node = popupRef.current;
    if (node) node.addEventListener('mouseleave', handleMouseLeave);
    return () => { if (node) node.removeEventListener('mouseleave', handleMouseLeave); };
  }, [onClose]);

  return (
    <div ref={popupRef} style={style}>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && !error && translations.length > 0 && (
        <div>
          <div className="font-bold text-base mb-1">{translations[index]?.translation}</div>
          <div className="text-xs text-gray-500">{index + 1} / {translations.length}</div>
        </div>
      )}
      {!loading && !error && translations.length === 0 && <div>No translation found</div>}
    </div>
  );
}; 