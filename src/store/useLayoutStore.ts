import { create } from 'zustand';

interface LayoutState {
    isFullscreen: boolean;
    leftPanelWidth: number;
    rightPanelWidth: number;
    bottomPanelHeight: number;
    setFullscreen: (value: boolean) => void;
    setLeftPanelWidth: (width: number) => void;
    setRightPanelWidth: (width: number) => void;
    setBottomPanelHeight: (height: number) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
    isFullscreen: false,
    leftPanelWidth: 0,
    rightPanelWidth: 0,
    bottomPanelHeight: 0,
    setFullscreen: (value) => set({ isFullscreen: value }),
    setLeftPanelWidth: (width) => set({ leftPanelWidth: width }),
    setRightPanelWidth: (width) => set({ rightPanelWidth: width }),
    setBottomPanelHeight: (height) => set({ bottomPanelHeight: height }),
})); 