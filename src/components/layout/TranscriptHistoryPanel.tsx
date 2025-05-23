import React, { useEffect, useState, useRef } from 'react';
import { getTranscripts, TranscriptEntry, downloadTranscript, updateTranscript, getFolders, addFolder, FolderEntry, deleteTranscript, deleteFolder, updateFolder } from '../../lib/transcriptDb';
import { FolderPlus, Trash2, X, Download, Edit, Plus, Folder, FileText, Save, ArrowLeft, MoreVertical, FileArchive } from 'lucide-react';
import JSZip from 'jszip';

interface TranscriptHistoryPanelProps {
  onClose: () => void;
}

const UNCATEGORIZED_ID = 'uncategorized';
const ALL_ID = 'all';

export function TranscriptHistoryPanel({ onClose }: TranscriptHistoryPanelProps) {
  const [folders, setFolders] = useState<FolderEntry[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>(ALL_ID);
  const [allTranscripts, setAllTranscripts] = useState<TranscriptEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TranscriptEntry | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNewFolderPrompt, setShowNewFolderPrompt] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showDeleteTranscriptId, setShowDeleteTranscriptId] = useState<string | null>(null);
  const [showDeleteFolderId, setShowDeleteFolderId] = useState<string | null>(null);
  const [downloadFolderId, setDownloadFolderId] = useState<string | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadFolderName, setDownloadFolderName] = useState('');
  const [selectedTranscripts, setSelectedTranscripts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkMoveMessage, setBulkMoveMessage] = useState<string | null>(null);
  const bulkMoveTimeout = useRef<number | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [lastCheckedIndex, setLastCheckedIndex] = useState<number | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameFolderName, setRenameFolderName] = useState('');
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null);
  const [showBulkDownloadModal, setShowBulkDownloadModal] = useState(false);

  // Load all folders and all transcripts on mount and after any change
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    const [foldersData, transcriptsData] = await Promise.all([
      getFolders(),
      getTranscripts()
    ]);
    setFolders(foldersData);
    setAllTranscripts(transcriptsData);
    setLoading(false);
  };

  // Filtered transcripts for the selected folder
  const filteredTranscripts =
    selectedFolder === ALL_ID
      ? allTranscripts
      : selectedFolder === UNCATEGORIZED_ID
      ? allTranscripts.filter(t => !t.folderId)
      : allTranscripts.filter(t => t.folderId === selectedFolder);

  // Folder counts
  const uncategorizedCount = allTranscripts.filter(t => !t.folderId).length;
  const allCount = allTranscripts.length;
  const folderCounts: Record<string, number> = {};
  folders.forEach(f => {
    folderCounts[f.folderId] = allTranscripts.filter(t => t.folderId === f.folderId).length;
  });

  const handleDownload = (entry: TranscriptEntry) => {
    downloadTranscript(entry);
  };

  const handleEdit = (entry: TranscriptEntry) => {
    setSelected(entry);
    setEditTitle(entry.title);
    setEditText(entry.text);
    setEditMode(true);
  };

  const handleView = (entry: TranscriptEntry) => {
    setSelected(entry);
    setEditTitle(entry.title);
    setEditText(entry.text);
    setEditMode(false);
  };

  const handleNewFolder = async () => {
    if (!newFolderName.trim()) return;
    await addFolder(newFolderName.trim());
    setShowNewFolderPrompt(false);
    setNewFolderName('');
    await loadAllData();
  };

  const handleMoveTranscript = async (transcript: TranscriptEntry, targetFolderId: string) => {
    await updateTranscript(transcript.transcriptId, { folderId: targetFolderId === UNCATEGORIZED_ID ? null : targetFolderId });
    await loadAllData();
    // If the edit modal is open for this transcript, update its folderId in local state
    if (selected && selected.transcriptId === transcript.transcriptId) {
      setSelected({ ...selected, folderId: targetFolderId === UNCATEGORIZED_ID ? null : targetFolderId });
    }
  };

  const handleDeleteTranscript = async (transcriptId: string) => {
    await deleteTranscript(transcriptId);
    setShowDeleteTranscriptId(null);
    await loadAllData();
  };

  const handleDeleteFolder = async (folderId: string) => {
    // Move all transcripts in this folder to Uncategorized
    const toMove = allTranscripts.filter(t => t.folderId === folderId);
    for (const t of toMove) {
      await updateTranscript(t.transcriptId, { folderId: null });
    }
    await deleteFolder(folderId);
    setShowDeleteFolderId(null);
    // If currently viewing this folder, switch to All
    if (selectedFolder === folderId) setSelectedFolder(ALL_ID);
    await loadAllData();
  };

  const handleDownloadFolder = (folderId: string, folderName: string) => {
    setDownloadFolderId(folderId);
    setDownloadFolderName(folderName);
    setShowDownloadModal(true);
  };

  const handleDownloadFolderAsZip = async () => {
    if (!downloadFolderId) return;
    const transcripts = downloadFolderId === UNCATEGORIZED_ID
      ? allTranscripts.filter(t => !t.folderId)
      : allTranscripts.filter(t => t.folderId === downloadFolderId);
    const zip = new JSZip();
    transcripts.forEach(t => {
      zip.file(`${t.title.replace(/[^a-z0-9]/gi, '_')}.txt`, t.text);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${downloadFolderName || 'folder'}.zip`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    setShowDownloadModal(false);
    setDownloadFolderId(null);
  };

  const handleDownloadFolderMerged = () => {
    if (!downloadFolderId) return;
    const transcripts = downloadFolderId === UNCATEGORIZED_ID
      ? allTranscripts.filter(t => !t.folderId)
      : allTranscripts.filter(t => t.folderId === downloadFolderId);
    // Sort by createdAt ascending (oldest to newest)
    const sortedTranscripts = [...transcripts].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const mergedText = sortedTranscripts.map(t => `--- ${t.title} ---\n${t.text}`).join('\n\n');
    const blob = new Blob([mergedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${downloadFolderName || 'folder'}_merged.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    setShowDownloadModal(false);
    setDownloadFolderId(null);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTranscripts([]);
      setSelectAll(false);
    } else {
      setSelectedTranscripts(filteredTranscripts.map((t) => t.transcriptId));
      setSelectAll(true);
    }
  };

  const handleBulkMove = async (targetFolderId: string) => {
    await Promise.all(selectedTranscripts.map((id) => updateTranscript(id, { folderId: targetFolderId === UNCATEGORIZED_ID ? null : targetFolderId })));
    setBulkMoveMessage(`Moved ${selectedTranscripts.length} transcript${selectedTranscripts.length > 1 ? 's' : ''}!`);
    setSelectedTranscripts([]);
    setSelectAll(false);
    await loadAllData();
    if (bulkMoveTimeout.current) clearTimeout(bulkMoveTimeout.current);
    bulkMoveTimeout.current = window.setTimeout(() => setBulkMoveMessage(null), 2000);
  };

  const handleBulkDelete = async () => {
    if (selectedTranscripts.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedTranscripts.length} transcript(s)? This cannot be undone.`)) return;
    await Promise.all(selectedTranscripts.map(id => deleteTranscript(id)));
    setSelectedTranscripts([]);
    setSelectAll(false);
    await loadAllData();
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedTranscripts([]);
    setSelectAll(false);
  };

  const handleCheckboxClick = (e: React.ChangeEvent<HTMLInputElement>, id: string, idx: number) => {
    const isChecked = e.target.checked;
    if (e.nativeEvent instanceof PointerEvent && e.nativeEvent.shiftKey && lastCheckedIndex !== null) {
      // Shift is held, select range
      const start = Math.min(lastCheckedIndex, idx);
      const end = Math.max(lastCheckedIndex, idx);
      const idsInRange = filteredTranscripts.slice(start, end + 1).map(t => t.transcriptId);
      setSelectedTranscripts(prev => {
        const set = new Set(prev);
        idsInRange.forEach(idInRange => {
          if (isChecked) set.add(idInRange);
          else set.delete(idInRange);
        });
        return Array.from(set);
      });
    } else {
      // Normal click
      setSelectedTranscripts(prev =>
        isChecked ? [...prev, id] : prev.filter(tid => tid !== id)
      );
    }
    setLastCheckedIndex(idx);
  };

  const handleRenameFolder = (folderId: string, currentName: string) => {
    setRenamingFolderId(folderId);
    setRenameFolderName(currentName);
  };

  const handleRenameFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingFolderId || !renameFolderName.trim()) return;
    await updateFolder(renamingFolderId, { folderName: renameFolderName.trim() });
    setRenamingFolderId(null);
    setRenameFolderName('');
    await loadAllData();
  };

  // Close popover on outside click
  useEffect(() => {
    if (!openFolderMenuId) return;
    const handle = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.folder-action-menu')) {
        setOpenFolderMenuId(null);
      }
    };
    window.addEventListener('mousedown', handle);
    return () => window.removeEventListener('mousedown', handle);
  }, [openFolderMenuId]);

  const handleBulkDownloadMerged = () => {
    const selected = allTranscripts.filter(t => selectedTranscripts.includes(t.transcriptId));
    if (selected.length === 0) return;
    // Sort by createdAt ascending (oldest to newest)
    const sortedSelected = [...selected].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const mergedText = sortedSelected.map(t => `--- ${t.title} ---\n${t.text}`).join('\n\n');
    const blob = new Blob([mergedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcripts_merged.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    setShowBulkDownloadModal(false);
  };

  const handleBulkDownloadZip = async () => {
    const selected = allTranscripts.filter(t => selectedTranscripts.includes(t.transcriptId));
    if (selected.length === 0) return;
    const zip = new JSZip();
    // Group by folderId
    const byFolder: Record<string, TranscriptEntry[]> = {};
    selected.forEach(t => {
      const folderKey = t.folderId || 'Uncategorized';
      if (!byFolder[folderKey]) byFolder[folderKey] = [];
      byFolder[folderKey].push(t);
    });
    Object.entries(byFolder).forEach(([folderId, transcripts]) => {
      if (transcripts.length === 0) return;
      const folderName = folderId === 'Uncategorized' ? 'Uncategorized' : (folders.find(f => f.folderId === folderId)?.folderName || 'Folder');
      const folder = zip.folder(folderName);
      transcripts.forEach(t => {
        folder?.file(`${t.title.replace(/[^a-z0-9]/gi, '_')}.txt`, t.text);
      });
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcripts_selected.zip`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    setShowBulkDownloadModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-[100] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex z-[101] border border-gray-200">
        {/* Sidebar for folders */}
        <div className="w-60 border-r flex flex-col p-4 bg-gray-50 rounded-l-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-base flex items-center gap-2"><Folder className="w-5 h-5" />Folders</span>
            <button
              className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition"
              title="New Folder"
              onClick={() => setShowNewFolderPrompt(true)}
            >
              <FolderPlus className="w-5 h-5" />
            </button>
          </div>
          <div>
            <div
              className={`cursor-pointer px-3 py-2 rounded mb-1 flex items-center gap-2 ${selectedFolder === ALL_ID ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-200'}`}
              onClick={() => setSelectedFolder(ALL_ID)}
            >
              <FileText className="w-4 h-4" /> All
              <span className="ml-auto text-xs text-gray-500">{allCount}</span>
            </div>
            <div
              className={`cursor-pointer px-3 py-2 rounded mb-1 flex items-center gap-2 ${selectedFolder === UNCATEGORIZED_ID ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-200'}`}
              onClick={() => setSelectedFolder(UNCATEGORIZED_ID)}
            >
              <Folder className="w-4 h-4 opacity-60" /> Uncategorized
              <span className="ml-auto text-xs text-gray-500">{uncategorizedCount}</span>
              <button
                className="ml-2 p-1 rounded-full hover:bg-blue-100 text-blue-500 hover:text-blue-700 transition"
                title="Download Folder"
                onClick={e => { e.stopPropagation(); handleDownloadFolder(UNCATEGORIZED_ID, 'Uncategorized'); }}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
            {folders.map(folder => (
              <div
                key={folder.folderId}
                className={`flex items-center justify-between cursor-pointer px-3 py-2 rounded mb-1 ${selectedFolder === folder.folderId ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-200'}`}
                onClick={e => {
                  if ((e.target as HTMLElement).closest('.folder-action-menu, form')) return;
                  setSelectedFolder(folder.folderId);
                }}
              >
                <span className="flex items-center gap-2 flex-1 min-w-0">
                  <Folder className="w-4 h-4" />
                  {renamingFolderId === folder.folderId ? (
                    <form onSubmit={handleRenameFolderSubmit} className="flex items-center gap-1">
                      <input
                        className="border rounded px-1 py-0.5 text-sm w-28 focus:outline-none focus:ring focus:border-blue-400"
                        value={renameFolderName}
                        onChange={e => setRenameFolderName(e.target.value)}
                        autoFocus
                        maxLength={50}
                        onClick={e => e.stopPropagation()}
                      />
                      <button type="submit" className="text-blue-600 hover:text-blue-800 px-1" title="Save"><Save className="w-4 h-4" /></button>
                      <button type="button" className="text-gray-400 hover:text-gray-700 px-1" title="Cancel" onClick={e => { e.stopPropagation(); setRenamingFolderId(null); }}><X className="w-4 h-4" /></button>
                    </form>
                  ) : (
                    <span className="truncate">{folder.folderName}</span>
                  )}
                  <span className="ml-auto text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5 flex-shrink-0">{folderCounts[folder.folderId] || 0}</span>
                </span>
                <span className="relative folder-action-menu ml-2 flex-shrink-0">
                  <button
                    className="p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-blue-700 transition"
                    title="More actions"
                    onClick={e => { e.stopPropagation(); setOpenFolderMenuId(folder.folderId === openFolderMenuId ? null : folder.folderId); }}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {openFolderMenuId === folder.folderId && (
                    <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 folder-action-menu animate-fade-in">
                      <button
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-t-lg"
                        onClick={e => { e.stopPropagation(); handleRenameFolder(folder.folderId, folder.folderName); setOpenFolderMenuId(null); }}
                      >
                        <Edit className="w-4 h-4" /> Rename
                      </button>
                      <button
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                        onClick={e => { e.stopPropagation(); handleDownloadFolder(folder.folderId, folder.folderName); setOpenFolderMenuId(null); }}
                      >
                        <Download className="w-4 h-4" /> Download
                      </button>
                      <button
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                        onClick={e => { e.stopPropagation(); setShowDeleteFolderId(folder.folderId); setOpenFolderMenuId(null); }}
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Main transcript list */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold flex items-center gap-2"><ArrowLeft className="w-5 h-5" />Transcript History</h3>
            <div className="flex items-center gap-2">
              {!selectionMode && filteredTranscripts.length > 0 && (
                <button
                  className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium transition"
                  onClick={() => setSelectionMode(true)}
                >
                  Select
                </button>
              )}
              {selectionMode && (
                <button
                  className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition"
                  onClick={handleCancelSelection}
                >
                  Cancel
                </button>
              )}
              <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-200 transition" title="Close"><X className="w-5 h-5" /></button>
            </div>
          </div>
          {/* Bulk move bar */}
          {selectionMode && selectedTranscripts.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 border-b border-blue-200 shadow-sm rounded-t-md relative">
              <span className="text-blue-800 font-semibold text-sm">{selectedTranscripts.length} selected</span>
              <select
                className="px-2 py-1.5 border border-blue-300 rounded-md text-sm bg-white shadow-sm hover:border-blue-500 focus:border-blue-500 transition"
                defaultValue=""
                title="Move selected transcripts to folder"
                onChange={e => { if (e.target.value) handleBulkMove(e.target.value); }}
              >
                <option value="" disabled>Move to folder...</option>
                <option value={UNCATEGORIZED_ID}>Uncategorized</option>
                {folders.map(folder => (
                  <option key={folder.folderId} value={folder.folderId}>{folder.folderName}</option>
                ))}
              </select>
              <button
                className="px-2 py-1.5 rounded-md bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition flex items-center gap-1.5"
                onClick={() => setShowBulkDownloadModal(true)}
                title="Download selected transcripts"
              >
                <Download className="w-4 h-4" /> Download
              </button>
              <button
                className="px-2 py-1.5 rounded-md bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition flex items-center gap-1.5"
                onClick={handleBulkDelete}
                title="Delete selected transcripts"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
              <button className="ml-2 text-xs text-blue-700 hover:text-blue-900 underline px-2 py-1 rounded transition" onClick={handleCancelSelection}>Clear</button>
              {bulkMoveMessage && (
                <span className="absolute right-4 text-green-600 font-medium bg-green-50 px-3 py-1 rounded shadow-sm animate-fade-in">{bulkMoveMessage}</span>
              )}
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-gray-400 text-center py-8">Loading...</div>
            ) : filteredTranscripts.length === 0 ? (
              <div className="text-gray-400 text-center py-8">Transcript history will appear here.</div>
            ) : (
              <ul className="space-y-4">
                {selectionMode && (
                  <li className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="accent-blue-500 w-4 h-4 rounded cursor-pointer"
                      title={selectAll ? 'Deselect all' : 'Select all'}
                    />
                    <span className="text-xs text-gray-600 cursor-pointer select-none">{selectAll ? 'Deselect All' : 'Select All'}</span>
                  </li>
                )}
                {filteredTranscripts.map((t, idx) => (
                  <li key={t.transcriptId} className={`border rounded-lg p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gray-50 transition-colors shadow-sm ${selectionMode && selectedTranscripts.includes(t.transcriptId) ? 'ring-2 ring-blue-400 bg-blue-50 hover:bg-blue-100' : selectionMode ? 'hover:bg-gray-100' : ''}`}>
                    <div className="flex items-center gap-3">
                      {selectionMode && (
                        <input
                          type="checkbox"
                          checked={selectedTranscripts.includes(t.transcriptId)}
                          onChange={e => handleCheckboxClick(e, t.transcriptId, idx)}
                          className="accent-blue-500 w-4 h-4 rounded cursor-pointer"
                          title="Select transcript"
                        />
                      )}
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleView(t)}>
                        <div className="font-semibold truncate text-base">{t.title}</div>
                        <div className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleString()} &bull; {t.wordCount} words</div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 items-center">
                      <button className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 transition" title="Download" onClick={() => handleDownload(t)}><Download className="w-4 h-4" /></button>
                      <button className="p-2 rounded-full bg-gray-50 hover:bg-gray-200 text-gray-700 transition" title="Edit" onClick={() => handleEdit(t)}><Edit className="w-4 h-4" /></button>
                      <button className="p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-700 transition" title="Delete" onClick={() => setShowDeleteTranscriptId(t.transcriptId)}><Trash2 className="w-4 h-4" /></button>
                      <select
                        className="px-1 py-1 text-xs border rounded bg-white text-gray-700"
                        value={t.folderId || UNCATEGORIZED_ID}
                        onChange={e => handleMoveTranscript(t, e.target.value)}
                        title="Move to folder"
                      >
                        <option value={UNCATEGORIZED_ID}>Uncategorized</option>
                        {folders.map(folder => (
                          <option key={folder.folderId} value={folder.folderId}>{folder.folderName}</option>
                        ))}
                      </select>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      {/* New Folder Prompt */}
      {showNewFolderPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-[110] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xs flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="text-base font-semibold flex items-center gap-2"><FolderPlus className="w-5 h-5" />New Folder</h4>
              <button onClick={() => setShowNewFolderPrompt(false)} className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-200 transition" title="Close"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <input
                className="w-full border rounded px-2 py-1 mb-2 text-base"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                maxLength={50}
                autoFocus
              />
              <button
                className="w-full px-3 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold flex items-center justify-center gap-2"
                onClick={handleNewFolder}
              >
                <Plus className="w-4 h-4" /> Create Folder
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Transcript Prompt */}
      {showDeleteTranscriptId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-[120] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xs flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="text-base font-semibold flex items-center gap-2"><Trash2 className="w-5 h-5" />Delete Transcript</h4>
              <button onClick={() => setShowDeleteTranscriptId(null)} className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-200 transition" title="Close"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <p>Are you sure you want to delete this transcript?</p>
              <button
                className="w-full px-3 py-2 mt-4 rounded bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center justify-center gap-2"
                onClick={() => handleDeleteTranscript(showDeleteTranscriptId)}
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Folder Prompt */}
      {showDeleteFolderId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-[120] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xs flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="text-base font-semibold flex items-center gap-2"><Trash2 className="w-5 h-5" />Delete Folder</h4>
              <button onClick={() => setShowDeleteFolderId(null)} className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-200 transition" title="Close"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <p>Are you sure you want to delete this folder? All transcripts in this folder will be moved to Uncategorized.</p>
              <button
                className="w-full px-3 py-2 mt-4 rounded bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center justify-center gap-2"
                onClick={() => handleDeleteFolder(showDeleteFolderId)}
              >
                <Trash2 className="w-4 h-4" /> Delete Folder
              </button>
            </div>
          </div>
        </div>
      )}
      {/* View/Edit Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-[110] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="text-base font-semibold flex items-center gap-2">{editMode ? (<><Edit className="w-5 h-5" />Edit Transcript</>) : (<><FileText className="w-5 h-5" />View Transcript</>)} </h4>
              <button onClick={() => { setSelected(null); setEditMode(false); }} className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-200 transition" title="Close"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <input
                className="w-full border rounded px-2 py-1 mb-2 text-base font-semibold"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                disabled={!editMode}
                maxLength={100}
              />
              <textarea
                className="w-full border rounded px-2 py-1 text-sm min-h-[120px]"
                value={editText}
                onChange={e => setEditText(e.target.value)}
                disabled={!editMode}
              />
              <div>
                <label className="block text-xs font-medium mb-1">Folder</label>
                <select
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={selected.folderId || UNCATEGORIZED_ID}
                  onChange={e => {
                    if (editMode && selected) {
                      setSelected({ ...selected, folderId: e.target.value === UNCATEGORIZED_ID ? null : e.target.value });
                    }
                  }}
                  disabled={!editMode}
                >
                  <option value={UNCATEGORIZED_ID}>Uncategorized</option>
                  {folders.map(folder => (
                    <option key={folder.folderId} value={folder.folderId}>{folder.folderName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              {!editMode && (
                <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1" onClick={() => setEditMode(true)} title="Edit"><Edit className="w-4 h-4" /></button>
              )}
              <button className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center gap-1" onClick={() => handleDownload(selected)} title="Download"><Download className="w-4 h-4" /></button>
              <button className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-700 flex items-center gap-1" onClick={() => setShowDeleteTranscriptId(selected.transcriptId)} title="Delete"><Trash2 className="w-4 h-4" /></button>
              {editMode && (
                <button className="p-2 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center gap-1" onClick={async () => {
                  setSaving(true);
                  await updateTranscript(selected.transcriptId, { title: editTitle, text: editText, folderId: selected.folderId });
                  setSaving(false);
                  setEditMode(false);
                  setSelected(null);
                  await loadAllData();
                }} disabled={saving} title="Save">
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-[120] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col p-6 items-center">
            <div className="flex items-center justify-between w-full mb-4">
              <h4 className="text-lg font-bold flex items-center gap-2"><Download className="w-6 h-6" />Download Folder</h4>
              <button onClick={() => { setShowDownloadModal(false); setDownloadFolderId(null); }} className="text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition" title="Close"><X className="w-5 h-5" /></button>
            </div>
            <div className="text-gray-600 text-center mb-6 w-full">How would you like to download <span className="font-semibold text-gray-800">{downloadFolderName}</span>?</div>
            <div className="flex flex-col gap-4 w-full">
              <button
                className="flex items-center justify-center gap-3 w-full py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-base font-semibold shadow transition"
                onClick={handleDownloadFolderAsZip}
              >
                <Download className="w-5 h-5" /> ZIP (separate files)
              </button>
              <div className="w-full flex items-center gap-2 text-gray-300">
                <div className="flex-1 h-px bg-gray-200" />or<div className="flex-1 h-px bg-gray-200" />
              </div>
              <button
                className="flex items-center justify-center gap-3 w-full py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white text-base font-semibold shadow transition"
                onClick={handleDownloadFolderMerged}
              >
                <Download className="w-5 h-5" /> Merge to one .txt
              </button>
            </div>
            <button
              className="mt-6 text-gray-500 hover:text-gray-700 text-sm px-4 py-2 rounded transition"
              onClick={() => { setShowDownloadModal(false); setDownloadFolderId(null); }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {showBulkDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-[130] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col p-6 items-center">
            <div className="flex items-center justify-between w-full mb-4">
              <h4 className="text-lg font-bold flex items-center gap-2"><Download className="w-6 h-6" />Download Selected</h4>
              <button onClick={() => setShowBulkDownloadModal(false)} className="text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition" title="Close"><X className="w-5 h-5" /></button>
            </div>
            <div className="text-gray-600 text-center mb-6 w-full">How would you like to download the selected transcripts?</div>
            <div className="flex flex-col gap-4 w-full">
              <button
                className="flex items-center justify-center gap-3 w-full py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-base font-semibold shadow transition"
                onClick={handleBulkDownloadZip}
              >
                <FileArchive className="w-5 h-5" /> ZIP (folders & files)
              </button>
              <div className="w-full flex items-center gap-2 text-gray-300">
                <div className="flex-1 h-px bg-gray-200" />or<div className="flex-1 h-px bg-gray-200" />
              </div>
              <button
                className="flex items-center justify-center gap-3 w-full py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white text-base font-semibold shadow transition"
                onClick={handleBulkDownloadMerged}
              >
                <Download className="w-5 h-5" /> Merge to one .txt
              </button>
            </div>
            <button
              className="mt-6 text-gray-500 hover:text-gray-700 text-sm px-4 py-2 rounded transition"
              onClick={() => setShowBulkDownloadModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 