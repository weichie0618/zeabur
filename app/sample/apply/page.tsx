import { Suspense } from 'react';
import { products } from '../data/products'; // 產品資料移到單獨的文件
import ProductDisplay from '../components/ProductDisplay'; // 客戶端產品顯示組件
import { Metadata } from 'next';
import styles from './styles.module.css'; // 使用 CSS Modules 替代

// 只保留動態元數據生成函數，移除靜態 metadata
export const generateMetadata = async (): Promise<Metadata> => {
  return {
    title: '烘焙樣品申請 | 晴朗家烘焙',
    description: '申請試用我們的烘焙產品樣品，晴朗家烘焙提供多種口味麵包供您企業評估。',
    alternates: {
      canonical: 'https://sunnyhausbakery.com.tw/sample/apply',
    },
    openGraph: {
      title: '烘焙樣品申請 | 晴朗家烘焙',
      description: '申請試用我們的烘焙產品樣品，晴朗家烘焙提供多種口味麵包供您企業評估。',
      url: 'https://sunnyhausbakery.com.tw/sample/apply',
      siteName: '晴朗家烘焙',
      locale: 'zh_TW',
      type: 'website',
    }
  };
};

export default function ApplyPage() {
  // 這部分在伺服器端渲染

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">烘焙樣品申請</h1>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg shadow-sm border border-blue-100">
          <p className="text-gray-700">
            請選擇您感興趣的麵包樣品，填寫您的基本資料後提交申請。我們將寄送所選樣品供您評估，感謝您的支持！
          </p>
        </div>
      </div>
      
      {/* 使用 Suspense 優化加載體驗 */}
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDisplay products={products} />
      </Suspense>
    </div>
  );
}

// 產品加載骨架屏，直接放在伺服器組件內以減少客戶端JS
function ProductSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
      ))}
    </div>
  );
} 