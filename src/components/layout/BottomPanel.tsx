import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BottomPanelProps {
    children: React.ReactNode;
    title: string;
    onHeightChange: (height: number) => void;
    maxAllowedHeight: number;
}

const DEFAULT_HEIGHT = 300;
const AUTO_HIDE_THRESHOLD = 100;

export function BottomPanel({
    children,
    title,
    onHeightChange,
    maxAllowedHeight,
}: BottomPanelProps) {
    const [height, setHeight] = useState(0);
    const [isResizing, setIsResizing] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [startY, setStartY] = useState(0);
    const [startHeight, setStartHeight] = useState(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        setStartY(e.clientY);
        setStartHeight(height);
        document.body.style.cursor = 'row-resize';
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            const diff = startY - e.clientY;
            let newHeight = Math.max(0, startHeight + diff);
            newHeight = Math.min(newHeight, maxAllowedHeight);

            if (newHeight < AUTO_HIDE_THRESHOLD) {
                setHeight(0);
                setIsVisible(false);
                onHeightChange(0);
            } else {
                setHeight(newHeight);
                setIsVisible(true);
                onHeightChange(newHeight);
            }

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
    }, [isResizing, maxAllowedHeight, startY, startHeight, onHeightChange]);

    const togglePanel = () => {
        if (isVisible) {
            setHeight(0);
            setIsVisible(false);
            onHeightChange(0);
        } else {
            setHeight(DEFAULT_HEIGHT);
            setIsVisible(true);
            onHeightChange(DEFAULT_HEIGHT);
        }
    };

    const panelStyle = {
        transition: 'height 0.3s ease',
        height: `${height}px`,
        maxHeight: 'calc(100vh - 15vh)',
        transform: !isVisible ? 'translateY(100%)' : 'translateY(0)',
    };

    return (
        <>
            {/* Panel */}
            <div
                className={cn(
                    'fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 shadow-xl border-t border-slate-200 dark:border-slate-800 transition-all duration-200 ease-in-out z-panel',
                    'panel-container'
                )}
                style={panelStyle}
            >
                {/* Panel Header */}
                <div className={cn(
                    "h-12 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-2",
                    isVisible ? 'opacity-100' : 'opacity-0'
                )}>
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h2>
                </div>

                {/* Panel Content */}
                <div className={cn(
                    'h-[calc(100%-3rem)] overflow-auto hide-scrollbar text-slate-900 dark:text-slate-100',
                    isVisible ? 'opacity-100' : 'opacity-0'
                )}>
                    {children}
                </div>

                {/* Resize Handle */}
                <div
                    className={cn(
                        'absolute top-0 left-0 right-0 h-1.5 cursor-row-resize hover:bg-blue-400/50 z-resize-handle transition-colors duration-150',
                        'panel-resize-handle'
                    )}
                    onMouseDown={handleMouseDown}
                />

                {/* Toggle Button */}
                {isVisible && (
                    <button
                        onClick={togglePanel}
                        className={cn(
                            'absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white dark:bg-slate-800 shadow-md',
                            'flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150',
                            'border border-slate-200 dark:border-slate-700 z-50'
                        )}
                    >
                        <ChevronDown size={14} className="text-slate-600 dark:text-slate-300" />
                    </button>
                )}
            </div>

            {/* Title Bar */}
            <div
                className={cn(
                    'fixed bottom-0 left-0 right-0 h-11 transition-all duration-200 ease-in-out z-panel-button',
                    'panel-title-bar',
                    isVisible ? 'opacity-0 pointer-events-none' : 'opacity-100 cursor-pointer'
                )}
                onClick={togglePanel}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className={cn(
                    'absolute inset-0 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors duration-150'
                )}>
                    {/* Title Container */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className={cn(
                            'flex items-center gap-2 font-bold',
                            isHovered ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'
                        )}>
                            <span className="text-xs tracking-wider uppercase">
                                {title}
                            </span>
                            <ChevronUp size={16} className={cn(
                                'text-slate-400 dark:text-slate-500',
                                isHovered && 'text-slate-600 dark:text-slate-300'
                            )} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
} 