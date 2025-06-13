import Image from 'next/image';
import { Product } from '../data/products';

interface ServerProductListProps {
  products: Product[];
}

// 伺服器端產品列表組件
export default function ServerProductList({ products }: ServerProductListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
      {products.map(product => (
        <div 
          key={product.id}
          data-product-id={product.id}
          className="product-item border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="relative h-48 bg-gray-100">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              loading="lazy"
              priority={false}
            />
            <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center opacity-0 product-selected-overlay">
              <div className="bg-blue-500 text-white rounded-full p-2">
                已選擇
              </div>
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-sm font-medium line-clamp-2">{product.name.split('｜')[1]}</h3>
          </div>
        </div>
      ))}
    </div>
  );
} 