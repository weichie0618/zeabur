import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ServerHeader from "./components/ServerHeader";
import HeaderBehavior from "./components/HeaderBehavior";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "樣品申請網站",
  description: "申請您需要的商品樣品",
  icons: {
    icon: "/sample/favicon.ico",
    shortcut: "/sample/favicon.ico",
    apple: "/sample/favicon.ico",
  },
};

export default function SampleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={inter.className}>
      <ServerHeader />
      <HeaderBehavior />
      <main className="container mx-auto py-8 px-4">
        {children}
      </main>
      <footer className="bg-gray-800 text-white p-4 mt-8">
        <div className="container mx-auto text-center">
          <p>© {new Date().getFullYear()} 屹澧股份有限公司. 版權所有.</p>
        </div>
      </footer>
    </div>
  );
}
