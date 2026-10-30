import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  Firestore,
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteField,
  FieldPath,
  FirestoreError,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { getAuth, signInAnonymously, connectAuthEmulator } from 'firebase/auth';
import { ScheduleItem, ExpenseItem, FoodPlaceItem, WishlistItem } from '../types';

export const firebaseConfig = {
  apiKey: 'AIzaSyBM0C48ONvZy6tJMhBAbUMTvLK8bveigZI',
  authDomain: 'qingdao-guide.firebaseapp.com',
  projectId: 'qingdao-guide',
  storageBucket: 'qingdao-guide.firebasestorage.app',
  messagingSenderId: '876067930472',
  appId: '1:876067930472:web:b47fe592c56c346b0f96dd',
};

// Initialize or reuse Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Offline cache keeps the room readable and queues writes while the network is down
// (Google services are often unreachable from mainland China networks).
function createDb(): Firestore {
  try {
    return initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    return getFirestore(app);
  }
}

export const db = createDb();
export const auth = getAuth(app);

// Local testing: `VITE_FIREBASE_EMULATOR=1 npm run dev` with `firebase emulators:start --only auth,firestore`.
if (import.meta.env.VITE_FIREBASE_EMULATOR) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}

// Authenticate anonymously so Firestore security rules requiring auth will succeed.
// Called lazily: nothing talks to Firebase until the user is in a room.
let authPromise: Promise<unknown> | null = null;
export function ensureAuth() {
  if (!authPromise) {
    authPromise = signInAnonymously(auth).catch((err) => {
      authPromise = null;
      throw err;
    });
  }
  return authPromise;
}

// Fields shared through a room. Checklist, phrases and attachments stay on each device.
export interface SharedState {
  allItinerary: ScheduleItem[];
  backupPool: ScheduleItem[];
  expenses: ExpenseItem[];
  foodPlaces: FoodPlaceItem[];
  wishlist: WishlistItem[];
  members: string[];
  exchangeRate: number;
}

export const LIST_KEYS = ['allItinerary', 'backupPool', 'expenses', 'foodPlaces', 'wishlist'] as const;
export const VALUE_KEYS = ['members', 'exchangeRate'] as const;
export type ListKey = (typeof LIST_KEYS)[number];
export type ValueKey = (typeof VALUE_KEYS)[number];

// Lists are stored as { [itemId]: item & { _order } } so that concurrent edits to
// different items merge instead of overwriting each other.
export type StoredItem = Record<string, unknown> & { _order: number };
export type StoredList = Record<string, StoredItem>;

export interface RoomData {
  allItinerary?: StoredList;
  backupPool?: StoredList;
  expenses?: StoredList;
  foodPlaces?: StoredList;
  wishlist?: StoredList;
  members?: string[];
  exchangeRate?: number;
  createdAt?: number;
  updatedAt?: number;
  lastUpdatedBy?: string;
}

const ROOM_ID_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
export const ROOM_ID_LENGTH = 10;

export function generateRandomRoomId(): string {
  const bytes = new Uint8Array(ROOM_ID_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ROOM_ID_ALPHABET[b % ROOM_ID_ALPHABET.length]).join('');
}

export function isValidRoomId(roomId: string | null | undefined): roomId is string {
  return !!roomId && /^[a-z0-9]{10,32}$/.test(roomId);
}

export function getRoomDocRef(roomId: string) {
  return doc(db, 'rooms', roomId);
}

export interface RoomSnapshot {
  exists: boolean;
  fromCache: boolean;
  hasPendingWrites: boolean;
  data: RoomData;
}

export function subscribeToRoom(
  roomId: string,
  onData: (snap: RoomSnapshot) => void,
  onError: (err: FirestoreError | Error) => void
): () => void {
  let unsubscribe: (() => void) | null = null;
  let cancelled = false;

  ensureAuth()
    .then(() => {
      if (cancelled) return;
      unsubscribe = onSnapshot(
        getRoomDocRef(roomId),
        { includeMetadataChanges: true },
        (snapshot) =>
          onData({
            exists: snapshot.exists(),
            fromCache: snapshot.metadata.fromCache,
            hasPendingWrites: snapshot.metadata.hasPendingWrites,
            data: (snapshot.data() as RoomData) || {},
          }),
        onError
      );
    })
    .catch(onError);

  return () => {
    cancelled = true;
    if (unsubscribe) unsubscribe();
  };
}

export async function createRoom(roomId: string, data: RoomData, clientId: string) {
  await ensureAuth();
  const now = Date.now();
  await setDoc(getRoomDocRef(roomId), { ...data, createdAt: now, updatedAt: now, lastUpdatedBy: clientId });
}

// One field-level change: a whole list item, a deleted list item, or a top-level value.
export type RoomChange =
  | { key: ListKey; id: string; value: StoredItem | null }
  | { key: ValueKey; value: unknown };

// Field paths replace the item as a whole (unlike setDoc merge, which deep-merges and
// would keep fields that were removed locally).
export async function applyRoomChanges(roomId: string, changes: RoomChange[], clientId: string) {
  if (changes.length === 0) return;
  await ensureAuth();
  const pairs: unknown[] = [];
  for (const change of changes) {
    const path = 'id' in change ? new FieldPath(change.key, change.id) : new FieldPath(change.key);
    pairs.push(path, change.value === null ? deleteField() : change.value);
  }
  pairs.push(new FieldPath('updatedAt'), Date.now(), new FieldPath('lastUpdatedBy'), clientId);
  const [firstPath, firstValue, ...rest] = pairs;
  await updateDoc(getRoomDocRef(roomId), firstPath as FieldPath, firstValue, ...rest);
}
