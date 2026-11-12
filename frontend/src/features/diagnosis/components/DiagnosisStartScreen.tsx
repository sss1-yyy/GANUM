import Image from "next/image";
import Link from "next/link";
import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { cn } from "@/shared/lib/cn";
import { BOTTOM_CTA_SLOT, TYPE_ORDER, TYPE_VIEW, ctaClass } from "../labels";

const CHIPS = ["8문항", "약 1분", "정답 없음"];

/** 투자 성향 진단 시작. 네 가지 성향을 소개하고 문항으로 넘어가요 */
export function DiagnosisStartScreen() {
  return (
    <ScreenFrame tabBar>
      <h1 className="text-title text-text-strong mt-[34px] leading-8 font-bold">
        나와 닮은 <span className="text-primary">투자 캐릭터</span>는?
      </h1>
      <p className="text-subtitle text-text-sub mt-[11px] leading-6 font-medium">
        8가지 질문으로 나의 투자 성향을 알아봐요
      </p>
      <ul className="mt-[11px] flex gap-1.5">
        {CHIPS.map((chip) => (
          <li
            key={chip}
            className="bg-sub text-caption text-primary rounded-[16px] px-4 py-[7px] font-semibold"
          >
            {chip}
          </li>
        ))}
      </ul>

      <ul className="mt-6 flex flex-col gap-4">
        {TYPE_ORDER.map((type) => {
          const view = TYPE_VIEW[type];
          return (
            <li
              key={type}
              className={cn(
                "rounded-card flex h-[85px] shrink-0 items-center gap-3 pl-2.5",
                view.cardClass,
              )}
            >
              <span className="flex size-[65px] items-center justify-center">
                <Image
                  src={view.character}
                  alt=""
                  className={type === "FREE" ? "size-[70px] max-w-none" : "size-[65px]"}
                />
              </span>
              <span className="text-subtitle flex flex-col">
                <span className="text-text-strong font-semibold">{view.label}</span>
                <span className="text-text-sub leading-6">{view.tagline}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <div className={BOTTOM_CTA_SLOT}>
        <Link href="/diagnosis/quiz" className={ctaClass()}>
          시작하기
        </Link>
      </div>
    </ScreenFrame>
  );
}
