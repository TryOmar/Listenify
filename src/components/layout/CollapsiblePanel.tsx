import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { Resizable, ResizeCallbackData } from 'react-resizable';
import { cn } from '../../lib/utils';

interface CollapsiblePanelProps {
    side: 'left' | 'right';
    title: string;
    defaultIsOpen?: boolean;
    storageKey: string;
    children: React.ReactNode;
    onWidthChange?: (width: number) => void;
    maxAllowedWidth?: number;
}

interface PanelState {
    isOpen: boolean;
    width: number;
    wasAutoHidden: boolean;
    lastToggleAction: 'show' | 'hide';
}

const AUTO_HIDE_THRESHOLD = 150; // Width threshold for auto-hide
const DEFAULT_WIDTH = 300; // Default width when opening panel

export function CollapsiblePanel({
    side,
    title,
    defaultIsOpen = false,
    storageKey,
    children,
    onWidthChange,
    maxAllowedWidth,
}: CollapsiblePanelProps) {
    const [state, setState] = useState<PanelState>(() => {
        const stored = localStorage.getItem(storageKey);
        return stored
            ? JSON.parse(stored)
            : {
                isOpen: defaultIsOpen,
                width: DEFAULT_WIDTH,
                wasAutoHidden: false,
                lastToggleAction: 'hide'
            };
    });

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(state));
    }, [state, storageKey]);

    useEffect(() => {
        if (onWidthChange) {
            requestAnimationFrame(() => {
                onWidthChange(state.isOpen ? state.width : 0);
            });
        }
    }, [state.isOpen, state.width, onWidthChange]);

    // Adjust width if it exceeds maxAllowedWidth
    useEffect(() => {
        if (maxAllowedWidth && state.width > maxAllowedWidth && state.isOpen) {
            setState(prev => ({
                ...prev,
                width: maxAllowedWidth
            }));
        }
    }, [maxAllowedWidth]);

    const handleResize = useCallback((e: React.SyntheticEvent, { size }: ResizeCallbackData) => {
        const newWidth = Math.max(50, size.width);

        // Respect maxAllowedWidth if provided
        const finalWidth = maxAllowedWidth ? Math.min(newWidth, maxAllowedWidth) : newWidth;

        requestAnimationFrame(() => {
            // Auto-hide when dragged too small
            if (finalWidth < AUTO_HIDE_THRESHOLD) {
                setState(prev => ({
                    ...prev,
                    isOpen: false,
                    wasAutoHidden: true,
                    lastToggleAction: 'hide'
                }));
                return;
            }

            setState(prev => ({
                ...prev,
                width: finalWidth,
                wasAutoHidden: false
            }));
        });
    }, [maxAllowedWidth]);

    const togglePanel = () => {
        setState(prev => {
            const willBeOpen = !prev.isOpen;
            const shouldResetWidth = prev.lastToggleAction === 'hide' || prev.wasAutoHidden;
            let newWidth = willBeOpen && shouldResetWidth ? DEFAULT_WIDTH : prev.width;

            // Respect maxAllowedWidth when toggling
            if (maxAllowedWidth && newWidth > maxAllowedWidth) {
                newWidth = maxAllowedWidth;
            }

            return {
                ...prev,
                isOpen: willBeOpen,
                width: newWidth,
                wasAutoHidden: false,
                lastToggleAction: willBeOpen ? 'show' : 'hide'
            };
        });
    };

    return (
        <>
            {/* Fixed Position Toggle Button */}
            <button
                onClick={togglePanel}
                className={cn(
                    'fixed top-1/2 -translate-y-1/2 z-50 flex items-center bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-md',
                    side === 'left' ? 'left-0' : 'right-0',
                    !state.isOpen && 'rounded-lg py-3 px-4 text-sm font-medium',
                    state.isOpen
                        ? 'rounded-full p-2'
                        : side === 'left'
                            ? 'translate-x-0 rounded-r-lg'
                            : 'translate-x-0 rounded-l-lg'
                )}
                style={{
                    writingMode: !state.isOpen ? 'vertical-rl' : 'horizontal-tb',
                    transform: !state.isOpen
                        ? `translateY(-50%) ${side === 'right' ? 'rotate(180deg)' : ''}`
                        : `translateY(-50%) ${side === 'left' ? 'translateX(calc(100% + 4px))' : 'translateX(calc(-100% - 4px))'}`
                }}
            >
                {state.isOpen ? (
                    side === 'left' ? (
                        <ChevronLeft size={18} />
                    ) : (
                        <ChevronRight size={18} />
                    )
                ) : (
                    <>
                        <span className="text-sm">{title}</span>
                        {side === 'left' ? (
                            <ChevronRight size={18} className="mt-1" />
                        ) : (
                            <ChevronLeft size={18} className="mt-1" />
                        )}
                    </>
                )}
            </button>

            {/* Panel */}
            <div
                className={cn(
                    'fixed top-0 h-full bg-white panel-shadow z-40',
                    side === 'left' ? 'left-0' : 'right-0',
                    !state.isOpen && (side === 'left' ? '-translate-x-full' : 'translate-x-full')
                )}
                style={{
                    width: state.width,
                    transition: state.isOpen ? 'none' : 'transform 0.3s ease-in-out'
                }}
            >
                <Resizable
                    width={state.width}
                    height={window.innerHeight}
                    onResize={handleResize}
                    draggableOpts={{
                        grid: [1, 1],
                        enableUserSelectHack: false,
                    }}
                    handle={
                        <div
                            className={cn(
                                'absolute h-full w-2 cursor-col-resize hover:bg-blue-500/20 group flex items-center justify-center',
                                side === 'left' ? 'right-0' : 'left-0'
                            )}
                        >
                            <GripVertical
                                size={18}
                                className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                        </div>
                    }
                    resizeHandles={[side === 'left' ? 'e' : 'w']}
                    minConstraints={[50, 0]}
                    maxConstraints={[maxAllowedWidth || 2000, 0]}
                >
                    <div className="h-full flex flex-col">
                        {/* Panel Title */}
                        <div className="p-3 border-b bg-gray-50">
                            <h2 className="text-base font-semibold">{title}</h2>
                        </div>

                        {/* Panel Content */}
                        <div className="flex-1 overflow-hidden">{children}</div>
                    </div>
                </Resizable>
            </div>
        </>
    );
} 