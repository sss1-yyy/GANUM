"use client";

import Link from "next/link";
import { isApiError } from "@/shared/api";
import { remainingRuns } from "@/shared/api/endpoints";
import { useMenuOverview } from "../hooks/use-menu-overview";
import { TopBar } from "@/components/layout/TopBar";

interface MenuItem {
  label: string;
  href?: string;
  value?: string;
}

type MenuOverview = ReturnType<typeof useMenuOverview>;

/** Figma design의 "전체 탭 · 메뉴"(540-1432)를 기준으로 한 화면이에요. */
export function MenuScreen() {
  const overview = useMenuOverview();
  const profileLabel = overview.profile.data?.typeLabel;
  const usage = overview.usage.data;
  const planLabel = usage ? (usage.plan === "FREE" ? "무료 플랜" : "유료 플랜") : undefined;
  const remainingLabel = usage ? `시뮬레이션 ${remainingRuns(usage, "SIMULATION")}회` : undefined;
  const sections: Array<{ title: string; items: MenuItem[] }> = [
    {
      title: "내 금융 정보",
      items: [
        { label: "재정 정보 관리", href: "/mypage/finance" },
        { label: "금융 목표 관리", href: "/mypage/goal" },
        { label: "금융 성향 진단 · 다시 진단", href: "/diagnosis", value: profileLabel },
      ],
    },
    {
      title: "투자와 분석",
      items: [
        { label: "모의투자", href: "/invest" },
        { label: "투자 기록", href: "/mypage/orders" },
        { label: "내 레포트", href: "/report" },
        { label: "시뮬레이션", href: "/simulation" },
        { label: "관심 종목" },
      ],
    },
    {
      title: "이용 관리",
      items: [
        { label: "이용권 · 구독", href: "/mypage/usage", value: planLabel },
        { label: "남은 이용 횟수", href: "/mypage/usage", value: remainingLabel },
        { label: "이용 내역" },
      ],
    },
    {
      title: "설정 및 도움말",
      items: [
        { label: "알림 설정" },
        { label: "개인정보 · 데이터 관리" },
        { label: "FAQ · 문의" },
        { label: "약관 및 정책" },
      ],
    },
  ];

  return (
    <div className="bg-surface min-h-dvh">
      <TopBar />
      <main className="flex flex-col gap-6 px-8 pt-2.5 pb-10">
        <h1 className="text-title text-text-strong font-semibold">전체</h1>
        <MenuUserCard overview={overview} planLabel={planLabel} />
        <nav aria-label="전체 메뉴" className="flex flex-col gap-6">
          {sections.map((section, index) => (
            <MenuSection
              key={section.title}
              title={section.title}
              items={section.items}
              headingId={`menu-section-${index}`}
            />
          ))}
        </nav>
        <div className="text-caption text-text-sub flex items-center justify-center gap-4 py-2">
          <span>로그아웃</span>
          <span>탈퇴하기</span>
        </div>
      </main>
    </div>
  );
}

function MenuUserCard({ overview, planLabel }: { overview: MenuOverview; planLabel?: string }) {
  const { user, profile, usage } = overview;

  return (
    <section
      aria-label="내 정보"
      aria-busy={user.isPending}
      className="rounded-card bg-surface shadow-card flex flex-col gap-6 px-[18px] py-5"
    >
      <div className="flex min-h-14 items-center gap-3">
        <div className="bg-sub text-primary flex size-14 shrink-0 items-center justify-center rounded-full">
          <svg
            aria-hidden="true"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          >
            <path d="M4 6h4l2-2h4l2 2h4v14H4Z" />
            <circle cx="12" cy="12.5" r="3.5" />
          </svg>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {user.isPending ? (
            <p role="status" className="text-caption text-text-sub">
              사용자 정보를 불러오고 있어요.
            </p>
          ) : user.isError && !user.data ? (
            <UserError query={user} />
          ) : user.data ? (
            <>
              <p className="text-subtitle text-text-strong font-semibold [overflow-wrap:anywhere]">
                {user.data.nickname}님
              </p>
              <p className="text-caption text-text-sub">프로필 · 계정 관리</p>
            </>
          ) : null}
        </div>
        <ChevronRight />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SummaryTile
          label="나의 금융 성향"
          value={profile.data?.typeLabel ?? "아직 진단 전"}
          pending={profile.isPending}
          failed={profile.isError}
          retrying={profile.isFetching}
          onRetry={() => void profile.refetch()}
        />
        <SummaryTile
          label="이용 중인 플랜"
          value={planLabel}
          pending={usage.isPending}
          failed={usage.isError}
          retrying={usage.isFetching}
          onRetry={() => void usage.refetch()}
        />
      </div>
    </section>
  );
}

function UserError({ query }: { query: MenuOverview["user"] }) {
  const requiresLogin = isApiError(query.error) && query.error.isAuthError;

  return (
    <div className="flex flex-col items-start gap-2">
      <p role="alert" className="text-caption text-danger">
        {requiresLogin ? "로그인이 필요해요." : "사용자 정보를 불러오지 못했어요."}
      </p>
      {requiresLogin ? (
        <Link href="/login" className="text-caption text-primary inline-flex min-h-11 items-center">
          로그인 화면으로
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
          className="min-h-11 disabled:opacity-60"
        >
          <span className="text-caption text-primary font-semibold">
            {query.isFetching ? "불러오는 중…" : "다시 불러오기"}
          </span>
        </button>
      )}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  pending,
  failed,
  retrying,
  onRetry,
}: {
  label: string;
  value?: string;
  pending: boolean;
  failed: boolean;
  retrying: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-card bg-bg flex min-w-0 flex-col gap-1 px-4 py-3">
      <p className="text-caption text-text-sub">{label}</p>
      {pending ? (
        <p role="status" className="text-caption text-text-sub">
          불러오는 중…
        </p>
      ) : failed ? (
        <div>
          <p role="alert" className="text-caption text-danger">
            조회하지 못했어요.
          </p>
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="min-h-11 disabled:opacity-60"
          >
            <span className="text-caption text-primary">
              {retrying ? "불러오는 중…" : "다시 불러오기"}
            </span>
          </button>
        </div>
      ) : (
        <p className="text-caption text-primary font-semibold [overflow-wrap:anywhere]">{value}</p>
      )}
    </div>
  );
}

function MenuSection({
  title,
  items,
  headingId,
}: {
  title: string;
  items: MenuItem[];
  headingId: string;
}) {
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h2 id={headingId} className="text-caption text-text-sub font-medium">
        {title}
      </h2>
      <ul className="rounded-card bg-surface shadow-card px-[18px]">
        {items.map((item, index) => (
          <li key={item.label} className={index > 0 ? "border-line border-t" : undefined}>
            {item.href ? (
              <Link
                href={item.href}
                className="hover:bg-sub/40 focus-visible:bg-sub/40 flex min-h-[52px] items-center justify-between gap-2 rounded-lg py-3.5 transition-colors motion-reduce:transition-none"
              >
                <span className="text-text min-w-0 text-sm font-medium">{item.label}</span>
                <span className="flex min-w-0 shrink-0 items-center gap-2">
                  {item.value && (
                    <span className="text-caption text-primary text-right">{item.value}</span>
                  )}
                  <ChevronRight />
                </span>
              </Link>
            ) : (
              <div
                aria-disabled="true"
                className="flex min-h-[52px] items-center justify-between gap-3 py-3.5"
              >
                <span className="text-text min-w-0 text-sm font-medium">{item.label}</span>
                <ChevronRight />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ChevronRight() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-text-sub shrink-0"
    >
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}
