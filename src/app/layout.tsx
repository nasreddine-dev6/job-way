import type { Metadata } from "next";
import "./globals.css";
import ClientToaster from "@/components/ClientToaster";

export const metadata: Metadata = {
  title: "JobWay - منصة التوظيف الذكية",
  description: "منصة التوظيف الذكية - ابحث عن وظيفة أحلامك أو انشر فرصتك الوظيفية",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <ClientToaster />
      </body>
    </html>
  );
}
