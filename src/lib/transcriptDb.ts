// Transcript IndexedDB utility for Listenify

const DB_NAME = 'listenify-transcripts';
const TRANSCRIPTS_STORE = 'transcripts';
const FOLDERS_STORE = 'folders';
const DB_VERSION = 2; // Bump version for new store

export interface FolderEntry {
  folderId: string;
  folderName: string;
  createdAt: string;
}

export interface TranscriptEntry {
  transcriptId: string;
  title: string;
  text: string;
  createdAt: string;
  wordCount: number;
  folderId: string | null;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      // WARNING: This will delete all existing transcripts on upgrade from v1 to v2
      if (event.oldVersion < 2) {
        if (db.objectStoreNames.contains(TRANSCRIPTS_STORE)) {
          db.deleteObjectStore(TRANSCRIPTS_STORE);
        }
        db.createObjectStore(TRANSCRIPTS_STORE, { keyPath: 'transcriptId' });
        if (!db.objectStoreNames.contains(FOLDERS_STORE)) {
          db.createObjectStore(FOLDERS_STORE, { keyPath: 'folderId' });
        }
      } else {
        if (!db.objectStoreNames.contains(TRANSCRIPTS_STORE)) {
          db.createObjectStore(TRANSCRIPTS_STORE, { keyPath: 'transcriptId' });
        }
        if (!db.objectStoreNames.contains(FOLDERS_STORE)) {
          db.createObjectStore(FOLDERS_STORE, { keyPath: 'folderId' });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveTranscript(entry: Omit<TranscriptEntry, 'transcriptId' | 'createdAt'>) {
  const db = await openDB();
  const tx = db.transaction(TRANSCRIPTS_STORE, 'readwrite');
  const store = tx.objectStore(TRANSCRIPTS_STORE);
  const now = new Date();
  const transcriptId = now.getTime().toString();
  const createdAt = now.toISOString();
  const transcript: TranscriptEntry = {
    transcriptId,
    title: entry.title || now.toLocaleString(),
    text: entry.text,
    createdAt,
    wordCount: entry.wordCount,
    folderId: entry.folderId || null,
  };

  // Add validation before attempting to save
  if (!transcript.transcriptId || typeof transcript.transcriptId !== 'string') {
    const error = new Error('Invalid transcriptId generated.');
    console.error('Validation Error: Invalid transcriptId', transcript.transcriptId, error);
    throw error;
  }
  if (!transcript.text || typeof transcript.text !== 'string' || transcript.text.trim().length === 0) {
    // Although TranscriptPanel checks for empty text, adding a check here for robustness
    const error = new Error('Attempted to save transcript with empty text.');
    console.error('Validation Error: Empty transcript text', transcript.text, error);
    throw error;
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve(transcript);
    };
    tx.onerror = () => {
      console.error('IndexedDB transaction error in saveTranscript:', tx.error);
      db.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      console.error('IndexedDB transaction aborted in saveTranscript:', tx.error);
      db.close();
      reject(tx.error);
    };
    try {
      console.log('Attempting to add transcript:', transcript);
      store.add(transcript);
    } catch (error) {
      console.error('Failed to add to store:', error);
      // This catch might not be hit for DataErrors during 'add', 
      // as they often trigger the transaction's onerror/onabort
      db.close();
      reject(error);
    }
  });
}

export async function getTranscripts(folderId?: string | null): Promise<TranscriptEntry[]> {
  const db = await openDB();
  const tx = db.transaction(TRANSCRIPTS_STORE, 'readonly');
  const store = tx.objectStore(TRANSCRIPTS_STORE);
  const request = store.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close();
      let results = request.result as TranscriptEntry[];
      if (typeof folderId !== 'undefined') {
        results = results.filter(t => (folderId === null ? !t.folderId : t.folderId === folderId));
      }
      // Sort newest first
      resolve(results.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function updateTranscript(transcriptId: string, updates: Partial<Omit<TranscriptEntry, 'transcriptId' | 'createdAt'>>) {
  const db = await openDB();
  const tx = db.transaction(TRANSCRIPTS_STORE, 'readwrite');
  const store = tx.objectStore(TRANSCRIPTS_STORE);
  const existing = await new Promise<TranscriptEntry | undefined>((resolve) => {
    const req = store.get(transcriptId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(undefined);
  });
  if (!existing) {
    db.close();
    throw new Error('Transcript not found');
  }
  const updated: TranscriptEntry = {
    ...existing,
    ...updates,
  };
  store.put(updated);
  await new Promise(resolve => tx.oncomplete = resolve);
  db.close();
  return updated;
}

export async function deleteTranscript(transcriptId: string) {
  const db = await openDB();
  const tx = db.transaction(TRANSCRIPTS_STORE, 'readwrite');
  const store = tx.objectStore(TRANSCRIPTS_STORE);
  store.delete(transcriptId);
  await new Promise(resolve => tx.oncomplete = resolve);
  db.close();
}

export async function mergeTranscripts(ids: string[], mergedTitle?: string, folderId?: string | null) {
  const db = await openDB();
  const tx = db.transaction(TRANSCRIPTS_STORE, 'readwrite');
  const store = tx.objectStore(TRANSCRIPTS_STORE);
  const entries: TranscriptEntry[] = [];
  for (const id of ids) {
    const req = store.get(id);
    await new Promise<void>((resolve) => {
      req.onsuccess = () => {
        if (req.result) entries.push(req.result);
        resolve();
      };
      req.onerror = () => resolve();
    });
  }
  // Sort by createdAt ascending for merge
  entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const mergedText = entries.map(e => e.text).join('\n\n');
  const mergedWordCount = entries.reduce((sum, e) => sum + e.wordCount, 0);
  const now = new Date();
  const merged: TranscriptEntry = {
    transcriptId: now.getTime().toString(),
    title: mergedTitle || `Merged ${now.toLocaleString()}`,
    text: mergedText,
    createdAt: now.toISOString(),
    wordCount: mergedWordCount,
    folderId: folderId || null,
  };
  store.add(merged);
  // Optionally delete originals
  for (const id of ids) {
    store.delete(id);
  }
  await new Promise(resolve => tx.oncomplete = resolve);
  db.close();
  return merged;
}

export function downloadTranscript(entry: TranscriptEntry) {
  const blob = new Blob([entry.text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${entry.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// Folder CRUD
export async function getFolders(): Promise<FolderEntry[]> {
  const db = await openDB();
  const tx = db.transaction(FOLDERS_STORE, 'readonly');
  const store = tx.objectStore(FOLDERS_STORE);
  const request = store.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close();
      // Sort by createdAt ascending
      resolve((request.result as FolderEntry[]).sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function addFolder(folderName: string) {
  const db = await openDB();
  const tx = db.transaction(FOLDERS_STORE, 'readwrite');
  const store = tx.objectStore(FOLDERS_STORE);
  const now = new Date();
  const folder: FolderEntry = {
    folderId: now.getTime().toString(),
    folderName,
    createdAt: now.toISOString(),
  };
  store.add(folder);
  await new Promise(resolve => tx.oncomplete = resolve);
  db.close();
  return folder;
}

export async function updateFolder(folderId: string, updates: Partial<Omit<FolderEntry, 'folderId' | 'createdAt'>>) {
  const db = await openDB();
  const tx = db.transaction(FOLDERS_STORE, 'readwrite');
  const store = tx.objectStore(FOLDERS_STORE);
  const existing = await new Promise<FolderEntry | undefined>((resolve) => {
    const req = store.get(folderId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(undefined);
  });
  if (!existing) {
    db.close();
    throw new Error('Folder not found');
  }
  const updated: FolderEntry = {
    ...existing,
    ...updates,
  };
  store.put(updated);
  await new Promise(resolve => tx.oncomplete = resolve);
  db.close();
  return updated;
}

export async function deleteFolder(folderId: string) {
  const db = await openDB();
  const tx = db.transaction(FOLDERS_STORE, 'readwrite');
  const store = tx.objectStore(FOLDERS_STORE);
  store.delete(folderId);
  await new Promise(resolve => tx.oncomplete = resolve);
  db.close();
} 