"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { StaticImageData } from "next/image";
import { cn } from "@/shared/lib/cn";
import assetsIcon from "./assets/tabs/assets.png";
import benefitsIcon from "./assets/tabs/benefits.png";
import homeIcon from "./assets/tabs/home.png";
import investIcon from "./assets/tabs/invest.png";
import menuIcon from "./assets/tabs/menu.png";

interface Tab {
  label: string;
  href: string;
  icon: StaticImageData;
  /** 이 주소로 시작하는 화면에서 선택된 탭으로 보여줘요 */
  paths: string[];
}

const TABS: Tab[] = [
  { label: "홈", href: "/home", icon: homeIcon, paths: ["/home"] },
  { label: "내 자산", href: "/assets", icon: assetsIcon, paths: ["/assets"] },
  {
    label: "투자",
    href: "/invest",
    icon: investIcon,
    paths: ["/invest", "/portfolio", "/report", "/simulation"],
  },
  { label: "혜택", href: "/benefits", icon: benefitsIcon, paths: ["/benefits"] },
  { label: "전체", href: "/menu", icon: menuIcon, paths: ["/menu"] },
];

const isUnder = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(`${path}/`);

/**
 * Figma 하단 탭바(홈·내 자산·투자·혜택·전체). 선택된 탭은 현재 주소로 정하고 보라색으로 보여줘요.
 * 아이콘은 Figma 와 같이 모양(마스크) 이미지에 글자색을 칠해서 그려요.
 */
export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="하단 메뉴"
      className="bg-surface flex shrink-0 items-start justify-between px-8 pt-[9px] pb-[23px]"
    >
      {TABS.map((tab) => {
        const active = tab.paths.some((path) => isUnder(pathname, path));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn("flex flex-col items-center", active ? "text-primary" : "text-text-sub")}
          >
            <span
              aria-hidden
              className="size-7 bg-current"
              style={{
                maskImage: `url(${tab.icon.src})`,
                maskSize: "28px 28px",
                maskRepeat: "no-repeat",
              }}
            />
            <span className="text-caption leading-[19px] font-medium tracking-[-0.3px]">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
