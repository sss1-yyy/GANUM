import Image from "next/image";
import Link from "next/link";

import homeIcon from "../assets/icons/home.svg";
import assetsIcon from "../assets/icons/assets.svg";
import investIcon from "../assets/icons/invest.svg";
import benefitsIcon from "../assets/icons/benefits.svg";
import menuIcon from "../assets/icons/menu.svg";

const tabs = [
  { label: "홈", href: "/home", icon: homeIcon, width: 28 },
  { label: "내자산", href: "/assets", icon: assetsIcon, width: 34 },
  { label: "투자", href: "/invest", icon: investIcon, width: 28 },
  { label: "혜택", href: "/benefits", icon: benefitsIcon, width: 28 },
  { label: "전체", href: "/menu", icon: menuIcon, width: 28 },
];

export function MenuBottomNav() {
  return (
    <nav
      aria-label="하단 메뉴"
      className="z-10 grid h-16 shrink-0 grid-cols-5 border-t border-[#eeeeee] bg-white"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-label={tab.label}
          aria-current={tab.href === "/menu" ? "page" : undefined}
          className="flex items-center justify-center"
        >
          <Image src={tab.icon} alt="" width={tab.width} height={47} unoptimized />
        </Link>
      ))}
    </nav>
  );
}
