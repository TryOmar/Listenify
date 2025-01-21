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
                    'fixed bottom-0 left-0 right-0 bg-white shadow-lg transition-all duration-200 ease-in-out z-panel',
                    'panel-container'
                )}
                style={panelStyle}
            >
                {/* Panel Header */}
                <div className={cn(
                    "h-12 bg-gray-50 border-b flex items-center px-4 gap-2",
                    isVisible ? 'opacity-100' : 'opacity-0'
                )}>
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
                        'absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-blue-100 z-resize-handle transition-colors duration-150',
                        'panel-resize-handle'
                    )}
                    onMouseDown={handleMouseDown}
                />

                {/* Toggle Button */}
                {isVisible && (
                    <button
                        onClick={togglePanel}
                        className={cn(
                            'absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white shadow-md',
                            'flex items-center justify-center hover:bg-gray-50 transition-colors duration-150',
                            'border border-gray-200 z-50'
                        )}
                    >
                        <ChevronDown size={14} className="text-gray-600" />
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
                    'absolute inset-0 bg-gray-50 border-t hover:bg-gray-100 transition-colors duration-150'
                )}>
                    {/* Title Container */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className={cn(
                            'flex items-center gap-2',
                            isHovered ? 'text-gray-900' : 'text-gray-600'
                        )}>
                            <span className="text-xs font-semibold tracking-wider uppercase">
                                {title}
                            </span>
                            <ChevronUp size={16} className={cn(
                                'text-gray-400',
                                isHovered && 'text-gray-600'
                            )} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
} 