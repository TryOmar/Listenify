import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

// Type definitions for the experimental Document Picture-in-Picture API
interface DocumentPictureInPictureOptions {
  width?: number;
  height?: number;
}

interface DocumentPictureInPicture {
  requestWindow(options?: DocumentPictureInPictureOptions): Promise<Window>;
  window?: Window;
}

declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPicture;
  }
}

interface PiPWindowProps {
  isOpen: boolean;
  onClose: () => void;
  width?: number;
  height?: number;
  children: React.ReactNode;
}

function copyStylesheetsToWindow(targetWindow: Window) {
  // Copy all style sheets over from the initial document
  // so that the PiP window looks the same.
  const styleSheets = Array.from(document.styleSheets);
  
  styleSheets.forEach((styleSheet) => {
    try {
      // For standard style sheets, we can extract rules and create a <style> tag
      if (styleSheet.cssRules) {
        const cssRules = Array.from(styleSheet.cssRules).map((rule) => rule.cssText).join('');
        const style = targetWindow.document.createElement('style');
        style.textContent = cssRules;
        targetWindow.document.head.appendChild(style);
      }
    } catch (e) {
      // If we can't access cssRules (e.g., cross-origin or no rules), link the stylesheet directly
      if (styleSheet.href) {
        const link = targetWindow.document.createElement('link');
        link.rel = 'stylesheet';
        link.type = styleSheet.type;
        link.media = styleSheet.media instanceof MediaList ? styleSheet.media.mediaText : styleSheet.media;
        link.href = styleSheet.href;
        targetWindow.document.head.appendChild(link);
      }
    }
  });

  // Also copy the dark mode class and data-theme if present on html
  if (document.documentElement.classList.contains('dark')) {
    targetWindow.document.documentElement.classList.add('dark');
  }
  const theme = document.documentElement.getAttribute('data-theme');
  if (theme) {
    targetWindow.document.documentElement.setAttribute('data-theme', theme);
  }
  targetWindow.document.documentElement.style.cssText = document.documentElement.style.cssText;
  
  if (document.body.classList.contains('dark')) {
    targetWindow.document.body.classList.add('dark');
  }
}

export function PiPWindow({ isOpen, onClose, width = 400, height = 500, children }: PiPWindowProps) {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    let activeWindow: Window | null = null;

    async function openPiP() {
      if (!('documentPictureInPicture' in window) || !window.documentPictureInPicture) {
        console.warn('Document Picture-in-Picture API not supported.');
        onClose();
        return;
      }

      try {
        // Close existing if any
        if (window.documentPictureInPicture.window) {
          window.documentPictureInPicture.window.close();
        }

        // Load saved dimensions if available
        const savedWidth = localStorage.getItem('listenify-pip-width');
        const savedHeight = localStorage.getItem('listenify-pip-height');
        const initialWidth = savedWidth ? parseInt(savedWidth, 10) : width;
        const initialHeight = savedHeight ? parseInt(savedHeight, 10) : height;

        const newWindow = await window.documentPictureInPicture.requestWindow({
          width: initialWidth,
          height: initialHeight,
        });

        // Save dimensions on resize
        let resizeTimeout: NodeJS.Timeout;
        newWindow.addEventListener('resize', () => {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            localStorage.setItem('listenify-pip-width', newWindow.innerWidth.toString());
            localStorage.setItem('listenify-pip-height', newWindow.innerHeight.toString());
          }, 500);
        });

        // Setup styles
        copyStylesheetsToWindow(newWindow);

        // Setup container
        const container = newWindow.document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        container.className = 'bg-white dark:bg-slate-900'; // Apply default bg
        newWindow.document.body.style.margin = '0';
        newWindow.document.body.appendChild(container);
        containerRef.current = container;

        // Setup close listener
        newWindow.addEventListener('pagehide', () => {
          setPipWindow(null);
          onClose();
        });

        activeWindow = newWindow;
        setPipWindow(newWindow);
      } catch (err) {
        console.error('Failed to open PiP window:', err);
        onClose();
      }
    }

    if (isOpen && !pipWindow) {
      openPiP();
    } else if (!isOpen && pipWindow) {
      pipWindow.close();
      setPipWindow(null);
    }

    return () => {
      if (activeWindow && !isOpen) {
        activeWindow.close();
      }
    };
  }, [isOpen, width, height, onClose]);

  // Synchronize theme changes
  useEffect(() => {
    if (!pipWindow) return;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        const target = mutation.target as HTMLElement;
        const pipTarget = target === document.documentElement ? pipWindow.document.documentElement : pipWindow.document.body;
        
        if (mutation.attributeName === 'class') {
          pipTarget.className = target.className;
        } else if (mutation.attributeName === 'data-theme') {
          const theme = target.getAttribute('data-theme');
          if (theme) {
            pipTarget.setAttribute('data-theme', theme);
          } else {
            pipTarget.removeAttribute('data-theme');
          }
        } else if (mutation.attributeName === 'style') {
          pipTarget.style.cssText = target.style.cssText;
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [pipWindow]);

  if (!isOpen || !pipWindow || !containerRef.current) {
    return null;
  }

  return createPortal(children, containerRef.current);
}
