import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToastStore, type ToastType } from '../../store/useToastStore';
import { cn } from '../../lib/utils';

const toastIcons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
};

const toastStyles: Record<ToastType, string> = {
    success: 'bg-green-50 dark:bg-green-950/90 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/80',
    error: 'bg-red-50 dark:bg-red-950/90 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/80',
    info: 'bg-blue-50 dark:bg-blue-950/90 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/80',
};

export function ToastContainer() {
    const { toasts, removeToast } = useToastStore();

    return (
        <div className="fixed bottom-4 right-4 z-[90] flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={cn(
                        'pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border animate-in slide-in-from-right-5 text-xs sm:text-sm font-semibold backdrop-blur-md',
                        toastStyles[toast.type]
                    )}
                >
                    {toastIcons[toast.type]}
                    <span>{toast.message}</span>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="ml-2 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
} 