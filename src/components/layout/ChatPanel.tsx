import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../lib/utils';
import { useChatStore } from '../../store/useChatStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useToastStore } from '../../store/useToastStore';
import { generateGeminiResponse } from '../../services/geminiService';
import DiscordIcon from '../../icons/discord.svg';

export function ChatPanel() {
    const { messages, addMessage, clearMessages } = useChatStore();
    const { aiModels, activeModelId, general } = useSettingsStore();
    const { addToast } = useToastStore();
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeModel = aiModels.find(model => model.id === activeModelId);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isLoading) return;

        // Add user message
        addMessage(newMessage, 'user');
        setNewMessage('');
        setIsLoading(true);

        try {
            if (activeModel?.model === 'gemini' && activeModel.apiKey) {
                // Use Gemini with chat history
                const response = await generateGeminiResponse(
                    newMessage,
                    activeModel.apiKey,
                    messages.map(msg => ({
                        sender: msg.sender,
                        text: msg.text
                    }))
                );
                addMessage(response, 'ai');
            } else {
                // Fallback to simulation
                setTimeout(() => {
                    addMessage('Please configure an AI model in settings.', 'ai');
                }, 1000);
            }
        } catch (error) {
            console.error('Error generating response:', error);
            addToast('Error generating AI response', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearChat = () => {
        clearMessages();
        addToast('Chat cleared', 'info');
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                        <MessageSquare size={40} className="mb-2 opacity-50" />
                        <p className="text-center font-medium">No messages yet. Start a conversation!</p>
                        {!activeModel?.apiKey && (
                            <div className="text-center mt-2">
                                <p className="text-sm text-slate-400 dark:text-slate-500 mb-3">
                                    Note: Configure an AI model in settings to get started.
                                </p>
                                <a
                                    href="https://discord.gg/c3pxrhTCAB"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl transition-colors text-sm font-semibold shadow-xs"
                                >
                                    <img src={DiscordIcon} alt="Discord" width="16" height="16" />
                                    Join our Discord for help
                                </a>
                            </div>
                        )}
                    </div>
                ) : (
                    messages.map(message => (
                        <div
                            key={message.id}
                            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={cn(
                                    'max-w-[85%] p-3 rounded-2xl shadow-2xs',
                                    message.sender === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-none font-medium'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/80 dark:border-slate-700/80'
                                )}
                                style={{ fontSize: `${general.aiChatFontSize}px` }}
                            >
                                {message.sender === 'user' ? (
                                    <p className="whitespace-pre-wrap">{message.text}</p>
                                ) : (
                                    <div className="prose dark:prose-invert max-w-none [&>ul]:pl-6 [&>ol]:pl-6 [&>ul]:list-disc [&>ol]:list-decimal [&>ul>li]:my-0 [&>ol>li]:my-0 [&>p]:my-1" style={{ fontSize: 'inherit' }}>
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                code({ inline, className, children, ...props }) {
                                                    return (
                                                        <code
                                                            className={cn(
                                                                'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded px-1.5 py-0.5 font-mono text-[0.9em]',
                                                                !inline && 'block bg-slate-900 dark:bg-slate-950 text-slate-100 p-3 my-2 border border-slate-800 rounded-xl overflow-x-auto',
                                                                className
                                                            )}
                                                            {...props}
                                                        >
                                                            {children}
                                                        </code>
                                                    );
                                                },
                                                a({ children, ...props }) {
                                                    return (
                                                        <a
                                                            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            {...props}
                                                        >
                                                            {children}
                                                        </a>
                                                    );
                                                }
                                            }}
                                        >
                                            {message.text}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex gap-2 items-center">
                    <textarea
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e);
                            }
                        }}
                        placeholder={isLoading ? 'AI is thinking...' : 'Type a message...'}
                        disabled={isLoading}
                        rows={1}
                        className="flex-1 px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none text-xs sm:text-sm"
                        style={{
                            minHeight: '42px',
                            maxHeight: '200px',
                            height: 'auto',
                            overflowY: 'auto'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 shadow-xs"
                        title="Send message"
                    >
                        <Send size={18} />
                    </button>
                    {messages.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClearChat}
                            disabled={isLoading}
                            className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors disabled:opacity-50"
                            title="Clear chat"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
} 