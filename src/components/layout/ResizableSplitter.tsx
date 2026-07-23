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

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        setIsResizing(true);
        setStartY(touch.clientY);
        const topPanel = (e.target as HTMLElement).closest('.transcript-panel')?.querySelector('.transcript-content');
        if (topPanel) {
            setStartHeight(topPanel.clientHeight);
        }
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

        const handleTouchMove = (e: TouchEvent) => {
            if (!isResizing) return;
            const touch = e.touches[0];
            const diff = touch.clientY - startY;
            let newHeight = Math.max(effectiveMinHeight, startHeight + diff);
            newHeight = Math.min(newHeight, effectiveMaxHeight);

            onResize(newHeight);
            if (e.cancelable) e.preventDefault();
        };

        const handleTouchEnd = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove, { passive: false });
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.body.style.cursor = '';
        };
    }, [startY, startHeight, effectiveMinHeight, effectiveMaxHeight, onResize, isResizing]);

    return (
        <div
            className={cn(
                'group relative h-3.5 bg-slate-100/90 dark:bg-slate-900 hover:bg-blue-50/80 dark:hover:bg-slate-800 cursor-row-resize transition-all border-y border-slate-200/70 dark:border-slate-800 select-none z-1',
                'flex items-center justify-center touch-none',
                isResizing && 'bg-blue-100/90 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700'
            )}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            title="Drag up or down to adjust panel height"
        >
            <div className={cn(
                "w-14 h-1 rounded-full transition-all bg-slate-300 dark:bg-slate-600 group-hover:bg-blue-500 dark:group-hover:bg-blue-400 group-hover:w-20",
                isResizing && "bg-blue-600 dark:bg-blue-400 w-24"
            )} />
        </div>
    );
} 