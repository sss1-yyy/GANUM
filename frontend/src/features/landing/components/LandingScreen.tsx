import Image from "next/image";
import Link from "next/link";
import ganumLogo from "@/components/layout/assets/ganum-logo.png";
import { formatKRW } from "@/shared/lib/format";
import characterBalanced from "../assets/character-balanced.svg";
import characterBold from "../assets/character-bold.svg";
import characterCautious from "../assets/character-cautious.png";
import characterFree from "../assets/character-free.png";
import chevronRight from "../assets/chevron-right.svg";
import dotMint from "../assets/dot-mint.svg";
import dotPurple from "../assets/dot-purple.svg";
import dotYellow from "../assets/dot-yellow.svg";
import rings from "../assets/rings.svg";

/** 첫 화면. "시작하기"를 누르면 로그인으로 가요 */
export function LandingScreen() {
  return (
    // Figma 배경 그라데이션 색. 토큰에 없어 직접 써요 (AGENTS.md 색 규칙 예외: 랜딩 전용 장식)
    <main className="flex min-h-dvh flex-col bg-linear-[150deg] from-[#f1eeff] from-5% to-white to-70% px-8 pt-[17px] pb-[50px]">
      {/* Figma 로고 이미지가 여백을 포함하고 있어서 상단 바와 같은 비율로 잘라 보여줘요 */}
      <div className="relative h-[22px] w-[104px] overflow-hidden">
        <Image
          src={ganumLogo}
          alt="GANUM"
          priority
          className="absolute top-[-61.11%] left-[-11.8%] h-[227.78%] w-[121.32%] max-w-none"
        />
      </div>

      <Illustration />

      <h1 className="text-text-strong mt-[37px] text-[24px] leading-8 font-bold">
        내 자산과 투자 성향,
        <br />
        <span className="text-primary">한눈에 가늠</span>해보세요
      </h1>
      <p className="text-subtitle text-text-sub mt-3 leading-[22px] font-medium">
        어려운 금융 용어는 쉽게,
        <br />내 상황에는 딱 맞게 알려드려요.
      </p>

      <Link
        href="/login"
        className="rounded-button bg-primary text-surface mt-auto flex h-[60px] w-full items-center justify-center text-[18px] leading-[26px] font-semibold"
      >
        시작하기
      </Link>
    </main>
  );
}

/**
 * 캐릭터 일러스트(장식). Figma 393px 화면 기준 위치 그대로 배치하고, 화면 가운데에 맞춰요.
 * 카드·알림 칩은 그림의 일부라 누를 수 없고 스크린리더에서도 읽지 않아요.
 */
function Illustration() {
  return (
    <div aria-hidden className="relative -mx-8 mt-[47px] h-[301px]">
      <div className="absolute top-0 left-1/2 h-full w-[393px] -translate-x-1/2">
        <Image src={rings} alt="" className="absolute top-[17px] left-16" />
        <Image src={dotYellow} alt="" className="absolute top-[106px] left-[110px]" />
        <Image src={dotMint} alt="" className="absolute top-[21px] left-[176px]" />
        <Image src={dotPurple} alt="" className="absolute top-[140px] left-[299px]" />
        <Image src={characterBalanced} alt="" className="absolute top-[5px] left-[221px]" />
        <Image src={characterBold} alt="" className="absolute top-[85px] left-[132px]" />
        <Image
          src={characterCautious}
          alt=""
          className="absolute top-[172px] left-[52px] size-[97px]"
        />
        <Image
          src={characterFree}
          alt=""
          className="absolute top-[177px] left-[226px] size-[86px]"
        />

        <div className="rounded-card bg-surface shadow-card absolute top-0 left-8 flex h-[60px] w-[136px] flex-col justify-center px-4 font-bold">
          <span className="text-caption text-text-sub leading-[14px]">내 총 자산</span>
          <span className="text-subtitle text-text-strong leading-6">{formatKRW(2_100_000)}</span>
        </div>

        <div className="bg-primary shadow-card absolute top-[260px] left-[209px] flex h-[41px] w-[152px] items-center justify-between rounded-[24px] pr-0.5 pl-5">
          <span className="text-subtitle text-surface leading-6 font-semibold">
            금리가 내렸어요
          </span>
          <Image src={chevronRight} alt="" className="-scale-x-100" />
        </div>
      </div>
    </div>
  );
}
