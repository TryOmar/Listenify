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
    success: 'bg-green-50 text-green-500 border-green-200',
    error: 'bg-red-50 text-red-500 border-red-200',
    info: 'bg-blue-50 text-blue-500 border-blue-200',
};

export function ToastContainer() {
    const { toasts, removeToast } = useToastStore();

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={cn(
                        'flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-right-5',
                        toastStyles[toast.type]
                    )}
                >
                    {toastIcons[toast.type]}
                    <span className="text-sm">{toast.message}</span>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="ml-2 p-1 hover:bg-black/5 rounded"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
} 