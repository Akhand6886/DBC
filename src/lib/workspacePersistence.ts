import { FileNode } from './types';
import { DbConnection } from '../components/DbConnectionPanel';

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
