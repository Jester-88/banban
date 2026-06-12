import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {export const metadata: Metadata = {
  title: "반반 · BANBAN",
  description: "오늘의 이슈, 전국이 반반으로 나뉩니다",
  openGraph: {
    title: "반반 · BANBAN",
    description: "오늘의 이슈, 전국이 반반으로 나뉩니다",
    url: "https://banban-d9aa.vercel.app/", // 👈 여기에 기획자님의 진짜 Vercel 사이트 주소를 넣어주세요! (예: https://banban-...vercel.app)
    siteName: "반반",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "반반 로고",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
};
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
