import type { StaticImageData } from "next/image";
import { cn } from "@/shared/lib/cn";
import type { InvestmentType } from "@/shared/types";
import characterBalanced from "./assets/character-balanced.svg";
import characterBold from "./assets/character-bold.svg";
import characterCautious from "./assets/character-cautious.png";
import characterFree from "./assets/character-free.png";

/** 시작 화면에 보여주는 순서 (Figma) */
export const TYPE_ORDER: InvestmentType[] = ["CAUTIOUS", "BALANCED", "BOLD", "FREE"];

/**
 * 성향별 화면 정보 (Figma 진단 시작·결과 화면). API 는 성향 이름·설명·가이드만 주고,
 * 캐릭터·한 줄 소개·태그·색은 화면이 정해요.
 * 카드 색(cardClass)은 Figma 성향 색이라 토큰에 없어 직접 써요 (AGENTS.md 색 규칙 예외).
 */
export const TYPE_VIEW: Record<
  InvestmentType,
  {
    label: string;
    character: StaticImageData;
    tagline: string;
    tags: [string, string];
    cardClass: string;
    resultClass: string;
  }
> = {
  CAUTIOUS: {
    label: "신중형",
    character: characterCautious,
    tagline: "안정이 우선이에요",
    tags: ["안정/보존 중시", "검증된 방법 선호"],
    cardClass: "bg-[#e3eeff]",
    resultClass: "from-[#e3eeff]",
  },
  BALANCED: {
    label: "균형형",
    character: characterBalanced,
    tagline: "안정과 수익의 균형이에요",
    tags: ["안정과 성장 사이", "계획으로 균형 맞춰요"],
    cardClass: "bg-[#dcf7f1]",
    resultClass: "from-[#dcf7f1]",
  },
  BOLD: {
    label: "도전형",
    character: characterBold,
    tagline: "더 높은 수익을 추구해요",
    tags: ["투자/성장 중시", "새로운 방법 선호"],
    cardClass: "bg-[#fff4d6]",
    resultClass: "from-[#fff4d7]",
  },
  FREE: {
    label: "자유형",
    character: characterFree,
    tagline: "유연하게 생각해요",
    tags: ["한쪽에 기울어도 걱정 없음", "상황에 따라 유연하게"],
    cardClass: "bg-sub",
    resultClass: "from-sub",
  },
};

/** 화면 맨 아래 큰 버튼 모양 (primary: 보라, secondary: 연보라). Link·button 모두에 써요 */
export function ctaClass(variant: "primary" | "secondary" = "primary"): string {
  return cn(
    "rounded-button flex h-[60px] w-full shrink-0 items-center justify-center text-[18px] leading-[26px] font-semibold disabled:bg-line disabled:text-text-muted",
    variant === "primary" ? "bg-primary text-surface" : "bg-sub text-primary",
  );
}
