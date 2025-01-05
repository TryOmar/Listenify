import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GeneralSettings {
  speechLanguage: string;
  translationLanguage: string;
  theme: 'light' | 'dark';
  fontSize: number;
  maxWords: number;
}

export interface Action {
  id: string;
  name: string;
  url: string;
  icon: string;
}

export interface AIPrompt {
  id: string;
  name: string;
  prompt: string;
  modelId: string;
  type: 'word' | 'text';  // Simplified type to clearly indicate where it should appear
}

interface SettingsState {
  general: GeneralSettings;
  actions: {
    word: Action[];    // Actions for single word clicks
    text: Action[];    // Actions for text selection
  };
  prompts: AIPrompt[];
  aiModels: {
    id: string;
    name: string;
    model: string;
    apiKey: string;
  }[];
  activeModelId: string | null;

  // Actions
  updateGeneralSettings: (settings: Partial<GeneralSettings>) => void;
  addTextAction: (action: Omit<Action, 'id'>) => void;
  removeTextAction: (id: string) => void;
  addWordAction: (action: Omit<Action, 'id'>) => void;
  removeWordAction: (id: string) => void;
  updatePrompts: (prompts: AIPrompt[]) => void;
  updateAIModels: (models: { id: string; name: string; model: string; apiKey: string; }[]) => void;
  setActiveModel: (id: string | null) => void;
  resetToDefaults: () => void;
}

// Default settings
const defaultGeneralSettings: GeneralSettings = {
  speechLanguage: 'en',
  translationLanguage: 'ar',
  theme: 'light',
  fontSize: 16,
  maxWords: 100,
};

const defaultActions = {
  word: [
    {
      id: '1',
      name: 'Google Translate',
      url: 'https://translate.google.com/?sl={speech_language_code}&tl={translation_language_code}&text={word}',
      icon: '🌐',
    },
    {
      id: '2',
      name: 'Google Images',
      url: 'https://www.google.com/search?tbm=isch&q={word}',
      icon: '🖼️',
    },
    {
      id: '3',
      name: 'Dictionary.com',
      url: 'https://www.dictionary.com/browse/{word}',
      icon: '📚',
    },
  ],
  text: [
    {
      id: '1',
      name: 'Google Translate',
      url: 'https://translate.google.com/?sl={speech_language_code}&tl={translation_language_code}&text={text}',
      icon: '🌐',
    },
  ],
};

const defaultPrompts: AIPrompt[] = [
  // Text-based prompts
  {
    id: '1',
    name: 'Translate Text',
    prompt: 'Please translate this text into English:\n\n{text}',
    modelId: '',
    type: 'text',
  },
  {
    id: '2',
    name: 'Summarize',
    prompt: 'Please summarize this text into bullet points:\n\n{text}',
    modelId: '',
    type: 'text',
  },
  {
    id: '3',
    name: 'Rephrase',
    prompt: 'Please rephrase this text in a different way while maintaining its meaning:\n\n{text}',
    modelId: '',
    type: 'text',
  },
  // Word-based prompts
  {
    id: '4',
    name: 'Definition',
    prompt: 'What is the definition of \'{word}\' in {speech_language_code}?',
    modelId: '',
    type: 'word',
  },
  {
    id: '5',
    name: 'Translate Word',
    prompt: 'Can you translate \'{word}\' into {translation_language_code}?',
    modelId: '',
    type: 'word',
  },
  {
    id: '6',
    name: 'Example Sentences',
    prompt: 'Please use \'{word}\' in example sentences in {speech_language_code}.',
    modelId: '',
    type: 'word',
  },
  {
    id: '7',
    name: 'Synonyms & Antonyms',
    prompt: 'What are synonyms and antonyms of \'{word}\' in {speech_language_code}?',
    modelId: '',
    type: 'word',
  },
  {
    id: '8',
    name: 'Word Forms',
    prompt: 'What are the different forms of \'{word}\' (e.g., noun, verb, adjective) in {speech_language_code}?',
    modelId: '',
    type: 'word',
  },
  {
    id: '9',
    name: 'Compare Words',
    prompt: 'How does \'{word}\' compare to similar words in {speech_language_code}, and what are the differences?',
    modelId: '',
    type: 'word',
  },
];

// Documentation for variables in prompts and actions
export const VARIABLES_DOC = {
  word: 'Selected single word - use in word popup prompts',
  text: 'Selected text - use in text selection prompts',
  speech_language_code: 'Speech language code (e.g., "en")',
  translation_language_code: 'Translation language code (e.g., "ar")',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      general: defaultGeneralSettings,
      actions: defaultActions,
      prompts: defaultPrompts,
      aiModels: [],
      activeModelId: null,

      updateGeneralSettings: (settings) =>
        set((state) => ({
          general: { ...state.general, ...settings },
        })),

      addTextAction: (action) =>
        set((state) => ({
          actions: {
            ...state.actions,
            text: [...state.actions.text, { ...action, id: crypto.randomUUID() }],
          },
        })),

      removeTextAction: (id) =>
        set((state) => ({
          actions: {
            ...state.actions,
            text: state.actions.text.filter(a => a.id !== id),
          },
        })),

      addWordAction: (action) =>
        set((state) => ({
          actions: {
            ...state.actions,
            word: [...state.actions.word, { ...action, id: crypto.randomUUID() }],
          },
        })),

      removeWordAction: (id) =>
        set((state) => ({
          actions: {
            ...state.actions,
            word: state.actions.word.filter(a => a.id !== id),
          },
        })),

      updatePrompts: (prompts) =>
        set({ prompts }),

      updateAIModels: (models) =>
        set({ aiModels: models }),

      setActiveModel: (id) =>
        set({ activeModelId: id }),

      resetToDefaults: () =>
        set({
          general: defaultGeneralSettings,
          actions: defaultActions,
          prompts: defaultPrompts,
          aiModels: [],
          activeModelId: null,
        }),
    }),
    {
      name: 'listenify-settings',
      version: 2,
    }
  )
);