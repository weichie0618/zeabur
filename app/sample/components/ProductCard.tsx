import Image from 'next/image';
import { IoIosCheckmarkCircle } from 'react-icons/io';
import { useState } from 'react';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    imageUrl: string;
  };
  isSelected: boolean;
  onSelect: (id: string) => void;
  index: number; // 添加索引參數用於優化加載順序
}

const ProductCard = ({ product, isSelected, onSelect, index }: ProductCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // 只為首屏可見的前8個產品設置priority
  const isPriority = index < 8;
  
  // 從Shopee網址轉為WebP格式並指定尺寸
  const optimizedImageUrl = product.imageUrl.replace('.webp', '_300x300.webp');
  
  return (
    <div 
      className={`border rounded-lg overflow-hidden transition-all transform hover:shadow-lg ${
        isSelected ? 'border-blue-500 bg-blue-50 scale-102' : 'border-gray-200 hover:border-blue-300'
      }`}
      onClick={() => onSelect(product.id)}
    >
      <div className="relative h-40 w-full overflow-hidden bg-gray-100">
        {/* 添加圖片加載時的佔位元素 */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <Image
          src={optimizedImageUrl}
          alt={product.name.split('｜')[1] || product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={isPriority}
          loading={isPriority ? "eager" : "lazy"}
          className={`object-cover transition-transform hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          quality={75} // 減少圖片質量以提高加載速度
        />
        {isSelected && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1 z-10">
            <IoIosCheckmarkCircle size={20} />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium line-clamp-2 mb-2">{product.name.split('｜')[1] || product.name}</h3>
        <p className="text-blue-600 font-bold mb-2">樣品申請</p>
        
        <div className="flex items-center">
          <input 
            type="checkbox"
            checked={isSelected}
            onChange={() => {}} // 使用onClick處理
            className="h-4 w-4 text-blue-600 rounded"
          />
          <span className="ml-2 text-sm">{isSelected ? '已選擇' : '選擇此樣品'}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard; 