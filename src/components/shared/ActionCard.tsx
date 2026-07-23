import React, { useState } from 'react';
import { Trash2, ChevronUp, ChevronDown, Edit2, Maximize2, X, Check, XCircle } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { useToastStore } from '../../store/useToastStore';
import { cn } from '../../lib/utils';

interface ActionCardProps {
    id: string;
    icon: string;
    name: string;
    content: string;
    onDelete: (id: string) => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onEdit?: (id: string, updates: { icon: string; name: string; content: string }) => void;
    isFirst?: boolean;
    isLast?: boolean;
}

export function ActionCard({
    id,
    icon,
    name,
    content,
    onDelete,
    onMoveUp,
    onMoveDown,
    onEdit,
    isFirst,
    isLast,
}: ActionCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isFullView, setIsFullView] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedValues, setEditedValues] = useState({ icon, name, content });
    const { addToast } = useToastStore();

    const handleDelete = () => {
        if (isDeleting) {
            onDelete(id);
            addToast('Item deleted successfully', 'success');
        } else {
            setIsDeleting(true);
            addToast('Click delete again to confirm', 'info', 2000);
            setTimeout(() => setIsDeleting(false), 2000);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
        setEditedValues({ icon, name, content });
    };

    const handleSave = () => {
        if (onEdit && (editedValues.name.trim() && editedValues.content.trim())) {
            onEdit(id, editedValues);
            setIsEditing(false);
            addToast('Changes saved successfully', 'success');
        } else {
            addToast('Name and content cannot be empty', 'error');
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedValues({ icon, name, content });
    };

    if (isEditing) {
        return (
            <div className="flex flex-col gap-3 p-4 bg-white dark:bg-slate-800 border border-blue-400 dark:border-blue-500 rounded-xl shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                        <EmojiPicker
                            value={editedValues.icon}
                            onChange={(emoji) => setEditedValues({ ...editedValues, icon: emoji })}
                        />
                        <input
                            type="text"
                            value={editedValues.name}
                            onChange={(e) => setEditedValues({ ...editedValues, name: e.target.value })}
                            className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs sm:text-sm rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="Enter name"
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleSave}
                            className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/50 rounded-lg"
                            title="Save changes"
                        >
                            <Check size={18} />
                        </button>
                        <button
                            onClick={handleCancel}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                            title="Cancel editing"
                        >
                            <XCircle size={18} />
                        </button>
                    </div>
                </div>
                <textarea
                    value={editedValues.content}
                    onChange={(e) => setEditedValues({ ...editedValues, content: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg focus:outline-none focus:border-blue-500 min-h-[60px]"
                    placeholder="Enter content"
                />
            </div>
        );
    }

    return (
        <div
            className={cn(
                'flex flex-col gap-2 p-4 rounded-xl transition-all duration-200',
                isDeleting
                    ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80'
                    : 'bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs'
            )}
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <EmojiPicker value={icon} onChange={() => { }} readOnly />
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">{name}</span>
                </div>

                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                    {/* Move Up/Down buttons */}
                    {onMoveUp && !isFirst && (
                        <button
                            onClick={onMoveUp}
                            className="p-1 sm:p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Move Up"
                        >
                            <ChevronUp size={16} />
                        </button>
                    )}
                    {onMoveDown && !isLast && (
                        <button
                            onClick={onMoveDown}
                            className="p-1 sm:p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Move Down"
                        >
                            <ChevronDown size={16} />
                        </button>
                    )}

                    {/* Full View button */}
                    <button
                        onClick={() => setIsFullView(!isFullView)}
                        className="p-1 sm:p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title={isFullView ? 'Minimize' : 'Full View'}
                    >
                        {isFullView ? <X size={16} /> : <Maximize2 size={16} />}
                    </button>

                    {/* Edit button */}
                    {onEdit && (
                        <button
                            onClick={handleEdit}
                            className="p-1 sm:p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Edit"
                        >
                            <Edit2 size={16} />
                        </button>
                    )}

                    {/* Delete button */}
                    <button
                        onClick={handleDelete}
                        className={cn(
                            'p-1 sm:p-1.5 rounded-lg transition-colors',
                            isDeleting
                                ? 'text-red-500 hover:bg-red-100 dark:hover:bg-red-950/60'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        )}
                        title={isDeleting ? 'Click again to confirm deletion' : 'Delete'}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div
                className={cn(
                    'text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-mono pl-0 xs:pl-8 break-all transition-all duration-200',
                    !isFullView && 'line-clamp-1'
                )}
            >
                {content}
            </div>
        </div>
    );
} 