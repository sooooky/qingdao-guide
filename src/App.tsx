import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Header } from './components/Header';
import { Navigation, TabKey } from './components/Navigation';
import { ItineraryTab } from './components/ItineraryTab';
import { MapTab } from './components/MapTab';
import { CalculatorTab } from './components/CalculatorTab';
import { SurvivalTab } from './components/SurvivalTab';
import { FoodTab } from './components/FoodTab';
import { ChecklistTab } from './components/ChecklistTab';
import { WishlistTab } from './components/WishlistTab';
import { TaxiTab } from './components/TaxiTab';
import { TaxiModal } from './components/TaxiModal';
import { BackupModal } from './components/BackupModal';
import { AddItemModal } from './components/AddItemModal';
import { AttachmentViewerModal } from './components/AttachmentViewerModal';
import { OfflineVaultModal } from './components/OfflineVaultModal';
import { ShareModal } from './components/ShareModal';

import {
  ScheduleItem,
  ExpenseItem,
  ChecklistItem,
  DayNumber,
  ItemAttachment,
  FoodPlaceItem,
  WishlistItem,
  SurvivalPhrase,
} from './types';
import {
  INITIAL_ITINERARY,
  INITIAL_BACKUP_POOL,
  INITIAL_EXPENSES,
  INITIAL_CHECKLIST,
  INITIAL_FOOD_PLACES,
  INITIAL_WISHLIST_ITEMS,
  SURVIVAL_PHRASES,
} from './data/initialData';
import { timeToMinutes, minutesToTime } from './utils/geo';
import { SharedState, createRoom, generateRandomRoomId, isValidRoomId } from './utils/firebase';
import { useRoomSync, serializeSharedState, describeSyncError } from './hooks/useRoomSync';

const STORAGE_KEYS = {
  ITINERARY: 'qingdao_itinerary_v5',
  BACKUP: 'qingdao_backup_v5',
  EXPENSES: 'qingdao_expenses_v5',
  CHECKLIST: 'qingdao_checklist_v5',
  FOOD_PLACES: 'qingdao_food_places_v5',
  WISHLIST: 'qingdao_wishlist_v5',
  PHRASES: 'qingdao_survival_phrases_v5',
  EXCHANGE_RATE: 'qingdao_rate_v5',
  MEMBERS: 'qingdao_members_v5',
  ROOM_ID: 'qingdao_room_id_v1',
};

const DEFAULT_MEMBERS = ['나', '동행1'];

function setRoomInUrl(roomId: string | null) {
  try {
    const url = new URL(window.location.href);
    if (roomId) url.searchParams.set('room', roomId);
    else url.searchParams.delete('room');
    window.history.replaceState(null, '', url.toString());
  } catch {
    // ignore
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('itinerary');

  // Load from localStorage with defaults
  const [allItinerary, setAllItinerary] = useState<ScheduleItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ITINERARY);
      return saved ? JSON.parse(saved) : INITIAL_ITINERARY;
    } catch {
      return INITIAL_ITINERARY;
    }
  });

  const [backupPool, setBackupPool] = useState<ScheduleItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BACKUP);
      return saved ? JSON.parse(saved) : INITIAL_BACKUP_POOL;
    } catch {
      return INITIAL_BACKUP_POOL;
    }
  });

  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHECKLIST);
      return saved ? JSON.parse(saved) : INITIAL_CHECKLIST;
    } catch {
      return INITIAL_CHECKLIST;
    }
  });

  const [foodPlaces, setFoodPlaces] = useState<FoodPlaceItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FOOD_PLACES);
      return saved ? JSON.parse(saved) : INITIAL_FOOD_PLACES;
    } catch {
      return INITIAL_FOOD_PLACES;
    }
  });

  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WISHLIST);
      return saved ? JSON.parse(saved) : INITIAL_WISHLIST_ITEMS;
    } catch {
      return INITIAL_WISHLIST_ITEMS;
    }
  });

  const [phrases, setPhrases] = useState<SurvivalPhrase[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PHRASES);
      return saved ? JSON.parse(saved) : SURVIVAL_PHRASES;
    } catch {
      return SURVIVAL_PHRASES;
    }
  });

  const [exchangeRate, setExchangeRate] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXCHANGE_RATE);
      return saved ? Number(saved) : 190;
    } catch {
      return 190;
    }
  });

  const [members, setMembers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      return saved ? JSON.parse(saved) : DEFAULT_MEMBERS;
    } catch {
      return DEFAULT_MEMBERS;
    }
  });

  // Real-time room (Firestore). null = personal mode, data stays on this device only.
  const [roomId, setRoomId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROOM_ID);
      return isValidRoomId(saved) ? saved : null;
    } catch {
      return null;
    }
  });
  const [syncError, setSyncError] = useState<string | null>(null);

  // Modals & Navigation state
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [addItemDay, setAddItemDay] = useState<DayNumber>(1);
  const [taxiModalData, setTaxiModalData] = useState<{
    title: string;
    cnText: string;
    pinyin?: string;
    krDesc?: string;
    addressCn?: string;
  } | null>(null);
  const [viewerData, setViewerData] = useState<{
    attachment: ItemAttachment;
    scheduleTitle: string;
    onDelete?: (id: string) => void;
  } | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ITINERARY, JSON.stringify(allItinerary));
    } catch (e) {
      console.error(e);
    }
  }, [allItinerary]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify(backupPool));
    } catch (e) {
      console.error(e);
    }
  }, [backupPool]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    } catch (e) {
      console.error(e);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(checklist));
    } catch (e) {
      console.error(e);
    }
  }, [checklist]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FOOD_PLACES, JSON.stringify(foodPlaces));
    } catch (e) {
      console.error(e);
    }
  }, [foodPlaces]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PHRASES, JSON.stringify(phrases));
    } catch (e) {
      console.error(e);
    }
  }, [phrases]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXCHANGE_RATE, String(exchangeRate));
    } catch (e) {
      console.error(e);
    }
  }, [exchangeRate]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    } catch (e) {
      console.error(e);
    }
  }, [members]);

  useEffect(() => {
    try {
      if (roomId) localStorage.setItem(STORAGE_KEYS.ROOM_ID, roomId);
      else localStorage.removeItem(STORAGE_KEYS.ROOM_ID);
    } catch (e) {
      console.error(e);
    }
  }, [roomId]);

  const sharedState: SharedState = {
    allItinerary,
    backupPool,
    expenses,
    foodPlaces,
    wishlist,
    members,
    exchangeRate,
  };

  const { status: syncStatus, clientId } = useRoomSync({
    roomId,
    state: sharedState,
    onRemoteChange: (next) => {
      if (next.allItinerary) setAllItinerary(next.allItinerary);
      if (next.backupPool) setBackupPool(next.backupPool);
      if (next.expenses) setExpenses(next.expenses);
      if (next.foodPlaces) setFoodPlaces(next.foodPlaces);
      if (next.wishlist) setWishlist(next.wishlist);
      if (next.members) setMembers(next.members);
      if (next.exchangeRate !== undefined) setExchangeRate(next.exchangeRate);
    },
    onRoomMissing: () => {
      setRoomId(null);
      setRoomInUrl(null);
      showToast('공유 방을 찾을 수 없습니다. 링크를 다시 확인해주세요.');
    },
    onError: (message) => setSyncError(message),
  });

  // Joining via ?room= link: confirm, then the room's data overwrites local shared data.
  useEffect(() => {
    const urlRoom = new URLSearchParams(window.location.search).get('room');
    if (!urlRoom) return;
    if (!isValidRoomId(urlRoom)) {
      setRoomInUrl(null);
      return;
    }
    if (urlRoom === roomId) return;
    const ok = window.confirm(
      `공유 방(${urlRoom})에 참여할까요?\n\n일정·경비·환율·맛집·위시리스트가 방의 데이터로 바뀝니다. ` +
        `(체크리스트·회화·첨부 사진은 유지됩니다)\n기존 데이터가 필요하면 '취소' 후 백업을 먼저 받아두세요.`
    );
    if (ok) {
      setSyncError(null);
      setRoomId(urlRoom);
    } else {
      setRoomInUrl(roomId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateRoom = () => {
    const newRoomId = generateRandomRoomId();
    setSyncError(null);
    createRoom(newRoomId, serializeSharedState(sharedState), clientId).catch((err) => {
      setSyncError(describeSyncError(err));
      setRoomId((curr) => (curr === newRoomId ? null : curr));
      setRoomInUrl(null);
    });
    setRoomId(newRoomId);
    setRoomInUrl(newRoomId);
    showToast('실시간 공유 방이 만들어졌습니다. 링크를 동행에게 보내주세요!');
  };

  const handleLeaveRoom = () => {
    setRoomId(null);
    setSyncError(null);
    setRoomInUrl(null);
    showToast('공유 방에서 나왔습니다. 현재 데이터는 이 기기에 남아 있습니다.');
  };

  // Reset to original data
  const handleResetData = () => {
    const message = roomId
      ? '모든 변경사항과 지출 내역을 초기화하시겠습니까?\n공유 방에 참여 중이라 동행 모두의 일정·경비도 초기화됩니다.'
      : '모든 변경사항과 지출 내역을 초기화하시겠습니까?';
    if (window.confirm(message)) {
      localStorage.removeItem(STORAGE_KEYS.ITINERARY);
      localStorage.removeItem(STORAGE_KEYS.BACKUP);
      localStorage.removeItem(STORAGE_KEYS.EXPENSES);
      localStorage.removeItem(STORAGE_KEYS.CHECKLIST);
      localStorage.removeItem(STORAGE_KEYS.FOOD_PLACES);
      localStorage.removeItem(STORAGE_KEYS.WISHLIST);
      localStorage.removeItem(STORAGE_KEYS.PHRASES);
      localStorage.removeItem(STORAGE_KEYS.EXCHANGE_RATE);
      localStorage.removeItem(STORAGE_KEYS.MEMBERS);
      setAllItinerary(INITIAL_ITINERARY);
      setBackupPool(INITIAL_BACKUP_POOL);
      setExpenses(INITIAL_EXPENSES);
      setChecklist(INITIAL_CHECKLIST);
      setFoodPlaces(INITIAL_FOOD_PLACES);
      setWishlist(INITIAL_WISHLIST_ITEMS);
      setPhrases(SURVIVAL_PHRASES);
      setExchangeRate(190);
      setMembers(DEFAULT_MEMBERS);
      showToast('초기 데이터로 재설정되었습니다.');
    }
  };

  // Import backup data
  const handleImportBackup = (imported: any) => {
    if (imported.allItinerary) setAllItinerary(imported.allItinerary);
    if (imported.backupPool) setBackupPool(imported.backupPool);
    if (imported.expenses) setExpenses(imported.expenses);
    if (imported.checklist) setChecklist(imported.checklist);
    if (imported.foodPlaces) setFoodPlaces(imported.foodPlaces);
    if (imported.wishlist) setWishlist(imported.wishlist);
    if (imported.phrases) setPhrases(imported.phrases);
    if (imported.exchangeRate) setExchangeRate(imported.exchangeRate);
    if (Array.isArray(imported.members) && imported.members.length > 0) setMembers(imported.members);
  };

  // Total attachments across all items for header counter
  const totalVaultCount = allItinerary.reduce(
    (acc, item) => acc + (item.attachments?.length || 0),
    0
  );

  const handleAddAttachmentToItem = (itemId: string, attachment: ItemAttachment) => {
    setAllItinerary((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, attachments: [...(item.attachments || []), attachment] }
          : item
      )
    );
  };

  // One-click add food place to day schedule
  const handleAddFoodPlaceToItinerary = (place: FoodPlaceItem, day: DayNumber) => {
    const dayItems = allItinerary.filter((i) => i.day === day);
    const lastItem = dayItems[dayItems.length - 1];
    let startTime = '18:00';
    if (lastItem) {
      const lastEnd =
        timeToMinutes(lastItem.startTime) +
        (lastItem.durationMinutes || 60) +
        (lastItem.transitMinutes || 20);
      startTime = minutesToTime(lastEnd);
    }

    const newItem: ScheduleItem = {
      id: `sched-food-${Date.now()}`,
      day,
      startTime,
      durationMinutes: 90,
      transitMinutes: 20,
      title: place.name,
      titleCn: place.nameCn,
      pinyin: place.pinyin || '',
      category: 'food',
      desc: `${place.recommendedDish} (${place.priceRange})`,
      estimatedCostCny: 80,
      completed: false,
      addressCn: place.addressCn || place.nameCn,
      tips: place.notes || '추천 메뉴 맛보기',
      badges: {
        beerSpecial: place.category === '생맥주펍' || place.category === '야시장',
        cilantroWarning: true,
        alipayRequired: true,
      },
      lat: 36.0671,
      lng: 120.3826,
    };

    setAllItinerary((prev) => [...prev, newItem]);
    showToast(`"${place.name}"이(가) Day ${day} 일정표에 등록되었습니다!`);
  };

  // One-click add wishlist item to day schedule
  const handleAddWishlistToItinerary = (wishItem: WishlistItem, day: DayNumber) => {
    const dayItems = allItinerary.filter((i) => i.day === day);
    const lastItem = dayItems[dayItems.length - 1];
    let startTime = '15:00';
    if (lastItem) {
      const lastEnd =
        timeToMinutes(lastItem.startTime) +
        (lastItem.durationMinutes || 60) +
        (lastItem.transitMinutes || 20);
      startTime = minutesToTime(lastEnd);
    }

    const newItem: ScheduleItem = {
      id: `sched-wish-${Date.now()}`,
      day,
      startTime,
      durationMinutes: wishItem.timeNeededMinutes || 60,
      transitMinutes: 20,
      title: wishItem.title,
      titleCn: wishItem.titleCn,
      pinyin: wishItem.pinyin || '',
      category: wishItem.category === '야경/바' ? 'food' : 'attraction',
      desc: wishItem.desc,
      estimatedCostCny: 15,
      completed: false,
      addressCn: wishItem.addressCn,
      tips: wishItem.whyVisit,
      badges: {
        walkingLevel: 'moderate',
        alipayRequired: true,
      },
      lat: wishItem.lat || 36.0671,
      lng: wishItem.lng || 120.3826,
    };

    setAllItinerary((prev) => [...prev, newItem]);
    showToast(`"${wishItem.title}"이(가) Day ${day} 일정표에 등록되었습니다!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-14 select-none">
      {/* Top Header */}
      <Header
        onOpenNav={() => setIsNavOpen(true)}
        currentTab={activeTab}
        onOpenShare={() => setIsShareOpen(true)}
        syncStatus={syncStatus}
        roomId={roomId || undefined}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenVault={() => setIsVaultOpen(true)}
        vaultCount={totalVaultCount}
        onReset={handleResetData}
        exchangeRate={exchangeRate}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-xl w-full mx-auto p-3.5 sm:p-4 space-y-4">
        {activeTab === 'itinerary' && (
          <ItineraryTab
            allItinerary={allItinerary}
            backupPool={backupPool}
            exchangeRate={exchangeRate}
            onUpdateItinerary={setAllItinerary}
            onUpdateBackupPool={setBackupPool}
            onOpenTaxiModal={(data) => setTaxiModalData(data)}
            onOpenAttachmentViewer={(attachment, scheduleTitle, onDelete) =>
              setViewerData({ attachment, scheduleTitle, onDelete })
            }
            onOpenAddItem={(day) => {
              setAddItemDay(day);
              setIsAddItemOpen(true);
            }}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'map' && (
          <MapTab
            allItinerary={allItinerary}
            onOpenTaxiModal={(data) => setTaxiModalData(data)}
          />
        )}

        {activeTab === 'wishlist' && (
          <WishlistTab
            wishlist={wishlist}
            onUpdateWishlist={setWishlist}
            onAddToItinerary={handleAddWishlistToItinerary}
            onOpenTaxiModal={(data) => setTaxiModalData(data)}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'food' && (
          <FoodTab
            foodPlaces={foodPlaces}
            onUpdateFoodPlaces={setFoodPlaces}
            onAddToItinerary={handleAddFoodPlaceToItinerary}
            onOpenTaxiModal={(data) => setTaxiModalData(data)}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'calc' && (
          <CalculatorTab
            exchangeRate={exchangeRate}
            onUpdateExchangeRate={setExchangeRate}
            expenses={expenses}
            onUpdateExpenses={setExpenses}
            members={members}
            onUpdateMembers={setMembers}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'taxi' && (
          <TaxiTab
            onOpenTaxiModal={(data) => setTaxiModalData(data)}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'survival' && (
          <SurvivalTab
            phrases={phrases}
            onUpdatePhrases={setPhrases}
            onOpenTaxiModal={(data) => setTaxiModalData(data)}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'checklist' && (
          <ChecklistTab
            checklist={checklist}
            onUpdateChecklist={setChecklist}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Left Navigation Sidebar / Drawer */}
      <Navigation
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        exchangeRate={exchangeRate}
        vaultCount={totalVaultCount}
        onOpenVault={() => setIsVaultOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      {/* Floating Left Menu trigger button for easy thumb reach on mobile */}
      <button
        onClick={() => setIsNavOpen(true)}
        className="fixed bottom-6 left-4 z-30 py-2.5 px-3.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black rounded-full shadow-2xl flex items-center gap-1.5 transition border-2 border-slate-900"
        title="메뉴 열기"
        aria-label="왼쪽 메뉴 열기"
      >
        <Menu className="w-4 h-4 text-slate-950" />
        <span className="text-xs">메뉴</span>
      </button>

      {/* Offline Fullscreen Attachment Lightbox Modal */}
      <AttachmentViewerModal
        isOpen={Boolean(viewerData)}
        onClose={() => setViewerData(null)}
        attachment={viewerData?.attachment || null}
        scheduleTitle={viewerData?.scheduleTitle}
        onDelete={viewerData?.onDelete}
        onShowToast={showToast}
      />

      {/* Central Offline Vault Modal */}
      <OfflineVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        allItinerary={allItinerary}
        onAddAttachmentToItem={handleAddAttachmentToItem}
        onOpenViewer={(att, title) => setViewerData({ attachment: att, scheduleTitle: title })}
        onShowToast={showToast}
      />

      {/* Taxi Fullscreen Card Modal */}
      <TaxiModal
        isOpen={Boolean(taxiModalData)}
        onClose={() => setTaxiModalData(null)}
        data={taxiModalData}
        onShowToast={showToast}
      />

      {/* Real-time Room Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        roomId={roomId || ''}
        allItinerary={allItinerary}
        exchangeRate={exchangeRate}
        syncStatus={syncStatus}
        syncError={syncError}
        onCreateNewRoom={handleCreateRoom}
        onLeaveRoom={handleLeaveRoom}
        onShowToast={showToast}
      />

      {/* Backup & Share Modal */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        data={{
          allItinerary,
          backupPool,
          expenses,
          checklist,
          foodPlaces,
          wishlist,
          phrases,
          exchangeRate,
          members,
        }}
        onImport={handleImportBackup}
        onShowToast={showToast}
      />

      {/* Add Custom Schedule Item Modal */}
      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        defaultDay={addItemDay}
        onAdd={(item) => setAllItinerary([...allItinerary, item])}
        onShowToast={showToast}
      />

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 px-4 py-2 rounded-full font-bold text-xs shadow-2xl flex items-center space-x-1.5 animate-in fade-in zoom-in-90 duration-200">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
