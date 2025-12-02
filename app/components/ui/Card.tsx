import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Card 容器組件
 *
 * @example
 * ```tsx
 * <Card hover>
 *   <Card.Header>
 *     <h3>標題</h3>
 *   </Card.Header>
 *   <Card.Body>
 *     內容
 *   </Card.Body>
 *   <Card.Footer>
 *     頁腳
 *   </Card.Footer>
 * </Card>
 * ```
 */
function Card({
  className,
  hover = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-sunny-border shadow-md",
        hover && "hover:shadow-lg hover:scale-105 transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn("p-6 border-b border-sunny-border", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function CardBody({ className, children, ...props }: CardBodyProps) {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
}

function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div
      className={cn("p-6 border-t border-sunny-border bg-sunny-light", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// 組合組件
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export { Card, CardHeader, CardBody, CardFooter };
export default Card;

