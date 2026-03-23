"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../primitives/tabs";
import { cn } from "../lib/utils";

export interface NotebookPage {
  /** Unique key for the tab. */
  value: string;
  /** Tab label. */
  label: string;
  /** Tab content. */
  children: React.ReactNode;
}

export interface FormNotebookProps {
  /** Tab pages to render (mirrors Odoo "notebook > page"). */
  pages: NotebookPage[];
  /** Initially active page value. Defaults to the first page. */
  defaultValue?: string;
  /** Controlled active page. */
  value?: string;
  /** Called when the active page changes. */
  onValueChange?: (value: string) => void;
  /** Tab variant passed to the underlying TabsList. */
  variant?: "default" | "underline";
  className?: string;
}

export function FormNotebook({
  pages,
  defaultValue,
  value,
  onValueChange,
  variant = "underline",
  className,
}: FormNotebookProps) {
  const fallbackDefault = pages[0]?.value;

  return (
    <Tabs
      defaultValue={defaultValue ?? fallbackDefault}
      value={value}
      onValueChange={onValueChange}
      className={cn("w-full", className)}
    >
      <TabsList variant={variant}>
        {pages.map((page) => (
          <TabsTrigger key={page.value} value={page.value}>
            {page.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {pages.map((page) => (
        <TabsContent key={page.value} value={page.value}>
          {page.children}
        </TabsContent>
      ))}
    </Tabs>
  );
}
