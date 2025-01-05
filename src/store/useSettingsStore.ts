import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GeneralSettings {
  language: string;
  theme: 'light' | 'dark';
  fontSize: number;
  maxWords: number;
}

export interface PopupAction {
  id: string;
  name: string;
  url: string;
  icon: string;
}

export interface TextAction {
  id: string;
  name: string;
  url: string;
  icon: string;
}

export interface AIModel {
  id: string;
  name: string;
  apiKey: string;
  baseUrl?: string;
}

export interface AIAction {
  id: string;
  name: string;
  prompt: string;
  modelId: string;
}

interface SettingsState {
  general: GeneralSettings;
  popupActions: PopupAction[];
  textActions: TextAction[];
  aiModels: AIModel[];
  aiActions: AIAction[];
  activeModelId: string | null;

  // Actions
  updateGeneralSettings: (settings: Partial<GeneralSettings>) => void;
  addPopupAction: (action: Omit<PopupAction, 'id'>) => void;
  removePopupAction: (id: string) => void;
  updatePopupAction: (id: string, action: Partial<PopupAction>) => void;
  addTextAction: (action: Omit<TextAction, 'id'>) => void;
  removeTextAction: (id: string) => void;
  updateTextAction: (id: string, action: Partial<TextAction>) => void;
  addAIModel: (model: Omit<AIModel, 'id'>) => void;
  removeAIModel: (id: string) => void;
  updateAIModel: (id: string, model: Partial<AIModel>) => void;
  setActiveModel: (id: string | null) => void;
  addAIAction: (action: Omit<AIAction, 'id'>) => void;
  removeAIAction: (id: string) => void;
  updateAIAction: (id: string, action: Partial<AIAction>) => void;
  resetToDefaults: () => void;
}

const defaultGeneralSettings: GeneralSettings = {
  language: 'en',
  theme: 'light',
  fontSize: 16,
  maxWords: 100,
};

const defaultPopupActions: PopupAction[] = [
  {
    id: '1',
    name: 'Google Translate',
    url: 'https://translate.google.com/?sl=en&tl=ar&text={word}',
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
];

const defaultTextActions: TextAction[] = [
  {
    id: '1',
    name: 'Google Translate',
    url: 'https://translate.google.com/?sl=en&tl=ar&text={text}',
    icon: '🌐',
  },
];

const defaultAIActions: AIAction[] = [
  {
    id: '1',
    name: 'Translate to English',
    prompt: 'Please translate this text into English:\n\n{text}',
    modelId: '',
  },
  {
    id: '2',
    name: 'Summarize',
    prompt: 'Please summarize this text into bullet points:\n\n{text}',
    modelId: '',
  },
  {
    id: '3',
    name: 'Rephrase',
    prompt: 'Please rephrase this text in a different way while maintaining its meaning:\n\n{text}',
    modelId: '',
  },
  {
    id: '4',
    name: 'Explain Simply',
    prompt: 'Please explain this text in simple terms that anyone can understand:\n\n{text}',
    modelId: '',
  },
  {
    id: '5',
    name: 'Find Key Points',
    prompt: 'Please identify and list the key points from this text:\n\n{text}',
    modelId: '',
  },
];

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      general: defaultGeneralSettings,
      popupActions: defaultPopupActions,
      textActions: defaultTextActions,
      aiModels: [],
      aiActions: defaultAIActions,
      activeModelId: null,

      updateGeneralSettings: (settings) =>
        set((state) => ({
          general: { ...state.general, ...settings },
        })),

      addPopupAction: (action) =>
        set((state) => ({
          popupActions: [...state.popupActions, { ...action, id: crypto.randomUUID() }],
        })),
      removePopupAction: (id) =>
        set((state) => ({
          popupActions: state.popupActions.filter((action) => action.id !== id),
        })),
      updatePopupAction: (id, action) =>
        set((state) => ({
          popupActions: state.popupActions.map((a) =>
            a.id === id ? { ...a, ...action } : a
          ),
        })),

      addTextAction: (action) =>
        set((state) => ({
          textActions: [...state.textActions, { ...action, id: crypto.randomUUID() }],
        })),
      removeTextAction: (id) =>
        set((state) => ({
          textActions: state.textActions.filter((action) => action.id !== id),
        })),
      updateTextAction: (id, action) =>
        set((state) => ({
          textActions: state.textActions.map((a) =>
            a.id === id ? { ...a, ...action } : a
          ),
        })),

      addAIModel: (model) =>
        set((state) => ({
          aiModels: [...state.aiModels, { ...model, id: crypto.randomUUID() }],
        })),
      removeAIModel: (id) =>
        set((state) => ({
          aiModels: state.aiModels.filter((model) => model.id !== id),
          activeModelId: state.activeModelId === id ? null : state.activeModelId,
        })),
      updateAIModel: (id, model) =>
        set((state) => ({
          aiModels: state.aiModels.map((m) =>
            m.id === id ? { ...m, ...model } : m
          ),
        })),
      setActiveModel: (id) =>
        set({ activeModelId: id }),

      addAIAction: (action) =>
        set((state) => ({
          aiActions: [...state.aiActions, { ...action, id: crypto.randomUUID() }],
        })),
      removeAIAction: (id) =>
        set((state) => ({
          aiActions: state.aiActions.filter((action) => action.id !== id),
        })),
      updateAIAction: (id, action) =>
        set((state) => ({
          aiActions: state.aiActions.map((a) =>
            a.id === id ? { ...a, ...action } : a
          ),
        })),

      resetToDefaults: () =>
        set({
          general: defaultGeneralSettings,
          popupActions: defaultPopupActions,
          textActions: defaultTextActions,
          aiModels: [],
          aiActions: defaultAIActions,
          activeModelId: null,
        }),
    }),
    {
      name: 'listenify-settings',
    }
  )
);