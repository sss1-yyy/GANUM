import Image from "next/image";
import samsungBg from "./assets/logos/samsung-bg.svg";
import samsungWordmark from "./assets/logos/samsung-wordmark.svg";
import skBg from "./assets/logos/sk-bg.svg";
import skMark1 from "./assets/logos/sk-mark-1.svg";
import skMark2 from "./assets/logos/sk-mark-2.svg";

/**
 * 종목 로고 (40px 원). API 에 로고가 없어서 Figma 에 그려진 4개 종목만 Figma 그대로 보여주고,
 * 나머지는 이름 첫 글자로 대신해요. 이름은 표기가 달라질 수 있어 종목 ID 로 골라요. (docs/figma-api-gaps.md)
 */
export function InstrumentLogo({ instrumentId, name }: { instrumentId: string; name: string }) {
  switch (instrumentId) {
    case "ins_000660":
      return (
        <span aria-hidden className="relative size-10 shrink-0 overflow-hidden rounded-full">
          <Image src={skBg} alt="" width={40} height={40} className="absolute inset-0" />
          <Image
            src={skMark1}
            alt=""
            width={29.253}
            height={22.203}
            className="absolute top-[7.09px] left-[5.71px] max-w-none"
          />
          <Image
            src={skMark2}
            alt=""
            width={20.534}
            height={16.47}
            className="absolute top-[4.29px] left-[17.19px] max-w-none"
          />
        </span>
      );
    case "ins_005930":
      return (
        <span aria-hidden className="relative size-10 shrink-0 overflow-hidden rounded-full">
          <Image src={samsungBg} alt="" width={40} height={40} className="absolute inset-0" />
          <Image
            src={samsungWordmark}
            alt=""
            width={33.571}
            height={5.481}
            className="absolute top-[17.14px] left-[3.57px] max-w-none"
          />
        </span>
      );
    case "ins_069500":
      return (
        // Figma KODEX 200 로고 색 (브랜드 색이라 토큰에 없음)
        <span
          aria-hidden
          className="text-surface flex size-10 shrink-0 flex-col items-center justify-center rounded-full bg-[#0057ff] text-center text-[11px] leading-none font-semibold"
        >
          <span>코스피</span>
          <span>200</span>
        </span>
      );
    case "ins_360750":
      return (
        // Figma TIGER 미국S&P500 로고 색 (브랜드 색이라 토큰에 없음)
        <span
          aria-hidden
          className="text-surface flex size-10 shrink-0 flex-col items-center justify-center rounded-full bg-[#f37321] text-center text-[11px] font-semibold"
        >
          <span>S&amp;P</span>
          <span>500</span>
        </span>
      );
    default:
      return (
        <span
          aria-hidden
          className="bg-sub text-primary flex size-10 shrink-0 items-center justify-center rounded-full text-[14px] font-bold"
        >
          {name.slice(0, 1)}
        </span>
      );
  }
}
