"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import chevronLeft from "../assets/chevron-left.svg";
import ganumLogo from "../assets/ganum-logo.png";
import notification from "../assets/notification.png";

/** Figma 상단 바(뒤로가기 · 로고 · 알림). 다른 기능에서도 쓰게 되면 components/layout 으로 옮겨요. */
export function ReportTopBar() {
  const router = useRouter();
  return (
    <header className="relative flex h-(--top-bar-height) items-center justify-between px-8">
      <button type="button" aria-label="뒤로 가기" onClick={() => router.back()} className="size-7">
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
