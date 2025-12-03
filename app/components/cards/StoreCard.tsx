import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { MapPin, Phone, Clock, Navigation } from "lucide-react";
import { Button } from "@/app/components/ui/Button";

interface StoreCardProps {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  hours: string;
  image: string;
  imageAlt: string;
  latitude?: number;
  longitude?: number;
  featured?: boolean;
}

/**
 * StoreCard 門市卡片組件
 *
 * @example
 * ```tsx
 * <StoreCard
 *   id="1"
 *   name="台北旗艦店"
 *   address="台北市信義區 01234 號"
 *   city="台北"
 *   district="信義區"
 *   phone="02-1234-5678"
 *   hours="06:00 - 21:00"
 *   image="/stores/taipei.jpg"
 *   imageAlt="台北旗艦店"
 *   latitude={25.0330}
 *   longitude={121.5654}
 * />
 * ```
 */
export function StoreCard({
  id,
  name,
  address,
  city,
  district,
  phone,
  hours,
  image,
  imageAlt,
  latitude,
  longitude,
  featured = false,
}: StoreCardProps) {
  const mapsUrl =
    latitude && longitude
      ? `https://maps.google.com/?q=${latitude},${longitude}`
      : `https://maps.google.com/?q=${address}`;

  return (
    <div
      className={cn(
        "group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 h-full flex flex-col",
        featured && "border-2 border-sunny-gold md:col-span-2"
      )}
    >
      {/* 圖片容器 */}
      <div className="relative w-full h-48 md:h-56 overflow-hidden bg-gray-200">
        <Image
          src={image}
          alt={imageAlt}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Featured Badge */}
        {featured && (
          <div className="absolute top-3 left-3 bg-sunny-gold text-sunny-dark px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            🏆 旗艦店
          </div>
        )}

        {/* 城市標籤 */}
        <div className="absolute top-3 right-3 bg-sunny-orange text-white px-3 py-1 rounded-full text-xs font-semibold">
          {city}
        </div>
      </div>

      {/* 內容容器 */}
      <div className="flex-1 flex flex-col p-4 md:p-5">
        {/* 名稱 */}
        <h3 className="text-lg md:text-xl font-bold text-sunny-dark mb-1">
          {name}
        </h3>

        {/* 地區 */}
        <p className="text-sm text-sunny-light-gray mb-4">{district}</p>

        {/* 資訊項目 */}
        <div className="space-y-3 mb-4 text-sm">
          {/* 地址 */}
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-sunny-orange flex-shrink-0 mt-0.5" />
            <span className="text-sunny-gray">{address}</span>
          </div>

          {/* 電話 */}
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-sunny-orange flex-shrink-0" />
            <a
              href={`tel:${phone}`}
              className="text-sunny-orange hover:text-sunny-gold font-semibold transition-colors"
            >
              {phone}
            </a>
          </div>

          {/* 營業時間 */}
          <div className="flex items-start gap-3">
            <Clock size={18} className="text-sunny-orange flex-shrink-0 mt-0.5" />
            <span className="text-sunny-gray">{hours}</span>
          </div>
        </div>

        {/* 按鈕組 */}
        <div className="flex gap-2 pt-4 border-t border-sunny-border">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => window.open(mapsUrl, "_blank")}
          >
            <Navigation size={16} />
            導航
          </Button>
          <Button
            size="sm"
            variant="default"
            className="flex-1"
            onClick={() => window.location.href = `tel:${phone}`}
          >
            致電
          </Button>
        </div>
      </div>
    </div>
  );
}

export default StoreCard;

