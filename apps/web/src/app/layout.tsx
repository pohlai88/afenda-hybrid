import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@afenda/ui-core/providers/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AFENDA",
  description: "AFENDA HCM — metadata-driven ERP shell",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider defaultTheme="system" storageKey="afenda-ui-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
