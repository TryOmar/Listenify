import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { ChevronLeft, ChevronRight, ListMusic, MessageSquare } from 'lucide-react';

interface CollapsiblePanelProps {
    children: React.ReactNode;
    side: 'left' | 'right';
    title: string;
    storageKey: string;
    onWidthChange: (width: number) => void;
    maxAllowedWidth: number;
}

const MIN_VISIBLE_WIDTH = 50;
const DEFAULT_WIDTH = 400;
const AUTO_HIDE_THRESHOLD = 150; // Width threshold for auto-hiding

export function CollapsiblePanel({
    children,
    side,
    title,
    storageKey,
    onWidthChange,
    maxAllowedWidth,
}: CollapsiblePanelProps) {
    const [width, setWidth] = useState(0);
    const [isResizing, setIsResizing] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startWidth, setStartWidth] = useState(0);

    // Load saved width from localStorage
    useEffect(() => {
        const savedWidth = localStorage.getItem(storageKey);
        if (savedWidth) {
            const parsedWidth = Number(savedWidth);
            setWidth(parsedWidth);
            setIsVisible(parsedWidth > MIN_VISIBLE_WIDTH);
        }
    }, [storageKey]);

    // Save width to localStorage when it changes
    useEffect(() => {
        localStorage.setItem(storageKey, width.toString());
        onWidthChange(width);
    }, [width, storageKey, onWidthChange]);

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
        if (isVisible) {
            setWidth(0);
            setIsVisible(false);
        } else {
            setWidth(DEFAULT_WIDTH);
            setIsVisible(true);
        }
    };

    const getPanelIcon = () => {
        if (side === 'left') return <ListMusic size={16} />;
        return <MessageSquare size={16} />;
    };

    return (
        <>
            {/* Panel */}
            <div
                className={cn(
                    'fixed top-0 h-full bg-white shadow-lg transition-all duration-200 ease-in-out z-panel',
                    side === 'left' ? 'left-0' : 'right-0',
                    'panel-container'
                )}
                style={{
                    width: `${width}px`,
                    transform: !isVisible ? `translateX(${side === 'left' ? '-100%' : '100%'})` : 'translateX(0)'
                }}
            >
                {/* Panel Header */}
                <div className={cn(
                    "h-12 bg-gray-50 border-b flex items-center px-4 gap-2",
                    isVisible ? 'opacity-100' : 'opacity-0'
                )}>
                    {getPanelIcon()}
                    <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
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
                        'absolute top-0 w-1 h-full cursor-col-resize hover:bg-blue-100 z-resize-handle transition-colors duration-150',
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
                            'absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-md',
                            'flex items-center justify-center hover:bg-gray-50 transition-colors duration-150',
                            'border border-gray-200 z-50',
                            side === 'left' ? '-right-3' : '-left-3'
                        )}
                    >
                        {side === 'left' ? (
                            <ChevronLeft size={14} className="text-gray-600" />
                        ) : (
                            <ChevronRight size={14} className="text-gray-600" />
                        )}
                    </button>
                )}
            </div>

            {/* Title Bar */}
            <div
                className={cn(
                    'fixed top-0 h-full w-11 transition-all duration-200 ease-in-out z-panel-button',
                    'panel-title-bar',
                    side === 'left' ? 'left-0' : 'right-0',
                    isVisible ? 'opacity-0 pointer-events-none' : 'opacity-100 cursor-pointer'
                )}
                onClick={togglePanel}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className={cn(
                    'absolute inset-0 bg-gray-50 border-r hover:bg-gray-100 transition-colors duration-150',
                    side === 'right' && 'border-l border-r-0'
                )}>
                    {/* Title Container */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {/* Top Icon */}
                        <div className={cn(
                            'absolute top-4 text-gray-400',
                            isHovered && 'text-gray-600'
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
                                'text-gray-600',
                                isHovered && 'text-gray-900'
                            )}>
                                {title}
                            </span>
                        </div>

                        {/* Arrow Icon */}
                        <div className={cn(
                            'absolute bottom-4 text-gray-400',
                            isHovered && 'text-gray-600'
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