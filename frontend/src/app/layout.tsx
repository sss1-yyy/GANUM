import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

const pretendard = localFont({
  src: "../styles/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
});

export const metadata: Metadata = {
  title: "GANUM(가늠) · AI 금융 코치",
  description: "내 자산과 투자 성향, 한눈에 가늠해보세요.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body>
        <Providers>
          <div className="app-frame">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
