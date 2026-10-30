import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
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

// Generate random friendly room ID like "qd-7k9x2m"
export function generateRandomRoomId(): string {
  const chars = '23456789abcdefghjkmnpqrstuvwxyz';
  let result = 'qd-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Get room reference
export function getRoomDocRef(roomId: string) {
  return doc(db, 'travel_rooms', roomId);
}

// Subscribe to room updates with onSnapshot
export function subscribeToRoom(
  roomId: string,
  onData: (data: RoomData) => void,
  onError?: (err: any) => void
) {
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
    console.error('Failed to sync data to Firestore:', err);
    throw err;
  }
}
