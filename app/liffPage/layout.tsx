import { LiffProvider } from '@/lib/LiffProvider';
import LiffInit from './LiffInit';

// 返回靜態元數據
export const metadata = {
  title: 'LINE 服務連結',
  description: '連結您的服務與 LINE 官方帳號',
};

export default function LiffPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 使用環境變數中的 LIFF ID
  const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;

  return (
    <>
      {/* 預載 LIFF SDK - 不需要任何輸出 */}
      <LiffInit />
      
      <LiffProvider liffId={liffId}>
        {children}
      </LiffProvider>
    </>
  );
} 