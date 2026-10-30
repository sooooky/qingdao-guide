export type DayNumber = 1 | 2 | 3;

export interface ItemAttachment {
  id: string;
  name: string;
  dataUrl: string; // Base64 image data for instant offline access
  size?: number;
  type?: string;
  createdAt: string;
}

export interface ScheduleItem {
  id: string;
  day: DayNumber;
  startTime: string; // 'HH:MM'
  durationMinutes: number;
  transitMinutes: number;
  title: string;
  titleCn: string;
  pinyin: string;
  category: 'transport' | 'hotel' | 'attraction' | 'food' | 'shopping';
  desc: string;
  estimatedCostCny: number;
  completed: boolean;
  addressCn: string;
  tips: string;
  personalNotes?: string; // 오프라인 메모 (예약번호, 룸타입, 좌석, 와이파이 비번 등)
  attachments?: ItemAttachment[]; // 오프라인 캡쳐 사진/바우처/티켓 QR
  badges: {
    alipayRequired?: boolean;
    walkingLevel?: 'easy' | 'moderate' | 'high';
    cilantroWarning?: boolean;
    beerSpecial?: boolean;
  };
  lat: number;
  lng: number;
}

export interface TaxiCard {
  id: string;
  title: string;
  cn: string;
  pinyin: string;
  kr: string;
  tag: string;
  addressCn?: string;
  notes?: string;
}

export interface SurvivalPhrase {
  id: string;
  kr: string;
  cn: string;
  pinyin: string;
  en?: string; // 영어 번역
  audioText: string;
  category: '식당' | '쇼핑' | '결제' | '택시' | '응급' | '기타' | '사용자 추가';
  isCustom?: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  category: '서류/결제' | '통신/앱' | '전자기기' | '건강/위생' | '의류/기타';
  checked: boolean;
  tip?: string;
}

export interface ExpenseItem {
  id: string;
  title: string;
  amountCny: number;
  payer: string;
  splitMembers: string[];
  category: '식사/맥주' | '교통' | '입장료' | '쇼핑' | '숙소' | '기타';
  date: string;
}

export interface SettlementDetail {
  from: string;
  to: string;
  amountKrw: number;
  amountCny: number;
}

export interface FoodPlaceItem {
  id: string;
  name: string;
  nameCn: string;
  pinyin?: string;
  category: '맛집' | '생맥주펍' | '야시장' | '카페/디저트' | '해산물';
  recommendedDish: string;
  priceRange: string;
  addressCn: string;
  notes: string;
  isCustom?: boolean;
}

export interface WishlistItem {
  id: string;
  title: string;
  titleCn: string;
  pinyin?: string;
  category: '풍경/포토' | '카페/골목' | '야경/바' | '해변/자연' | '문화/역사';
  desc: string;
  addressCn: string;
  timeNeededMinutes: number;
  visited: boolean;
  whyVisit: string;
  lat?: number;
  lng?: number;
  isCustom?: boolean;
}
