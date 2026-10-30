import { ScheduleItem } from '../types';

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(minutes: number): string {
  const norm = (minutes + 24 * 60) % (24 * 60);
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function recalculateCascade(items: ScheduleItem[]): ScheduleItem[] {
  return items.map((item, idx) => {
    if (idx === 0) return item;
    const prev = items[idx - 1];
    const prevEnd = timeToMinutes(prev.startTime) + (prev.durationMinutes || 60) + (prev.transitMinutes || 15);
    return { ...item, startTime: minutesToTime(prevEnd) };
  });
}

export function calculateDistanceKm(lat1?: number, lon1?: number, lat2?: number, lon2?: number): number {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;
  if (lat1 === 0 || lon1 === 0 || lat2 === 0 || lon2 === 0) return 0;

  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export function openAmap(titleCn: string, addressCn: string) {
  const query = encodeURIComponent(`${titleCn} ${addressCn}`.trim());
  window.open(`https://uri.amap.com/search?keyword=${query}&src=qingdao_app`, '_blank', 'noopener,noreferrer');
}

export function openBaidu(titleCn: string, addressCn: string) {
  const query = encodeURIComponent(`${titleCn} ${addressCn}`.trim());
  window.open(`https://api.map.baidu.com/geocoder?address=${query}&output=html&src=qingdao_app`, '_blank', 'noopener,noreferrer');
}
