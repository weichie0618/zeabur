import { Product } from "@/types";

export const products: Product[] = [
  {
    id: "1",
    name: "原味麵包",
    slug: "original-bread",
    description: "使用天然酵母烘焙，香氣撲鼻的經典原味麵包",
    image: "/images/products/original-bread.jpg",
    imageAlt: "原味麵包",
    category: "經典系列",
    price: 45,
    stock: 50,
    featured: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-12-01"),
  },
  {
    id: "2",
    name: "全麥核桃麵包",
    slug: "walnut-wholemeal-bread",
    description: "營養豐富的全麥與香脆核桃的完美結合",
    image: "/images/products/walnut-bread.jpg",
    imageAlt: "全麥核桃麵包",
    category: "健康系列",
    price: 65,
    stock: 40,
    featured: true,
    createdAt: new Date("2025-01-05"),
    updatedAt: new Date("2025-12-01"),
  },
  {
    id: "3",
    name: "黑麥酸種麵包",
    slug: "rye-sourdough-bread",
    description: "德國進口黑麥搭配自製酸種，口感層次豐富",
    image: "/images/products/rye-sourdough.jpg",
    imageAlt: "黑麥酸種麵包",
    category: "特色系列",
    price: 85,
    stock: 30,
    featured: false,
    createdAt: new Date("2025-01-10"),
    updatedAt: new Date("2025-12-01"),
  },
  {
    id: "4",
    name: "蜂蜜奶油麵包",
    slug: "honey-butter-bread",
    description: "甜蜜的蜂蜜和香醇奶油，適合下午茶時光",
    image: "/images/products/honey-butter-bread.jpg",
    imageAlt: "蜂蜜奶油麵包",
    category: "甜味系列",
    price: 55,
    stock: 60,
    featured: false,
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date("2025-12-01"),
  },
  {
    id: "5",
    name: "起司麵包",
    slug: "cheese-bread",
    description: "起司香氣與麵包的鹹香搭配，起司牽絲的快樂",
    image: "/images/products/cheese-bread.jpg",
    imageAlt: "起司麵包",
    category: "鹹味系列",
    price: 60,
    stock: 45,
    featured: false,
    createdAt: new Date("2025-01-20"),
    updatedAt: new Date("2025-12-01"),
  },
  {
    id: "6",
    name: "抹茶紅豆麵包",
    slug: "matcha-red-bean-bread",
    description: "日式抹茶與紅豆的完美融合，療癒味蕾",
    image: "/images/products/matcha-red-bean.jpg",
    imageAlt: "抹茶紅豆麵包",
    category: "日式系列",
    price: 75,
    stock: 35,
    featured: true,
    createdAt: new Date("2025-01-25"),
    updatedAt: new Date("2025-12-01"),
  },
];

// 按分類分組
export const productsByCategory = {
  "經典系列": products.filter((p) => p.category === "經典系列"),
  "健康系列": products.filter((p) => p.category === "健康系列"),
  "特色系列": products.filter((p) => p.category === "特色系列"),
  "甜味系列": products.filter((p) => p.category === "甜味系列"),
  "鹹味系列": products.filter((p) => p.category === "鹹味系列"),
  "日式系列": products.filter((p) => p.category === "日式系列"),
};

// 精選產品
export const featuredProducts = products.filter((p) => p.featured);

export default products;

