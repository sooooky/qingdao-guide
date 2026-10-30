import { useEffect, useRef, useState } from 'react';
import {
  SharedState,
  RoomData,
  RoomChange,
  StoredItem,
  StoredList,
  ListKey,
  ValueKey,
  LIST_KEYS,
  VALUE_KEYS,
  subscribeToRoom,
  applyRoomChanges,
} from '../utils/firebase';

export type SyncStatus = 'off' | 'connecting' | 'live' | 'offline' | 'error';

// JSON with sorted keys, so items compare equal regardless of Firestore's key order.
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

// Attachments are base64 images and stay on the device (Firestore docs are capped at 1MB).
function toStoredList(items: { id: string }[]): StoredList {
  const out: StoredList = {};
  items.forEach((item, index) => {
    const { attachments: _attachments, ...rest } = item as { id: string; attachments?: unknown };
    out[item.id] = { ...rest, _order: index };
  });
  return out;
}

function fromStoredList<T extends { id: string }>(stored: StoredList, localItems: T[]): T[] {
  const localById = new Map(localItems.map((item) => [item.id, item as T & { attachments?: unknown }]));
  return Object.entries(stored)
    .sort(([idA, a], [idB, b]) => a._order - b._order || idA.localeCompare(idB))
    .map(([id, { _order: _o, ...rest }]) => {
      const attachments = localById.get(id)?.attachments;
      return (attachments ? { ...rest, id, attachments } : { ...rest, id }) as unknown as T;
    });
}

export function serializeSharedState(state: SharedState): RoomData {
  return {
    allItinerary: toStoredList(state.allItinerary),
    backupPool: toStoredList(state.backupPool),
    expenses: toStoredList(state.expenses),
    foodPlaces: toStoredList(state.foodPlaces),
    wishlist: toStoredList(state.wishlist),
    members: state.members,
    exchangeRate: state.exchangeRate,
  };
}

// Last state known to match the server: per list item JSON, per value JSON.
interface Base {
  lists: Record<ListKey, Record<string, string>>;
  values: Record<ValueKey, string>;
}

function jsonOfList(list: StoredList | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [id, item] of Object.entries(list || {})) out[id] = stableStringify(item);
  return out;
}

function baseFromRoom(data: RoomData): Base {
  const lists = {} as Base['lists'];
  for (const key of LIST_KEYS) lists[key] = jsonOfList(data[key]);
  const values = {} as Base['values'];
  for (const key of VALUE_KEYS) values[key] = stableStringify(data[key]);
  return { lists, values };
}

export function describeSyncError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  if (
    code === 'auth/operation-not-allowed' ||
    code === 'auth/admin-restricted-operation' ||
    code === 'auth/configuration-not-found'
  ) {
    return 'Firebase 익명 로그인이 꺼져 있습니다. Firebase 콘솔에서 익명 로그인을 켜주세요.';
  }
  if (code === 'permission-denied') {
    return 'Firestore 보안 규칙이 접근을 막았습니다. firestore.rules를 콘솔에 게시해주세요.';
  }
  if (code === 'auth/network-request-failed' || code === 'unavailable') {
    return '서버에 연결할 수 없습니다. 인터넷(로밍) 연결을 확인해주세요.';
  }
  return `실시간 동기화 오류${code ? ` (${code})` : ''}`;
}

interface UseRoomSyncOptions {
  roomId: string | null;
  state: SharedState;
  onRemoteChange: (next: Partial<SharedState>) => void;
  onRoomMissing: () => void;
  onError: (message: string) => void;
}

const FLUSH_DELAY_MS = 800;

export function useRoomSync({ roomId, state, onRemoteChange, onRoomMissing, onError }: UseRoomSyncOptions) {
  const [status, setStatus] = useState<SyncStatus>('off');
  const [clientId] = useState(() => Math.random().toString(36).slice(2, 10));

  const stateRef = useRef(state);
  stateRef.current = state;
  const callbacksRef = useRef({ onRemoteChange, onRoomMissing, onError });
  callbacksRef.current = { onRemoteChange, onRoomMissing, onError };

  const baseRef = useRef<Base | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = (targetRoomId: string) => {
    const base = baseRef.current;
    if (!base) return;
    const local = serializeSharedState(stateRef.current);
    const changes: RoomChange[] = [];

    for (const key of LIST_KEYS) {
      const localJson = jsonOfList(local[key]);
      for (const [id, json] of Object.entries(localJson)) {
        if (base.lists[key][id] !== json) changes.push({ key, id, value: local[key]![id] });
      }
      for (const id of Object.keys(base.lists[key])) {
        if (!(id in localJson)) changes.push({ key, id, value: null });
      }
      base.lists[key] = localJson;
    }
    for (const key of VALUE_KEYS) {
      const json = stableStringify(local[key]);
      if (base.values[key] !== json) changes.push({ key, value: local[key] });
      base.values[key] = json;
    }

    applyRoomChanges(targetRoomId, changes, clientId).catch((err) => {
      setStatus('error');
      callbacksRef.current.onError(describeSyncError(err));
    });
  };

  // Subscribe to the room; the first snapshot replaces local shared data (join = overwrite).
  useEffect(() => {
    baseRef.current = null;
    if (!roomId) {
      setStatus('off');
      return;
    }
    setStatus('connecting');

    const unsubscribe = subscribeToRoom(
      roomId,
      (snap) => {
        if (!snap.exists) {
          if (!snap.fromCache && !snap.hasPendingWrites) callbacksRef.current.onRoomMissing();
          return;
        }
        setStatus(snap.fromCache ? 'offline' : 'live');

        const remote = snap.data;
        const current = stateRef.current;
        const prevBase = baseRef.current;
        const local = serializeSharedState(current);
        const next: Partial<SharedState> = {};
        let hasPending = false;

        for (const key of LIST_KEYS) {
          const merged: StoredList = { ...(remote[key] || {}) };
          if (prevBase) {
            // Keep local edits that have not been sent yet on top of the remote data.
            const localList = local[key] || {};
            const ids = new Set([...Object.keys(localList), ...Object.keys(prevBase.lists[key])]);
            for (const id of ids) {
              const localJson = localList[id] ? stableStringify(localList[id]) : undefined;
              if (localJson === prevBase.lists[key][id]) continue;
              hasPending = true;
              if (localList[id]) merged[id] = localList[id] as StoredItem;
              else delete merged[id];
            }
          }
          if (stableStringify(merged) !== stableStringify(local[key])) {
            (next as Record<ListKey, unknown>)[key] = fromStoredList(merged, current[key] as { id: string }[]);
          }
        }
        for (const key of VALUE_KEYS) {
          let value = remote[key] ?? current[key];
          if (prevBase && stableStringify(local[key]) !== prevBase.values[key]) {
            hasPending = true;
            value = current[key];
          }
          if (stableStringify(value) !== stableStringify(current[key])) {
            (next as Record<ValueKey, unknown>)[key] = value;
          }
        }

        baseRef.current = baseFromRoom(remote);
        if (Object.keys(next).length > 0) {
          // Update the ref now so a flush firing before React re-renders can't revert remote edits.
          stateRef.current = { ...current, ...next };
          callbacksRef.current.onRemoteChange(next);
        }
        if (hasPending) {
          if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
          flushTimerRef.current = setTimeout(() => flush(roomId), FLUSH_DELAY_MS);
        }
      },
      (err) => {
        setStatus('error');
        callbacksRef.current.onError(describeSyncError(err));
      }
    );

    return () => {
      unsubscribe();
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
      baseRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Push local edits (debounced) once the room's first snapshot has been applied.
  useEffect(() => {
    if (!roomId || !baseRef.current) return;
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(() => flush(roomId), FLUSH_DELAY_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    roomId,
    state.allItinerary,
    state.backupPool,
    state.expenses,
    state.foodPlaces,
    state.wishlist,
    state.members,
    state.exchangeRate,
  ]);

  return { status, clientId };
}
