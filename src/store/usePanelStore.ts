import { create } from 'zustand';

interface PanelState {
    isChatPanelOpen: boolean;
    toggleChatPanel: () => void;
    openChatPanel: () => void;
}

export const usePanelStore = create<PanelState>((set) => ({
    isChatPanelOpen: false,
    toggleChatPanel: () => set((state) => ({ isChatPanelOpen: !state.isChatPanelOpen })),
    openChatPanel: () => set({ isChatPanelOpen: true }),
})); 