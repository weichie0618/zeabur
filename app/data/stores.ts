import { Store } from "@/types";

export const stores: Store[] = [
  
  {
    id: "1",
    name: "晴朗家烘焙-新竹鐵道店",
    slug: "hsinchu-railway",
    address: "300新竹市東區鐵道路一段57號",
    city: "新竹",
    district: "東區",
    phone: "0935 525 939",
    email: "hsinchu@sunnyhausbakery.com.tw",
    hours: "11:00–19:00",
    image: "/images/stores/hsinchu-railway.jpg",
    imageAlt: "晴朗家烘焙-新竹鐵道店",
    latitude: 24.8015,
    longitude: 120.9733,
    featured: false,
    createdAt: new Date("2024-06-15"),
    updatedAt: new Date("2025-12-01"),
  },
];

// 按城市分組
export const storesByCity = {
  台北: stores.filter((s) => s.city === "台北"),
  新竹: stores.filter((s) => s.city === "新竹"),
  台中: stores.filter((s) => s.city === "台中"),
  桃園: stores.filter((s) => s.city === "桃園"),
  高雄: stores.filter((s) => s.city === "高雄"),
};

// 精選門市
export const featuredStores = stores.filter((s) => s.featured);

export default stores;

