import React, { useState, useCallback, useEffect } from 'react';
import { TranscriptPanel } from '../TranscriptPanel';
import { SavedItemsPanel } from './SavedItemsPanel';
import { ChatPanel } from './ChatPanel';
import { CollapsiblePanel } from './CollapsiblePanel';
import { cn } from '../../lib/utils';
import { useLayoutStore } from '../../store/useLayoutStore';

const MIN_MAIN_PANEL_WIDTH = 200; // Minimum width before hiding main panel
const MIN_GAP = 24; // Increased minimum gap between panels
const TITLE_BAR_WIDTH = 44; // Width of the title bar (11 * 4px Tailwind units)
const PANEL_SPACING = 16; // Spacing between panels when both are visible

export function MainLayout() {
    const {
        isFullscreen,
        leftPanelWidth,
        rightPanelWidth,
        setLeftPanelWidth,
        setRightPanelWidth,
    } = useLayoutStore();

    const [isMainPanelVisible, setIsMainPanelVisible] = useState(true);
    const [lastModifiedPanel, setLastModifiedPanel] = useState<'left' | 'right' | null>(null);

    // Calculate maximum allowed width for left panel
    const getMaxLeftWidth = useCallback(() => {
        const rightSpace = rightPanelWidth || TITLE_BAR_WIDTH;
        const maxWidth = window.innerWidth - rightSpace - MIN_GAP - PANEL_SPACING;
        return Math.max(0, maxWidth);
    }, [rightPanelWidth]);

    // Calculate maximum allowed width for right panel
    const getMaxRightWidth = useCallback(() => {
        const leftSpace = leftPanelWidth || TITLE_BAR_WIDTH;
        const maxWidth = window.innerWidth - leftSpace - MIN_GAP - PANEL_SPACING;
        return Math.max(0, maxWidth);
    }, [leftPanelWidth]);

    // Handle left panel width changes with collision prevention
    const handleLeftPanelWidth = useCallback((width: number) => {
        setLastModifiedPanel('left');
        const maxAllowedWidth = getMaxLeftWidth();
        const adjustedWidth = Math.min(width, maxAllowedWidth);

        // If expanding left panel would cause overlap, shrink right panel
        if (adjustedWidth + (rightPanelWidth || TITLE_BAR_WIDTH) + PANEL_SPACING > window.innerWidth - MIN_GAP) {
            const newRightWidth = Math.max(0, window.innerWidth - adjustedWidth - PANEL_SPACING - MIN_GAP);
            setRightPanelWidth(newRightWidth);
        }

        setLeftPanelWidth(adjustedWidth);
    }, [getMaxLeftWidth, rightPanelWidth, setLeftPanelWidth, setRightPanelWidth]);

    // Handle right panel width changes with collision prevention
    const handleRightPanelWidth = useCallback((width: number) => {
        setLastModifiedPanel('right');
        const maxAllowedWidth = getMaxRightWidth();
        const adjustedWidth = Math.min(width, maxAllowedWidth);

        // If expanding right panel would cause overlap, shrink left panel
        if (adjustedWidth + (leftPanelWidth || TITLE_BAR_WIDTH) + PANEL_SPACING > window.innerWidth - MIN_GAP) {
            const newLeftWidth = Math.max(0, window.innerWidth - adjustedWidth - PANEL_SPACING - MIN_GAP);
            setLeftPanelWidth(newLeftWidth);
        }

        setRightPanelWidth(adjustedWidth);
    }, [getMaxRightWidth, leftPanelWidth, setLeftPanelWidth, setRightPanelWidth]);

    // Calculate available space and handle main panel visibility
    useEffect(() => {
        const handleResize = () => {
            const availableWidth = window.innerWidth -
                (leftPanelWidth || TITLE_BAR_WIDTH) -
                (rightPanelWidth || TITLE_BAR_WIDTH) -
                PANEL_SPACING;

            // Adjust panels if they would overlap
            if (leftPanelWidth + rightPanelWidth + PANEL_SPACING > window.innerWidth - MIN_GAP) {
                // Prioritize the most recently moved panel
                if (lastModifiedPanel === 'right') {
                    const newLeftWidth = Math.max(0, window.innerWidth - rightPanelWidth - PANEL_SPACING - MIN_GAP);
                    setLeftPanelWidth(newLeftWidth);
                } else {
                    const newRightWidth = Math.max(0, window.innerWidth - leftPanelWidth - PANEL_SPACING - MIN_GAP);
                    setRightPanelWidth(newRightWidth);
                }
            }

            setIsMainPanelVisible(availableWidth >= MIN_MAIN_PANEL_WIDTH);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [leftPanelWidth, rightPanelWidth, lastModifiedPanel, setLeftPanelWidth, setRightPanelWidth]);

    return (
        <div className={cn(
            "relative h-full",
            isFullscreen && "fixed inset-0 bg-white z-50"
        )}>
            {/* Main Transcription Panel */}
            <div
                className={cn(
                    'h-full transition-all duration-150 ease-in-out overflow-auto',
                    !isMainPanelVisible && 'opacity-0 pointer-events-none'
                )}
                style={{
                    marginLeft: `${leftPanelWidth > 0 ? leftPanelWidth + PANEL_SPACING / 2 : TITLE_BAR_WIDTH}px`,
                    marginRight: `${rightPanelWidth > 0 ? rightPanelWidth + PANEL_SPACING / 2 : TITLE_BAR_WIDTH}px`,
                    minWidth: `${MIN_MAIN_PANEL_WIDTH}px`,
                }}
            >
                <div className={cn(
                    "mx-auto h-full px-4 pb-8",
                    isFullscreen ? "max-w-[98%] lg:max-w-[96%] xl:max-w-[94%]" : "max-w-4xl"
                )}>
                    <TranscriptPanel />
                </div>
            </div>

            {/* Left Panel - Words/Sentences */}
            <CollapsiblePanel
                side="left"
                title="Recent Items"
                storageKey="listenify-words-panel"
                onWidthChange={handleLeftPanelWidth}
                maxAllowedWidth={getMaxLeftWidth()}
            >
                <SavedItemsPanel />
            </CollapsiblePanel>

            {/* Right Panel - AI Chat */}
            <CollapsiblePanel
                side="right"
                title="AI Chat"
                storageKey="listenify-chat-panel"
                onWidthChange={handleRightPanelWidth}
                maxAllowedWidth={getMaxRightWidth()}
            >
                <ChatPanel />
            </CollapsiblePanel>
        </div>
    );
} 