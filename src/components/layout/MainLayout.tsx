import React, { useState, useCallback, useEffect } from 'react';
import { TranscriptPanel } from '../TranscriptPanel';
import { SavedItemsPanel } from './SavedItemsPanel';
import { ChatPanel } from './ChatPanel';
import { CollapsiblePanel } from './CollapsiblePanel';
import { cn } from '../../lib/utils';

const MIN_MAIN_PANEL_WIDTH = 400; // Minimum width before hiding main panel
const MIN_GAP = 20; // Minimum gap between panels

export function MainLayout() {
    const [leftPanelWidth, setLeftPanelWidth] = useState(0);
    const [rightPanelWidth, setRightPanelWidth] = useState(0);
    const [isMainPanelVisible, setIsMainPanelVisible] = useState(true);

    // Handle left panel width changes with collision prevention
    const handleLeftPanelWidth = useCallback((width: number) => {
        const maxAllowedWidth = window.innerWidth - rightPanelWidth - MIN_GAP;
        const adjustedWidth = Math.min(width, maxAllowedWidth);
        setLeftPanelWidth(adjustedWidth);
    }, [rightPanelWidth]);

    // Handle right panel width changes with collision prevention
    const handleRightPanelWidth = useCallback((width: number) => {
        const maxAllowedWidth = window.innerWidth - leftPanelWidth - MIN_GAP;
        const adjustedWidth = Math.min(width, maxAllowedWidth);
        setRightPanelWidth(adjustedWidth);
    }, [leftPanelWidth]);

    // Calculate available space and handle main panel visibility
    useEffect(() => {
        const handleResize = () => {
            const availableWidth = window.innerWidth - leftPanelWidth - rightPanelWidth;

            // Check for panel collision
            if (leftPanelWidth + rightPanelWidth + MIN_GAP > window.innerWidth) {
                // Adjust right panel if it would overlap
                const newRightWidth = window.innerWidth - leftPanelWidth - MIN_GAP;
                setRightPanelWidth(Math.max(0, newRightWidth));
            }

            setIsMainPanelVisible(availableWidth >= MIN_MAIN_PANEL_WIDTH);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [leftPanelWidth, rightPanelWidth]);

    return (
        <div className="relative h-full">
            {/* Main Transcription Panel */}
            <div
                className={cn(
                    'h-full transition-all duration-150 ease-in-out overflow-auto',
                    !isMainPanelVisible && 'opacity-0 pointer-events-none'
                )}
                style={{
                    marginLeft: `${leftPanelWidth}px`,
                    marginRight: `${rightPanelWidth}px`,
                    minWidth: `${MIN_MAIN_PANEL_WIDTH}px`,
                }}
            >
                <div className="max-w-4xl mx-auto h-full px-4">
                    <TranscriptPanel />
                </div>
            </div>

            {/* Left Panel - Words/Sentences */}
            <CollapsiblePanel
                side="left"
                title="Recent Items"
                storageKey="listenify-words-panel"
                onWidthChange={handleLeftPanelWidth}
                maxAllowedWidth={window.innerWidth - rightPanelWidth - MIN_GAP}
            >
                <SavedItemsPanel />
            </CollapsiblePanel>

            {/* Right Panel - AI Chat */}
            <CollapsiblePanel
                side="right"
                title="AI Chat"
                storageKey="listenify-chat-panel"
                onWidthChange={handleRightPanelWidth}
                maxAllowedWidth={window.innerWidth - leftPanelWidth - MIN_GAP}
            >
                <ChatPanel />
            </CollapsiblePanel>
        </div>
    );
} 