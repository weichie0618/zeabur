import React from 'react';
import ProductCard from './ProductCard';
import { FaSearch } from 'react-icons/fa';

interface ProductListProps {
  products: Array<{
    id: string;
    name: string;
    imageUrl: string;
    price: number;
  }>;
  selectedProducts: string[];
  onSelect: (id: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onNextStep: () => void;
}

const ProductList = React.memo(({ 
  products, 
  selectedProducts, 
  onSelect,
  searchTerm,
  onSearchChange,
  onNextStep
}: ProductListProps) => {
  const filteredProducts = React.useMemo(() => 
    products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [products, searchTerm]
  );

  return (
    <div id="product-selection">
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold">選擇您想申請的樣品</h2>
          <div className="relative w-full sm:w-auto">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜尋樣品..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg mb-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="font-medium text-center sm:text-left">
            已選擇 <span className="text-blue-600 font-bold">{selectedProducts.length}</span> 個樣品
          </span>
          {selectedProducts.length > 0 && (
            <button 
              onClick={onNextStep}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-300 w-full sm:w-auto"
            >
              下一步：填寫資料
            </button>
          )}
        </div>

        {searchTerm && (
          <div className="mb-4 text-gray-600">
            搜尋「{searchTerm}」的結果：{filteredProducts.length} 項商品
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              isSelected={selectedProducts.includes(product.id)}
              onSelect={onSelect}
              index={index}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">沒有找到符合「{searchTerm}」的商品</p>
          </div>
        )}
      </div>
    </div>
  );
});

ProductList.displayName = 'ProductList';

export default ProductList; 