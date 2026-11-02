"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import chevronLeft from "./assets/chevron-left.svg";
import ganumLogo from "./assets/ganum-logo.png";
import notification from "./assets/notification.png";

/**
 * Figma 상단 바(뒤로가기 · 로고 · 알림).
 * onBack 을 주면 화면 안에서 뒤로 가요(예: 결과 → 입력). 없으면 이전 페이지로 가고,
 * 주소를 바로 열어 이전 기록이 없으면 홈으로 가요.
 */
export function TopBar({ onBack }: { onBack?: () => void }) {
  const router = useRouter();
  const goBack = () => {
    if (onBack) return onBack();
    if (window.history.length > 1) router.back();
    else router.push("/home");
  };
  return (
    <header className="relative flex h-(--top-bar-height) items-center justify-between px-8">
      <button type="button" aria-label="뒤로 가기" onClick={goBack} className="size-7">
        <Image src={chevronLeft} alt="" width={28} height={28} />
      </button>
      {/* Figma 로고 이미지가 여백을 포함하고 있어서 같은 비율로 잘라 보여줘요 */}
      <div className="absolute top-[17px] left-[calc(50%+0.5px)] h-[22px] w-[104px] -translate-x-1/2 overflow-hidden">
        <Image
          src={ganumLogo}
          alt="GANUM"
          priority
          className="absolute top-[-61.11%] left-[-11.8%] h-[227.78%] w-[121.32%] max-w-none"
        />
      </div>
      <Link href="/notifications" aria-label="알림" className="size-7">
        <Image src={notification} alt="" width={28} height={28} className="object-contain" />
      </Link>
    </header>
  );
}
