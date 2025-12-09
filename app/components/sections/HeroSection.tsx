import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/Button";

interface HeroAction {
  label: string;
  href: string;
  variant?: "default" | "secondary" | "outline";
}

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  actions?: HeroAction[];
  alignment?: "left" | "center" | "right";
  layout?: "fullwidth" | "with-image";
  backgroundGradient?: boolean;
  minHeight?: string;
}

/**
 * HeroSection 英雄段落組件
 *
 * @example
 * ```tsx
 * <HeroSection
 *   title="晴朗家烘焙"
 *   subtitle="讓晴朗家烘焙成為每個早晨幸福的開始"
 *   description="使用新鮮食材，以熱情與創新打造每一款產品"
 *   actions={[
 *     { label: "探索產品", href: "/products", variant: "primary" },
 *     { label: "認識我們", href: "/about", variant: "outline" },
 *   ]}
 *   alignment="center"
 * />
 * ```
 */
export function HeroSection({
  title,
  subtitle,
  description,
  image,
  imageAlt,
  actions,
  alignment = "center",
  layout = "fullwidth",
  backgroundGradient = true,
  minHeight = "min-h-screen",
}: HeroSectionProps) {
  const textAlignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[alignment];

  const contentMaxWidth = alignment === "center" ? "max-w-2xl" : "max-w-lg";

  // Fullwidth Layout
  if (layout === "fullwidth") {
    return (
      <section
        className={cn(
          minHeight,
          "relative flex items-center justify-center",
          backgroundGradient &&
            "bg-gradient-to-r from-sunny-cream to-sunny-white"
        )}
      >
        {/* 背景圖片 (可選) */}
        {image && (
          <div className="absolute inset-0 opacity-10">
            <Image
              src={image}
              alt={imageAlt || ""}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* 內容 */}
        <div className="container mx-auto px-4 relative z-10">
          <div
            className={cn(
              "mx-auto",
              contentMaxWidth,
              textAlignClass
            )}
          >
            {/* 標題上方標籤 */}
            {subtitle && (
              <p className="text-sm md:text-base font-semibold text-sunny-orange mb-4 uppercase tracking-wider">
                {subtitle}
              </p>
            )}

            {/* 主標題 */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-sunny-dark mb-6">
              {title}
            </h1>

            {/* 描述文本 */}
            {description && (
              <p className="text-lg md:text-xl text-sunny-gray mb-8 leading-relaxed">
                {description}
              </p>
            )}

            {/* 按鈕組 */}
            {actions && actions.length > 0 && (
              <div
                className={cn(
                  "flex flex-col md:flex-row gap-4",
                  alignment === "center" && "justify-center",
                  alignment === "left" && "justify-start",
                  alignment === "right" && "justify-end"
                )}
              >
                {actions.map((action, index) => (
                  <Link key={index} href={action.href}>
                    <Button
                      variant={action.variant || "default"}
                      size="lg"
                    >
                      {action.label}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 裝飾元素 */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-sunny-orange rounded-full flex justify-center">
            <div className="w-1 h-2 bg-sunny-orange rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  // With Image Layout
  return (
    <section
      className={cn(
        minHeight,
        "relative flex items-center",
        backgroundGradient &&
          "bg-gradient-to-r from-sunny-cream to-sunny-white"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* 左側內容 */}
          <div className={alignment === "right" ? "order-2" : "order-1"}>
            {subtitle && (
              <p className="text-sm md:text-base font-semibold text-sunny-orange mb-4 uppercase tracking-wider">
                {subtitle}
              </p>
            )}

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-sunny-dark mb-6">
              {title}
            </h1>

            {description && (
              <p className="text-base md:text-lg text-sunny-gray mb-8 leading-relaxed">
                {description}
              </p>
            )}

            {actions && actions.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4">
                {actions.map((action, index) => (
                  <Link key={index} href={action.href}>
                    <Button
                      variant={action.variant || "default"}
                      size="lg"
                    >
                      {action.label}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 右側圖片 */}
          {image && (
            <div className={alignment === "right" ? "order-1" : "order-2"}>
              <div className="relative w-full h-96 md:h-full rounded-xl overflow-hidden shadow-lg">
                <Image
                  src={image}
                  alt={imageAlt || ""}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default HeroSection;

