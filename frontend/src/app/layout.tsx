import type { Metadata } from "next";
import "./globals.css";
import { AppDataProvider } from "@/shared/lib/app-data-context";
import { SiteHeader } from "@/shared/components/site-header";

export const metadata: Metadata = {
  title: "Campus Link",
  description: "대명캠과 성서캠을 연결하는 협업 매칭 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full">
        <AppDataProvider>
          <SiteHeader />
          {children}
        </AppDataProvider>
      </body>
    </html>
  );
}
