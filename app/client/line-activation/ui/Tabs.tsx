"use client";

import * as React from "react";

// Context
interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(
  undefined
);

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export function Tabs({ value, onValueChange, children, ...props }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div {...props}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function TabsList({ children, ...props }: TabsListProps) {
  return (
    <div
      className="flex bg-gray-100 rounded-md p-1"
      {...props}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

export function TabsTrigger({
  value,
  children,
  ...props
}: TabsTriggerProps) {
  const context = React.useContext(TabsContext);
  const isActive = context?.value === value;

  return (
    <button
      type="button"
      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
        isActive
          ? "bg-white shadow-sm text-black"
          : "text-gray-600 hover:text-gray-900"
      }`}
      onClick={() => context?.onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

export function TabsContent({ value, children, ...props }: TabsContentProps) {
  const context = React.useContext(TabsContext);
  const isActive = context?.value === value;

  if (!isActive) return null;

  return <div {...props}>{children}</div>;
} 