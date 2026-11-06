"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ganumLogo from "@/components/layout/assets/ganum-logo.png";
import { startKakaoLogin } from "../api";
import characterBalanced from "../assets/character-balanced.svg";
import characterBold from "../assets/character-bold.svg";
import characterCautious from "../assets/character-cautious.png";
import characterFree from "../assets/character-free.png";
import kakao from "../assets/kakao.svg";

/** 로그인 화면. 카카오로 시작하면 홈으로 가요 */
export function LoginScreen() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    setPending(true);
    setError(null);
    try {
      await startKakaoLogin();
      // 로그인 화면으로 다시 돌아오지 않도록 기록을 바꿔요
      router.replace("/home");
    } catch {
      setError("지금은 로그인할 수 없어요. 잠시 후 다시 시도해 주세요.");
      setPending(false);
    }
  };

  return (
    // Figma 배경 그라데이션 색. 토큰에 없어 직접 써요 (AGENTS.md 색 규칙 예외: 랜딩·로그인 전용 장식)
    <main className="flex min-h-dvh flex-col bg-linear-[150deg] from-[#f1eeff] from-5% to-white to-70% px-8 pt-[241px] pb-[50px]">
      {/* Figma 로고 이미지가 여백을 포함하고 있어서 상단 바와 같은 비율로 잘라 보여줘요 */}
      <h1 className="relative mx-auto h-[43px] w-[201px] overflow-hidden">
        <Image
          src={ganumLogo}
          alt="GANUM"
          priority
          className="absolute top-[-61.11%] left-[-11.8%] h-[227.78%] w-[121.32%] max-w-none"
        />
      </h1>

      {/* 캐릭터 줄(장식). Figma 393px 화면 기준 위치 그대로, 화면 가운데에 맞춰요 */}
      <div aria-hidden className="relative -mx-8 mt-4 h-[72px]">
        <div className="absolute top-0 left-1/2 h-full w-[393px] -translate-x-1/2">
          <Image src={characterBold} alt="" className="absolute top-1 left-[57px]" />
          <Image src={characterBalanced} alt="" className="absolute top-1 left-[129px]" />
          <Image
            src={characterCautious}
            alt=""
            className="absolute top-0 left-[201px] size-[72px]"
          />
          <Image
            src={characterFree}
            alt=""
            className="absolute top-1 left-[273px] size-[63.64px]"
          />
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        {error && (
          <p role="alert" className="text-caption text-danger text-center">
            {error}
          </p>
        )}
        {/* 카카오 버튼 색(노랑·갈색)은 카카오 로그인 버튼 고유 색이라 직접 써요 (AGENTS.md 색 규칙 예외) */}
        <button
          type="button"
          onClick={login}
          disabled={pending}
          className="rounded-button flex h-[60px] w-full items-center justify-center gap-3 bg-[#ffe812] disabled:opacity-60"
        >
          <Image src={kakao} alt="" />
          {/* globals.css 의 button { font: inherit } 가 유틸리티보다 우선이라 글자 스타일은 span 에 줘요 */}
          <span className="text-[18px] leading-[26px] font-semibold text-[#381f1f]">
            카카오로 시작하기
          </span>
        </button>
      </div>
    </main>
  );
}
