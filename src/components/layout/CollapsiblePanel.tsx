import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { ChevronLeft, ChevronRight, ListMusic, MessageSquare } from 'lucide-react';
import { usePanelStore } from '../../store/usePanelStore';

interface CollapsiblePanelProps {
    children: React.ReactNode;
    side: 'left' | 'right';
    title: string;
    onWidthChange: (width: number) => void;
    maxAllowedWidth: number;
}

const AUTO_HIDE_THRESHOLD = 150;
const DEFAULT_WIDTH = 400;

export function CollapsiblePanel({
    children,
    side,
    title,
    onWidthChange,
    maxAllowedWidth,
}: CollapsiblePanelProps) {
    const [width, setWidth] = useState(0);
    const [isResizing, setIsResizing] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startWidth, setStartWidth] = useState(0);
    const {
        isChatPanelOpen,
        chatPanelWidth,
        toggleChatPanel,
        setWidthChangeCallback
    } = usePanelStore();

    // Register the width change callback
    useEffect(() => {
        if (side === 'right') {
            setWidthChangeCallback(onWidthChange);
        }
    }, [side, onWidthChange, setWidthChangeCallback]);

    // Sync chat panel state
    useEffect(() => {
        if (side === 'right') {
            setIsVisible(isChatPanelOpen);
            setWidth(chatPanelWidth);
        }
    }, [side, isChatPanelOpen, chatPanelWidth]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        setStartX(e.clientX);
        setStartWidth(width);
        document.body.style.cursor = 'col-resize';
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            const diff = side === 'left'
                ? e.clientX - startX
                : startX - e.clientX;

            let newWidth = Math.max(0, startWidth + diff);
            newWidth = Math.min(newWidth, maxAllowedWidth);

            // Instantly transform to sidebar when below threshold
            if (newWidth < AUTO_HIDE_THRESHOLD) {
                setWidth(0);
                setIsVisible(false);
                onWidthChange(0);
            } else {
                setWidth(newWidth);
                setIsVisible(true);
                onWidthChange(newWidth);
            }

            // Prevent text selection during resize
            e.preventDefault();
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = '';
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove, { passive: false });
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
        };
    }, [isResizing, side, maxAllowedWidth, startX, startWidth, onWidthChange]);

    const togglePanel = () => {
        if (side === 'right') {
            toggleChatPanel();
            if (isVisible) {
                setWidth(0);
                onWidthChange(0);
            } else {
                setWidth(DEFAULT_WIDTH);
                onWidthChange(DEFAULT_WIDTH);
            }
        } else {
            if (isVisible) {
                setWidth(0);
                setIsVisible(false);
                onWidthChange(0);
            } else {
                setWidth(DEFAULT_WIDTH);
                setIsVisible(true);
                onWidthChange(DEFAULT_WIDTH);
            }
        }
    };

    const getPanelIcon = () => {
        if (side === 'left') return <ListMusic size={16} />;
        return <MessageSquare size={16} />;
    };

    // Add CSS transition for smooth animation
    const panelStyle = {
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        width: `${width}px`,
        maxWidth: 'calc(100vw - 2rem)',
        transform: !isVisible ? `translateX(${side === 'left' ? '-100%' : '100%'})` : 'translateX(0)',
        left: side === 'left' ? 0 : 'auto',
        right: side === 'right' ? 0 : 'auto',
    };

    return (
        <>
            {/* Backdrop Overlay for Narrow / Mobile Viewports */}
            {isVisible && (
                <div
                    className="fixed inset-x-0 bottom-0 top-[62px] sm:top-[66px] bg-slate-900/40 backdrop-blur-xs z-30 xl:hidden transition-opacity"
                    onClick={togglePanel}
                />
            )}

            {/* Panel */}
            <div
                className={cn(
                    'fixed top-[62px] sm:top-[66px] h-[calc(100vh-62px)] sm:h-[calc(100vh-66px)] bg-white shadow-2xl xl:shadow-lg transition-all duration-200 ease-in-out z-panel',
                    side === 'left' ? 'left-0' : 'right-0',
                    'panel-container'
                )}
                style={panelStyle}
            >
                {/* Panel Header */}
                <div className={cn(
                    "h-12 bg-slate-50 border-b flex items-center justify-between px-4 gap-2",
                    isVisible ? 'opacity-100' : 'opacity-0'
                )}>
                    <div className="flex items-center gap-2">
                        {getPanelIcon()}
                        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
                    </div>
                    <button
                        onClick={togglePanel}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 xl:hidden transition-colors"
                        title="Close panel"
                    >
                        <ChevronLeft size={18} className={side === 'right' ? '' : 'rotate-180'} />
                    </button>
                </div>

                {/* Panel Content */}
                <div className={cn(
                    'h-[calc(100%-3rem)] overflow-auto hide-scrollbar',
                    isVisible ? 'opacity-100' : 'opacity-0'
                )}>
                    {children}
                </div>

                {/* Resize Handle */}
                <div
                    className={cn(
                        'absolute top-0 w-1 h-full cursor-col-resize hover:bg-blue-200 z-resize-handle transition-colors duration-150 hidden sm:block',
                        side === 'left' ? 'right-0' : 'left-0',
                        'panel-resize-handle'
                    )}
                    onMouseDown={handleMouseDown}
                />

                {/* Toggle Button */}
                {isVisible && (
                    <button
                        onClick={togglePanel}
                        className={cn(
                            'absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-md hidden xl:flex',
                            'items-center justify-center hover:bg-slate-100 transition-colors duration-150',
                            'border border-slate-200 z-50',
                            side === 'left' ? '-right-3' : '-left-3'
                        )}
                    >
                        {side === 'left' ? (
                            <ChevronLeft size={14} className="text-slate-600" />
                        ) : (
                            <ChevronRight size={14} className="text-slate-600" />
                        )}
                    </button>
                )}
            </div>

            {/* Floating Mobile Toggle Button */}
            {!isVisible && (
                <button
                    onClick={togglePanel}
                    className={cn(
                        'fixed top-[45vh] z-30 xl:hidden bg-white/95 backdrop-blur-md shadow-md border border-slate-200/80 rounded-full px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-slate-300/50',
                        side === 'left' ? 'left-2.5' : 'right-2.5'
                    )}
                    title={`Open ${title}`}
                >
                    {getPanelIcon()}
                    <span className="text-[11px]">{title}</span>
                </button>
            )}

            {/* Title Bar (Desktop/Tablet) */}
            <div
                className={cn(
                    'fixed top-[62px] sm:top-[66px] h-[calc(100vh-62px)] sm:h-[calc(100vh-66px)] w-10 transition-all duration-200 ease-in-out z-panel-button hidden xl:block',
                    'panel-title-bar',
                    side === 'left' ? 'left-0' : 'right-0',
                    isVisible ? 'opacity-0 pointer-events-none' : 'opacity-100 cursor-pointer'
                )}
                onClick={togglePanel}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className={cn(
                    'absolute inset-0 bg-slate-50/90 backdrop-blur-xs border-r hover:bg-slate-100/90 transition-colors duration-150',
                    side === 'right' && 'border-l border-r-0'
                )}>
                    {/* Title Container */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {/* Top Icon */}
                        <div className={cn(
                            'absolute top-4 text-slate-400',
                            isHovered && 'text-slate-700'
                        )}>
                            {getPanelIcon()}
                        </div>

                        {/* Title Text */}
                        <div className={cn(
                            'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
                            'vertical-text'
                        )}>
                            <span className={cn(
                                'text-xs font-semibold tracking-wider uppercase',
                                'text-slate-600',
                                isHovered && 'text-slate-900'
                            )}>
                                {title}
                            </span>
                        </div>

                        {/* Arrow Icon */}
                        <div className={cn(
                            'absolute bottom-4 text-slate-400',
                            isHovered && 'text-slate-700'
                        )}>
                            {side === 'left' ? (
                                <ChevronRight size={16} />
                            ) : (
                                <ChevronLeft size={16} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
} 