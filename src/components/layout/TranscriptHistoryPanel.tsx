import React, { useEffect, useState } from 'react';
import { getTranscripts, TranscriptEntry, downloadTranscript, updateTranscript, getFolders, addFolder, FolderEntry, deleteTranscript, deleteFolder } from '../../lib/transcriptDb';
import { FolderPlus, Trash2, X, Download, Edit, Plus, Folder, FileText, Save, ArrowLeft } from 'lucide-react';

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
            </div>
            {folders.map(folder => (
              <div
                key={folder.folderId}
                className={`flex items-center justify-between cursor-pointer px-3 py-2 rounded mb-1 ${selectedFolder === folder.folderId ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-200'}`}
                onClick={e => {
                  if ((e.target as HTMLElement).closest('.delete-folder-btn')) return;
                  setSelectedFolder(folder.folderId);
                }}
              >
                <span className="flex items-center gap-2"><Folder className="w-4 h-4" />{folder.folderName}</span>
                <span className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">{folderCounts[folder.folderId] || 0}</span>
                  <button
                    className="delete-folder-btn text-red-400 hover:text-red-600 ml-2 p-1 rounded-full hover:bg-red-100 transition"
                    title="Delete Folder"
                    onClick={e => { e.stopPropagation(); setShowDeleteFolderId(folder.folderId); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Main transcript list */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold flex items-center gap-2"><ArrowLeft className="w-5 h-5" />Transcript History</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-200 transition" title="Close"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-gray-400 text-center py-8">Loading...</div>
            ) : filteredTranscripts.length === 0 ? (
              <div className="text-gray-400 text-center py-8">Transcript history will appear here.</div>
            ) : (
              <ul className="space-y-4">
                {filteredTranscripts.map((t) => (
                  <li key={t.transcriptId} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-gray-50 hover:bg-gray-100 transition-colors shadow-sm">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleView(t)}>
                      <div className="font-semibold truncate">{t.title}</div>
                      <div className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleString()} &bull; {t.wordCount} words</div>
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
    </div>
  );
} 