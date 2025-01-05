import { create } from 'zustand';

export interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
}

interface ChatState {
    messages: Message[];
    isOpen: boolean;
    addMessage: (text: string, sender: 'user' | 'ai') => void;
    setIsOpen: (isOpen: boolean) => void;
    clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [],
    isOpen: false,
    addMessage: (text, sender) => set((state) => ({
        messages: [...state.messages, {
            id: crypto.randomUUID(),
            text,
            sender,
        }],
    })),
    setIsOpen: (isOpen) => set({ isOpen }),
    clearMessages: () => set({ messages: [] }),
})); 