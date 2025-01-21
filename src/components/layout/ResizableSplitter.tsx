import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface ResizableSplitterProps {
    onResize: (height: number) => void;
    minHeight?: number;
    maxHeight?: number;
    isFullscreen?: boolean;
}

export function ResizableSplitter({
    onResize,
    minHeight = 100,
    maxHeight = window.innerHeight * 0.9,
    isFullscreen = false,
}: ResizableSplitterProps) {
    const [isResizing, setIsResizing] = useState(false);
    const [startY, setStartY] = useState(0);
    const [startHeight, setStartHeight] = useState(0);

    // Calculate dynamic height constraints based on fullscreen state
    const effectiveMinHeight = isFullscreen ? 200 : minHeight;
    const effectiveMaxHeight = isFullscreen ? window.innerHeight * 0.99 : maxHeight;

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        setStartY(e.clientY);
        const topPanel = (e.target as HTMLElement).closest('.transcript-panel')?.querySelector('.transcript-content');
        if (topPanel) {
            setStartHeight(topPanel.clientHeight);
        }
        document.body.style.cursor = 'row-resize';
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            const diff = e.clientY - startY;
            let newHeight = Math.max(effectiveMinHeight, startHeight + diff);
            newHeight = Math.min(newHeight, effectiveMaxHeight);

            onResize(newHeight);
            e.preventDefault();
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = '';
        };

        document.addEventListener('mousemove', handleMouseMove, { passive: false });
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
        };
    }, [startY, startHeight, effectiveMinHeight, effectiveMaxHeight, onResize, isResizing]);

    return (
        <div
            className={cn(
                'h-2 bg-gray-100 hover:bg-blue-100 cursor-row-resize transition-colors',
                'flex items-center justify-center',
                isResizing && 'bg-blue-200'
            )}
            onMouseDown={handleMouseDown}
        >
            <div className="w-20 h-1 bg-gray-300 rounded-full" />
        </div>
    );
} 