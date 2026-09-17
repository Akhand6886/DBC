import { FileNode } from './types';
import { DbConnection } from '../components/dbms/DbConnectionPanel';

const STORAGE_KEY = 'dbc_workspace_state_v1';

export interface PersistedWorkspaceData {
  files: FileNode[];
  activeFileId: string | null;
  openFileIds: string[];
  connections: DbConnection[];
  activeConnectionId: string;
  lastSavedTimestamp: number;
}

/**
 * Safely saves the current workspace state to local storage.
 */
export function savePersistedWorkspace(data: {
  files: FileNode[];
  activeFileId: string | null;
  openFileIds: string[];
  connections: DbConnection[];
  activeConnectionId: string;
}): void {
  if (typeof window === 'undefined') return;

  try {
    const payload: PersistedWorkspaceData = {
      ...data,
      lastSavedTimestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[WorkspacePersistence]: Failed to save state to localStorage:', err);
  }
}

/**
 * Safely retrieves previously persisted workspace state from local storage.
 * Returns null if not found or corrupted.
 */
export function loadPersistedWorkspace(): PersistedWorkspaceData | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PersistedWorkspaceData;
    if (parsed && Array.isArray(parsed.files) && parsed.files.length > 0) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn('[WorkspacePersistence]: Failed to load state, falling back to defaults:', err);
    return null;
  }
}

/**
 * Clears the persisted workspace cache.
 */
export function clearPersistedWorkspace(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[WorkspacePersistence]: Failed to clear localStorage:', err);
  }
}

/**
 * Recursively searches a FileNode tree for a node matching the given ID.
 */
export function findFileNodeById(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children && node.children.length > 0) {
      const found = findFileNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Recursively flattens all non-folder files from a FileNode tree.
 */
export function flattenFileNodes(nodes: FileNode[]): FileNode[] {
  let result: FileNode[] = [];
  for (const node of nodes) {
    if (!node.isFolder) {
      result.push(node);
    }
    if (node.children && node.children.length > 0) {
      result = result.concat(flattenFileNodes(node.children));
    }
  }
  return result;
}

const DRAFTS_STORAGE_KEY = 'dbc_active_drafts_v1';

export interface PersistedDraft {
  filePath: string;
  content: string;
  timestamp: number;
}

/**
 * ED-01: Saves an uncommitted editor buffer draft to localStorage.
 */
export function saveDraftBuffer(filePath: string, content: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(DRAFTS_STORAGE_KEY);
    const drafts: Record<string, PersistedDraft> = raw ? JSON.parse(raw) : {};
    drafts[filePath] = {
      filePath,
      content,
      timestamp: Date.now()
    };
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
  } catch (err) {
    console.warn('[WorkspacePersistence]: Failed to save draft buffer:', err);
  }
}

/**
 * ED-01: Loads an uncommitted editor buffer draft from localStorage.
 */
export function loadDraftBuffer(filePath: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (!raw) return null;
    const drafts: Record<string, PersistedDraft> = JSON.parse(raw);
    return drafts[filePath]?.content ?? null;
  } catch {
    return null;
  }
}

/**
 * ED-01: Clears a draft buffer once a file has been explicitly saved.
 */
export function clearDraftBuffer(filePath: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (!raw) return;
    const drafts: Record<string, PersistedDraft> = JSON.parse(raw);
    delete drafts[filePath];
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
  } catch {}
}

/**
 * ED-01: Retrieves all uncommitted drafts.
 */
export function getAllDraftBuffers(): Record<string, PersistedDraft> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(DRAFTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * ED-01: Clears all drafts.
 */
export function clearAllDraftBuffers(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DRAFTS_STORAGE_KEY);
  } catch {}
}

