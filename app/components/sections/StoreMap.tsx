'use client';

import { Store } from '@/types';

interface StoreMapProps {
  stores: Store[];
  selectedStoreId?: string;
  onStoreClick?: (store: Store) => void;
}

export default function StoreMap({ stores, selectedStoreId, onStoreClick }: StoreMapProps) {
  const validStores = stores.filter(s => s.latitude && s.longitude);
  
  // 計算地圖中心點（所有門市的平均位置）
  const calculateCenter = () => {
    if (validStores.length === 0) return { lat: 23.5, lng: 121.0 }; // 台灣中心
    
    const avgLat = validStores.reduce((sum, s) => sum + (s.latitude || 0), 0) / validStores.length;
    const avgLng = validStores.reduce((sum, s) => sum + (s.longitude || 0), 0) / validStores.length;
    return { lat: avgLat, lng: avgLng };
  };

  const center = calculateCenter();
  
  // 生成 OpenStreetMap 嵌入 URL（使用 Leaflet 的靜態地圖服務）
  const generateMapUrl = () => {
    if (validStores.length === 0) {
      return `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - 0.5},${center.lat - 0.5},${center.lng + 0.5},${center.lat + 0.5}&layer=mapnik&marker=${center.lat},${center.lng}`;
    }
    
    // 計算邊界框以包含所有門市
    const lats = validStores.map(s => s.latitude!);
    const lngs = validStores.map(s => s.longitude!);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // 添加一些邊距
    const padding = 0.1;
    const bbox = `${minLng - padding},${minLat - padding},${maxLng + padding},${maxLat + padding}`;
    
    // 生成標記參數
    const markers = validStores.map(store => 
      `${store.latitude},${store.longitude}`
    ).join('&marker=');
    
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${markers}`;
  };

  // 如果沒有有效的門市座標，顯示提示
  if (validStores.length === 0) {
    return (
      <div className="h-96 rounded-3xl bg-gray-200 flex items-center justify-center shadow-lg">
        <div className="text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <p className="text-gray-600 font-semibold">台灣門市地圖</p>
          <p className="text-sm text-gray-500">新竹、台中、台北</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 w-full rounded-3xl overflow-hidden shadow-lg relative">
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={generateMapUrl()}
        className="w-full h-full"
        title="晴朗家烘焙門市地圖"
      />
      
      {/* 點擊提示覆蓋層 */}
      {/* <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg pointer-events-none">
        <p className="text-xs text-gray-600 text-center">
          💡 點擊右側門市卡片查看詳細資訊
        </p>
      </div> */}
    </div>
  );
}
