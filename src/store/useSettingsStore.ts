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
  // Text-based prompts (using {text})
  {
    id: '1',
    name: 'Translate Text',
    prompt: 'Translate the following text from {speech_language_code} to {translation_language_code}:\n\n{text}',
    modelId: '',
    type: 'text',
  },
  {
    id: '2',
    name: 'Summarize',
    prompt: 'Summarize the following text in {speech_language_code}:\n\n{text}',
    modelId: '',
    type: 'text',
  },
  {
    id: '3',
    name: 'Rephrase',
    prompt: 'Rephrase the following text in {speech_language_code} while maintaining its meaning:\n\n{text}',
    modelId: '',
    type: 'text',
  },
  {
    id: '4',
    name: 'Explain',
    prompt: 'Explain the following text in simple terms in {speech_language_code}:\n\n{text}',
    modelId: '',
    type: 'text',
  },
  // Word-based prompts (using {word})
  {
    id: '5',
    name: 'Definition',
    prompt: 'What is the definition of \'{word}\' in {speech_language_code}?',
    modelId: '',
    type: 'word',
  },
  {
    id: '6',
    name: 'Translation',
    prompt: 'Translate the word \'{word}\' from {speech_language_code} to {translation_language_code}.',
    modelId: '',
    type: 'word',
  },
  {
    id: '7',
    name: 'Example Sentences',
    prompt: 'Provide 3 example sentences using the word \'{word}\' in {speech_language_code}.',
    modelId: '',
    type: 'word',
  },
  {
    id: '8',
    name: 'Synonyms & Antonyms',
    prompt: 'List the synonyms and antonyms of \'{word}\' in {speech_language_code}.',
    modelId: '',
    type: 'word',
  },
  {
    id: '9',
    name: 'Word Forms',
    prompt: 'Show all grammatical forms of the word \'{word}\' in {speech_language_code} (noun, verb, adjective, etc.).',
    modelId: '',
    type: 'word',
  },
  {
    id: '10',
    name: 'Word Usage',
    prompt: 'Explain how to properly use \'{word}\' in {speech_language_code}, including common collocations and phrases.',
    modelId: '',
    type: 'word',
  },
  {
    id: '11',
    name: 'Grammar Correction',
    prompt: 'Correct any grammatical errors in the following text in {speech_language_code}:\n\n{text}',
    modelId: '',
    type: 'text',
  },
  {
    id: '12',
    name: 'Tone Adjustment',
    prompt: 'Rewrite the following text in a more formal tone in {speech_language_code}:\n\n{text}',
    modelId: '',
    type: 'text',
  },
  {
    id: '13',
    name: 'Question Generation',
    prompt: 'Generate comprehension questions based on the following text in {speech_language_code}:\n\n{text}',
    modelId: '',
    type: 'text',
  },
  {
    id: '14',
    name: 'Idiomatic Expressions Explanation',
    prompt: 'Identify and explain any idiomatic expressions in the following text in {speech_language_code}:\n\n{text}',
    modelId: '',
    type: 'text',
  },
  {
    id: '15',
    name: 'Paraphrase in Different Style',
    prompt: 'Paraphrase the following text in a more casual style in {speech_language_code}:\n\n{text}',
    modelId: '',
    type: 'text',
  },

  // Additional Word-based prompts (using {word})
  {
    id: '16',
    name: 'Pronunciation Guide',
    prompt: 'Provide a pronunciation guide for \'{word}\' in {speech_language_code}, including phonetic transcription and audio references if possible.',
    modelId: '',
    type: 'word',
  },
  {
    id: '17',
    name: 'Etymology',
    prompt: 'Explain the origin and historical development of the word \'{word}\' in {speech_language_code}.',
    modelId: '',
    type: 'word',
  },
  {
    id: '18',
    name: 'Collocations',
    prompt: 'List common collocations for the word \'{word}\' in {speech_language_code}.',
    modelId: '',
    type: 'word',
  },
  {
    id: '19',
    name: 'Common Mistakes',
    prompt: 'What are common mistakes made when using the word \'{word}\' in {speech_language_code}?',
    modelId: '',
    type: 'word',
  },
  {
    id: '20',
    name: 'Idioms and Phrases',
    prompt: 'Provide idioms or phrases that include the word \'{word}\' in {speech_language_code}.',
    modelId: '',
    type: 'word',
  },
  {
    id: '21',
    name: 'Word Family',
    prompt: 'List related words to \'{word}\' in {speech_language_code}, such as derivatives and compound words.',
    modelId: '',
    type: 'word',
  },
  {
    id: '22',
    name: 'Cultural Context',
    prompt: 'Explain any cultural nuances or contexts associated with the word \'{word}\' in {speech_language_code}.',
    modelId: '',
    type: 'word',
  },
  {
    id: '23',
    name: 'Usage in Idioms',
    prompt: 'Provide idiomatic expressions that feature the word \'{word}\' in {speech_language_code} and explain their meanings.',
    modelId: '',
    type: 'word',
  },
  {
    id: '24',
    name: 'Practice Exercises',
    prompt: 'Create fill-in-the-blank sentences to practice using the word \'{word}\' in {speech_language_code}.',
    modelId: '',
    type: 'word',
  },
  {
    id: '25',
    name: 'Comparison with Similar Words',
    prompt: 'Compare and contrast the word \'{word}\' with similar words in {speech_language_code}, highlighting differences in usage.',
    modelId: '',
    type: 'word',
  },
  // New Text-based prompt for suggesting a response
  {
    id: '26',
    name: 'Response Suggestion',
    prompt: 'Suggest a suitable response to the following text in {speech_language_code}:\n\n{text}',
    modelId: '',
    type: 'text',
  },

  // New Text-based prompt for rephrasing in 5 different ways
  {
    id: '27',
    name: 'Rephrase with Variations',
    prompt: 'Rephrase the following sentence in 5 different ways using bullet points, while maintaining its meaning in {speech_language_code}:\n\n{text}',
    modelId: '',
    type: 'text',
  },

  // New Text-based prompt for using advanced vocabulary
  {
    id: '28',
    name: 'Advanced Vocabulary',
    prompt: 'Rewrite the following sentence using more advanced vocabulary in {speech_language_code}:\n\n{text}',
    modelId: '',
    type: 'text',
  }


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
      version: 3,
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            state.prompts = defaultPrompts;
          }
        };
      },
    }
  )
);