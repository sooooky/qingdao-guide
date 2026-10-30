import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Navigation as NavIcon, Compass, Car, RefreshCw, Layers, Map as MapIcon, Globe } from 'lucide-react';
import { ScheduleItem, DayNumber } from '../types';
import { calculateDistanceKm, openAmap } from '../utils/geo';

interface MapTabProps {
  allItinerary: ScheduleItem[];
  onOpenTaxiModal: (data: {
    title: string;
    cnText: string;
    pinyin?: string;
    krDesc?: string;
    addressCn?: string;
  }) => void;
}

type TileMode = 'street' | 'osm' | 'satellite';

const TILE_CONFIGS: Record<
  TileMode,
  { name: string; url: string; options: L.TileLayerOptions }
> = {
  street: {
    name: '표준 고화질 지도',
    // 100% Free, NO API Key needed, global fast CDN with Chinese & English street labels
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 18,
      attribution: '&copy; Esri &mdash; World Street Map (No Key Required)',
    },
  },
  osm: {
    name: '컬러풀 보행 지도',
    // OpenStreetMap Humanitarian high-contrast mirror
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      attribution: '&copy; OpenStreetMap contributors, Humanitarian Team',
    },
  },
  satellite: {
    name: '위성 항공 사진',
    // High-resolution satellite imagery
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 18,
      attribution: '&copy; Esri &mdash; World Imagery',
    },
  },
};

export const MapTab: React.FC<MapTabProps> = ({ allItinerary, onOpenTaxiModal }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);

  const [selectedMapDay, setSelectedMapDay] = useState<'all' | DayNumber>(1);
  const [tileMode, setTileMode] = useState<TileMode>('street');
  const [showTileSelector, setShowTileSelector] = useState(false);

  const filteredItems =
    selectedMapDay === 'all'
      ? allItinerary.filter((i) => i.lat && i.lng)
      : allItinerary.filter((i) => i.day === selectedMapDay && i.lat && i.lng);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCenter: [number, number] = [36.0683, 120.3158]; // Central Qingdao
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 12,
        zoomControl: true,
      });

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Swap / Apply Tile Layer without requiring any API keys
    const config = TILE_CONFIGS[tileMode];
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const newTileLayer = L.tileLayer(config.url, config.options).addTo(map);
    tileLayerRef.current = newTileLayer;

    // Invalidate size in next tick to avoid grey tiles
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    // Clear old markers & polyline
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    if (filteredItems.length === 0) return;

    const latLngs: [number, number][] = [];

    filteredItems.forEach((item, index) => {
      const pos: [number, number] = [item.lat, item.lng];
      latLngs.push(pos);

      // Custom Sequence Badge Marker
      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `<span>${index + 1}</span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker(pos, { icon: customIcon }).addTo(map);

      // Popup Content
      const popupDiv = document.createElement('div');
      popupDiv.className = 'text-slate-100 p-1 space-y-2 min-w-[200px]';
      popupDiv.innerHTML = `
        <div class="font-black text-sm text-amber-400">${index + 1}. ${item.title}</div>
        <div class="text-[11px] text-amber-300 font-semibold">${item.titleCn}</div>
        <div class="text-[10px] text-slate-300">${item.addressCn}</div>
        <div class="text-[10px] text-cyan-400 font-mono">⏰ ${item.startTime} (체류 약 ${item.durationMinutes}분)</div>
        <div class="flex gap-1.5 pt-1">
          <button id="amap-btn-${item.id}" class="flex-1 py-1 px-2 bg-cyan-700 hover:bg-cyan-600 text-white text-[10px] rounded font-bold transition">고덕 길찾기</button>
          <button id="taxi-btn-${item.id}" class="flex-1 py-1 px-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] rounded font-black transition">번역 카드</button>
        </div>
      `;

      marker.bindPopup(popupDiv);

      marker.on('popupopen', () => {
        const amapBtn = document.getElementById(`amap-btn-${item.id}`);
        const taxiBtn = document.getElementById(`taxi-btn-${item.id}`);
        if (amapBtn) {
          amapBtn.onclick = () => openAmap(item.titleCn, item.addressCn);
        }
        if (taxiBtn) {
          taxiBtn.onclick = () => {
            onOpenTaxiModal({
              title: item.title,
              cnText: item.addressCn || item.titleCn,
              pinyin: item.pinyin,
              krDesc: item.title,
              addressCn: item.addressCn,
            });
          };
        }
      });

      markersRef.current.push(marker);
    });

    // Draw route line
    if (latLngs.length > 1) {
      polylineRef.current = L.polyline(latLngs, {
        color: '#f59e0b',
        weight: 4,
        opacity: 0.9,
        dashArray: '8, 8',
      }).addTo(map);

      map.fitBounds(polylineRef.current.getBounds(), { padding: [40, 40] });
    } else if (latLngs.length === 1) {
      map.setView(latLngs[0], 14);
    }
  }, [selectedMapDay, filteredItems.length, tileMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleRecenter = () => {
    if (!mapInstanceRef.current || filteredItems.length === 0) return;
    if (polylineRef.current) {
      mapInstanceRef.current.fitBounds(polylineRef.current.getBounds(), { padding: [40, 40] });
    } else {
      mapInstanceRef.current.setView([filteredItems[0].lat, filteredItems[0].lng], 14);
    }
  };

  // Calculate cumulative distance
  let cumulativeDist = 0;
  const routeDistances: { from: string; to: string; dist: number }[] = [];
  for (let i = 1; i < filteredItems.length; i++) {
    const prev = filteredItems[i - 1];
    const curr = filteredItems[i];
    const d = calculateDistanceKm(prev.lat, prev.lng, curr.lat, curr.lng);
    cumulativeDist += d;
    routeDistances.push({
      from: prev.title,
      to: curr.title,
      dist: d,
    });
  }

  return (
    <div className="space-y-3.5">
      {/* Day Selector Segmented Bar */}
      <div className="flex items-center justify-between bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-sm">
        {([1, 2, 3] as DayNumber[]).map((d) => (
          <button
            key={d}
            onClick={() => setSelectedMapDay(d)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              selectedMapDay === d
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Day {d} 동선 지도
          </button>
        ))}
        <button
          onClick={() => setSelectedMapDay('all')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition ${
            selectedMapDay === 'all'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          전체 보기
        </button>
      </div>

      {/* Map Viewport Box */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-900">
        <div ref={mapContainerRef} className="w-full h-[380px] sm:h-[460px] z-10" />

        {/* Map Floating Tools */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
          <button
            onClick={handleRecenter}
            className="p-2 bg-slate-900/95 hover:bg-slate-800 text-amber-400 rounded-xl shadow-xl border border-slate-700 transition active:scale-95"
            title="동선 화면에 맞추기"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowTileSelector(!showTileSelector)}
              className="p-2 bg-slate-900/95 hover:bg-slate-800 text-cyan-400 rounded-xl shadow-xl border border-slate-700 transition active:scale-95 flex items-center justify-center"
              title="지도 스타일 변경"
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Tile Mode Popover */}
            {showTileSelector && (
              <div className="absolute right-0 top-10 w-44 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-2 shadow-2xl space-y-1 z-30 text-xs">
                <span className="text-[10px] text-slate-400 px-2 font-bold block mb-1">
                  지도 스타일 선택
                </span>
                {(['street', 'osm', 'satellite'] as TileMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setTileMode(mode);
                      setShowTileSelector(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl transition flex items-center justify-between text-xs font-semibold ${
                      tileMode === mode
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{TILE_CONFIGS[mode].name}</span>
                    {tileMode === mode && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map Floating Summary Pill */}
        <div className="absolute bottom-3 left-3 right-3 z-20 bg-slate-950/90 backdrop-blur-md rounded-xl p-2.5 border border-slate-800 flex items-center justify-between text-xs shadow-lg">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-slate-200 font-medium">
              {selectedMapDay === 'all' ? '전체 일정' : `Day ${selectedMapDay}`} 주요 동선
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800 hidden sm:inline">
              ✓ 무제한 무료 지도 타일
            </span>
          </div>
          <div className="text-right">
            <span className="text-cyan-400 font-mono font-bold">
              총 {cumulativeDist.toFixed(1)} km
            </span>
            <span className="text-[10px] text-slate-400 ml-1">({filteredItems.length}개 스팟)</span>
          </div>
        </div>
      </div>

      {/* Route Distance List */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <NavIcon className="w-4 h-4" />
            <span>
              {selectedMapDay === 'all' ? '전체 구간' : `Day ${selectedMapDay}`} 상세 이동 거리 & 소요시간
            </span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            직선 약 {cumulativeDist.toFixed(1)} km
          </span>
        </div>

        {routeDistances.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">등록된 이동 구간이 2곳 이상 필요합니다.</p>
        ) : (
          <div className="space-y-1.5">
            {routeDistances.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs"
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                    구간 {i + 1}
                  </span>
                  <span className="text-slate-200 truncate">
                    {r.from} ➔ {r.to}
                  </span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="font-mono font-bold text-cyan-400">약 {r.dist} km</span>
                  <span className="text-[10px] text-slate-400 block">
                    차량 {Math.round(r.dist * 2.2 + 5)}분 예상
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
