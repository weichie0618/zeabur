import { Metadata } from "next";

export const metadata: Metadata = {
  title: "加盟表單 | 晴朗家烘焙",
  description: "加入晴朗家烘焙加盟大家庭，開啟您的創業之旅",
  keywords: ["加盟", "創業", "合作", "加盟主"],
};

export default function FranchiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

