import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  ScheduleItem,
  ExpenseItem,
  ChecklistItem,
  FoodPlaceItem,
  WishlistItem,
  SurvivalPhrase,
} from '../types';

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
export const db = getFirestore(app);
export const auth = getAuth(app);

// Authenticate anonymously so Firestore security rules requiring auth will succeed
let authPromise: Promise<any> | null = null;
export async function ensureAuth() {
  if (!authPromise) {
    authPromise = signInAnonymously(auth).catch((err) => {
      console.warn('Firebase anonymous auth warning:', err);
    });
  }
  return authPromise;
}

// Ensure auth on load
ensureAuth();

export interface RoomData {
  allItinerary?: ScheduleItem[];
  backupPool?: ScheduleItem[];
  expenses?: ExpenseItem[];
  checklist?: ChecklistItem[];
  foodPlaces?: FoodPlaceItem[];
  wishlist?: WishlistItem[];
  phrases?: SurvivalPhrase[];
  exchangeRate?: number;
  updatedAt?: number;
  lastUpdatedBy?: string;
}

// Generate random friendly room ID using Math.random().toString(36).substring(2, 9)
export function generateRandomRoomId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Get room reference from 'rooms' collection
export function getRoomDocRef(roomId: string) {
  return doc(db, 'rooms', roomId);
}

// Subscribe to room updates with onSnapshot
export function subscribeToRoom(
  roomId: string,
  onData: (data: RoomData) => void,
  onError?: (err: any) => void
) {
  ensureAuth();
  const roomRef = getRoomDocRef(roomId);
  return onSnapshot(
    roomRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as RoomData);
      }
    },
    (err) => {
      console.warn('Firestore onSnapshot listener error:', err);
      if (onError) onError(err);
    }
  );
}

// Save room data to Firestore
export async function saveRoomData(roomId: string, data: Partial<RoomData>, clientId: string) {
  try {
    await ensureAuth();
    const roomRef = getRoomDocRef(roomId);
    await setDoc(
      roomRef,
      {
        ...data,
        updatedAt: Date.now(),
        lastUpdatedBy: clientId,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Failed to sync data to Firestore:', err);
    throw err;
  }
}


