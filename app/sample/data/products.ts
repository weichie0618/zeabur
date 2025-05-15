// 產品類型定義
export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
}

// 麵包商品資料
export const products: Product[] = [
  {
    id: "ZZXTN113006",
    name: "[晴朗家烘焙]｜香芋肉鬆小吐司（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜鹹甜芋頭與肉鬆的經典組合",
    imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rasj-m66gms6pxzme37_tn.webp",
    price: 60
  },
  {
    id: "ZZXGJ113007",
    name: "[晴朗家烘焙]｜荔枝堅果沙瓦豆（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜荔枝蜜餞與堅果的香甜搭配",
    imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rasg-m66huu730exk9d_tn.webp",
    price: 80
  },
  {
    id: "ZZXGJ113013",
    name: "[晴朗家烘焙]｜咖啡奶酥（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜純咖啡粉與香濃奶酥交織的迷人風味",
    imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rasb-m66iafllgryw0b_tn.webp",
    price: 60
  },
  {
    id: "ZZXGJ113003",
    name: "[晴朗家烘焙]｜巧克力沙瓦豆（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜雙重巧克力餡濃郁爆餡，香氣四溢",
    imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rasj-m66htvtbd57c91_tn.webp",
    price: 75
  },
  {
    id: "ZZXYX113009",
    name: "[晴朗家烘焙]｜雜糧乳酪（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜鹹香乳酪塊融合多種穀物麵包體",
    imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rasf-m66icg7b7x5k8c_tn.webp",
    price: 75
  },
  {
    id: "ZZXGJ113011",
    name: "[晴朗家烘焙]｜雷神巧克力（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜核桃香脆搭配濃郁黑可可，甜而不膩",
    imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rasi-m66i1rnrznr5f5_tn.webp",
    price: 75
  },
  {
    id: "ZZXTN113003",
    name: "[晴朗家烘焙]｜地瓜麻糬小吐司（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜台灣地瓜與黑糖麻糬，甘甜有嚼勁",
    imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7ras9-m66g6wvxz0k82d_tn.webp",
    price: 60
  },
  {
    id: "ZZXBA113002",
    name: "[晴朗家烘焙]｜奶酥伯爵紅茶（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜伯爵茶香融合奶酥與核桃葡萄的高雅滋味",
    imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rasd-m66hzajqcu8198_tn.webp",
    price: 75
  },
  {
    id: "ZZXBA113013",
    name: "[晴朗家烘焙]｜莓果卡士達（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜蔓越莓與香濃卡士達交織的甜點級享受",
    imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7ras9-m66i6x1mntpy65_tn.webp",
    price: 75
  },
  {
    id: "ZZXGJ113010",
    name: "[晴朗家烘焙]｜蔓越莓沙瓦豆（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜酸甜果乾與紅麴色澤，果香清爽",
    imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rasi-m66hptqt2vcmeb_tn.webp",
    price: 75
  },
  {
    id: "ZZXYX113008",
    name: "[晴朗家烘焙]｜雜糧地瓜（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜雜糧與地瓜塊交織的營養美味",
    imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7ras9-m66ifp95xf2uce_tn.webp",
    price: 70
  },
  {
    id: "ZZXGJ113001",
    name: "[晴朗家烘焙]｜抹茶蔓越莓沙瓦豆（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜濃郁抹茶與蔓越莓果乾清爽平衡",
    imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rask-m66hx5d7avpd9e_tn.webp",
    price: 75
  },
  {
    id: "ZZXGJ113008",
    name: "[晴朗家烘焙]｜葡萄軟歐沙瓦豆（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜葡萄乾與紫薯粉交織的自然果香",
    imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rasc-m66hfdsn8ja06a_tn.webp",
    price: 75
  },
  {
    id: "ZZXTN113004",
    name: "[晴朗家烘焙]｜抹茶紅豆小吐司（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜雙品牌抹茶搭配紅豆麻糬，香濃耐嚼",
    imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rash-m66hch3agj2w03_tn.webp",
    price: 60
  },
  {
    id: "ZZXTN113001",
    name: "[晴朗家烘焙]｜巧克力奶油芝士小吐司（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜黑炭可可與奶油芝士滑順融合",
    imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rasf-m66bafk5apau88_tn.webp",
    price: 60
  },
  {
    id: "ZZXBA113007",
    name: "[晴朗家烘焙]｜玫瑰凡爾賽（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜玫瑰花瓣搭配蔓越莓與核桃，層次豐富",
    imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rasb-m66i45iqazdi08_tn.webp",
    price: 75
  },
  {
    id: "ZZXYX113011",
    name: "[晴朗家烘焙]｜雜糧核桃（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜香氣濃郁的核桃與雜糧麵包完美融合",
    imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rash-m66ijnn1kcn5da_tn.webp",
    price: 70
  },
  {
    id: "ZZXYX113010",
    name: "[晴朗家烘焙]｜雜糧芋頭（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜綿密芋頭搭配多穀雜糧，口感扎實",
    imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7ras8-m66ihf2fgzsm17_tn.webp",
    price: 70
  }
]; 