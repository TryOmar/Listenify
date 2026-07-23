import { useSettingsStore } from '../store/useSettingsStore';

export const speakText = (text: string, langCode: string, onStart?: () => void, onEnd?: () => void, onError?: () => void) => {
    if (!text.trim()) return false;
    
    if (!('speechSynthesis' in window)) {
        console.error('Text-to-Speech (TTS) is not supported in this browser.');
        if (onError) onError();
        return false;
    }

    try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        
        // Apply custom voice if selected
        const { ttsVoiceURI } = useSettingsStore.getState().general;
        if (ttsVoiceURI) {
            const voices = window.speechSynthesis.getVoices();
            const selectedVoice = voices.find(v => v.voiceURI === ttsVoiceURI);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        }
        
        if (onStart) utterance.onstart = onStart;
        if (onEnd) utterance.onend = onEnd;
        if (onError) utterance.onerror = onError;
        
        window.speechSynthesis.speak(utterance);
        return true;
    } catch (e) {
        console.error('TTS error:', e);
        if (onError) onError();
        return false;
    }
};

export const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
};
