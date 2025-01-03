import { create } from 'zustand';

interface TranscriptState {
  transcript: string;
  isListening: boolean;
  recognition: SpeechRecognition | null;
  setTranscript: (transcript: string) => void;
  setIsListening: (isListening: boolean) => void;
  setRecognition: (recognition: SpeechRecognition | null) => void;
  clearTranscript: () => void;
}

export const useTranscriptStore = create<TranscriptState>((set) => ({
  transcript: '',
  isListening: false,
  recognition: null,
  setTranscript: (transcript) => set({ transcript }),
  setIsListening: (isListening) => set({ isListening }),
  setRecognition: (recognition) => set({ recognition }),
  clearTranscript: () => set({ transcript: '' }),
}));