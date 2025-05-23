// Transcript IndexedDB utility for Listenify

const DB_NAME = 'listenify-transcripts';
const STORE_NAME = 'transcripts';
const DB_VERSION = 1;

export interface TranscriptEntry {
  id: string;
  title: string;
  text: string;
  createdAt: string;
  wordCount: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveTranscript(entry: Omit<TranscriptEntry, 'id' | 'createdAt'>) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const now = new Date();
  const id = now.getTime().toString();
  const createdAt = now.toISOString();
  const transcript: TranscriptEntry = {
    id,
    title: entry.title || now.toLocaleString(),
    text: entry.text,
    createdAt,
    wordCount: entry.wordCount,
  };
  store.add(transcript);
  await tx.complete;
  db.close();
  return transcript;
}

export async function getTranscripts(): Promise<TranscriptEntry[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const request = store.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close();
      // Sort newest first
      resolve((request.result as TranscriptEntry[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function updateTranscript(id: string, updates: Partial<Omit<TranscriptEntry, 'id' | 'createdAt'>>) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const existing = await new Promise<TranscriptEntry | undefined>((resolve) => {
    const req = store.get(id);
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
  await tx.complete;
  db.close();
  return updated;
}

export async function deleteTranscript(id: string) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.delete(id);
  await tx.complete;
  db.close();
}

export async function mergeTranscripts(ids: string[], mergedTitle?: string) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
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
    id: now.getTime().toString(),
    title: mergedTitle || `Merged ${now.toLocaleString()}`,
    text: mergedText,
    createdAt: now.toISOString(),
    wordCount: mergedWordCount,
  };
  store.add(merged);
  // Optionally delete originals
  for (const id of ids) {
    store.delete(id);
  }
  await tx.complete;
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