import { create } from 'zustand';

const DEFAULT_WIDTH = 400;

interface PanelState {
    isChatPanelOpen: boolean;
    chatPanelWidth: number;
    onWidthChangeCallback: ((width: number) => void) | null;
    toggleChatPanel: () => void;
    openChatPanel: () => void;
    setChatPanelWidth: (width: number) => void;
    setWidthChangeCallback: (callback: (width: number) => void) => void;
}

export const usePanelStore = create<PanelState>((set, get) => ({
    isChatPanelOpen: false,
    chatPanelWidth: 0,
    onWidthChangeCallback: null,
    toggleChatPanel: () => {
        const state = get();
        const newWidth = !state.isChatPanelOpen ? DEFAULT_WIDTH : 0;
        set({
            isChatPanelOpen: !state.isChatPanelOpen,
            chatPanelWidth: newWidth
        });
        state.onWidthChangeCallback?.(newWidth);
    },
    openChatPanel: () => {
        const state = get();
        if (!state.isChatPanelOpen) {
            set({
                isChatPanelOpen: true,
                chatPanelWidth: DEFAULT_WIDTH
            });
            state.onWidthChangeCallback?.(DEFAULT_WIDTH);
        }
    },
    setChatPanelWidth: (width: number) => {
        const state = get();
        set({ chatPanelWidth: width });
        state.onWidthChangeCallback?.(width);
    },
    setWidthChangeCallback: (callback: (width: number) => void) => set({ onWidthChangeCallback: callback }),
})); 