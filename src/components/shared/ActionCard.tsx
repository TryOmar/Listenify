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
            <div className="flex flex-col gap-3 p-4 bg-white border border-blue-200 rounded-lg">
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
                            className="flex-1 px-2 py-1 border rounded focus:outline-none focus:border-blue-300"
                            placeholder="Enter name"
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleSave}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-md"
                            title="Save changes"
                        >
                            <Check size={18} />
                        </button>
                        <button
                            onClick={handleCancel}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md"
                            title="Cancel editing"
                        >
                            <XCircle size={18} />
                        </button>
                    </div>
                </div>
                <textarea
                    value={editedValues.content}
                    onChange={(e) => setEditedValues({ ...editedValues, content: e.target.value })}
                    className="w-full px-2 py-1 text-sm font-mono text-gray-600 border rounded focus:outline-none focus:border-blue-300 min-h-[60px]"
                    placeholder="Enter content"
                />
            </div>
        );
    }

    return (
        <div
            className={cn(
                'flex flex-col gap-2 p-4 rounded-lg transition-all duration-200',
                isDeleting ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-200 hover:border-blue-200 hover:shadow-sm'
            )}
        >
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                    <EmojiPicker value={icon} onChange={() => { }} readOnly />
                    <span className="font-medium">{name}</span>
                </div>

                <div className="flex items-center gap-1">
                    {/* Move Up/Down buttons */}
                    {onMoveUp && !isFirst && (
                        <button
                            onClick={onMoveUp}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md"
                            title="Move Up"
                        >
                            <ChevronUp size={18} />
                        </button>
                    )}
                    {onMoveDown && !isLast && (
                        <button
                            onClick={onMoveDown}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md"
                            title="Move Down"
                        >
                            <ChevronDown size={18} />
                        </button>
                    )}

                    {/* Full View button */}
                    <button
                        onClick={() => setIsFullView(!isFullView)}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md"
                        title={isFullView ? 'Minimize' : 'Full View'}
                    >
                        {isFullView ? <X size={18} /> : <Maximize2 size={18} />}
                    </button>

                    {/* Edit button */}
                    {onEdit && (
                        <button
                            onClick={handleEdit}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md"
                            title="Edit"
                        >
                            <Edit2 size={18} />
                        </button>
                    )}

                    {/* Delete button */}
                    <button
                        onClick={handleDelete}
                        className={cn(
                            'p-1.5 rounded-md transition-colors',
                            isDeleting
                                ? 'text-red-500 hover:bg-red-100'
                                : 'text-gray-500 hover:bg-gray-100'
                        )}
                        title={isDeleting ? 'Click again to confirm deletion' : 'Delete'}
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div
                className={cn(
                    'text-sm text-gray-600 font-mono pl-10 transition-all duration-200',
                    !isFullView && 'line-clamp-1'
                )}
            >
                {content}
            </div>
        </div>
    );
} 