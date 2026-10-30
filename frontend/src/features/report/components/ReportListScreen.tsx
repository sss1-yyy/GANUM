"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isApiError } from "@/shared/api";
import { getUsage, remainingRuns } from "@/shared/api/endpoints";
import { sharedKeys } from "@/shared/api/query-keys";
import { formatMonthDay } from "@/shared/lib/format";
import { createReport, listReports, reportKeys } from "../api";
import character from "../assets/character.svg";
import chevronRight from "../assets/chevron-right.svg";
import { pendingStatusLabel } from "../labels";
import type { ReportListItem } from "../types";
import { ReportScreenFrame } from "./ReportScreenFrame";

export function ReportListScreen() {
  return (
    <ReportScreenFrame className="gap-4">
      <h1 className="text-title text-text-strong font-semibold">내 레포트</h1>
      <NewReportHero />
      <PreviousReports />
      <p className="text-caption text-text-sub py-8 text-center leading-[18px] font-light">
        정보를 바꾸면 새 레포트를 받을 수 있어요.
        <br />
        레포트는 참고용이며 특정 상품 가입을 권유하지 않아요.
      </p>
    </ReportScreenFrame>
  );
}

function NewReportHero() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const usage = useQuery({
    queryKey: sharedKeys.usage,
    queryFn: async () => (await getUsage()).data,
  });
  const remaining = usage.data ? remainingRuns(usage.data, "REPORT") : null;

  const create = useMutation({
    mutationFn: () => createReport("FINANCIAL"),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.list });
      void queryClient.invalidateQueries({ queryKey: sharedKeys.usage });
      router.push(`/report/${res.data.id}`);
    },
  });
  const error = create.error;

  return (
    <section className="flex flex-col gap-2">
      <div className="rounded-card from-primary to-primary-light relative flex flex-col gap-3.5 overflow-hidden bg-linear-128 from-2% to-76% px-[18px] py-5">
        <div className="text-surface flex flex-col gap-1.5">
          <span className="bg-surface/25 text-caption self-start rounded-xl px-3.5 py-1">
            AI 레포트
          </span>
          <p className="text-title leading-[30px] font-semibold">
            내 상황에 맞는 조언을
            <br />한 장으로 정리해 드려요
          </p>
          <p className="text-caption leading-[18px] font-light">
            {remaining !== null && `남은 이용 횟수 ${remaining}회 · `}입력한 재정 정보를 바탕으로
            만들어져요
          </p>
        </div>
        <button
          type="button"
          onClick={() => create.mutate()}
          disabled={create.isPending || remaining === 0}
          className="rounded-button bg-surface h-[52px] w-full disabled:opacity-60"
        >
          {/* globals.css 의 button { font: inherit } 가 유틸리티보다 우선이라 글자 스타일은 span 에 줘요 */}
          <span className="text-subtitle text-primary font-semibold">
            {create.isPending
              ? "요청하는 중…"
              : remaining === 0
                ? "이용권을 모두 썼어요"
                : "새 레포트 받기"}
          </span>
        </button>
        <div className="absolute top-[26px] right-[17px] h-[45px] w-[90px]">
          <Image
            src={character}
            alt=""
            className="absolute inset-x-0 top-[-7.39%] h-[114.78%] w-full"
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-caption text-danger px-1">
          {isApiError(error) ? error.message : "요청을 처리하지 못했어요."}
          {isApiError(error) && error.code === "PROFILE_INCOMPLETE" && (
            <Link href="/diagnosis" className="text-primary ml-1 font-semibold underline">
              진단하러 가기
            </Link>
          )}
        </p>
      )}
    </section>
  );
}

function PreviousReports() {
  const list = useQuery({
    queryKey: reportKeys.list,
    queryFn: async () => (await listReports()).data.items,
  });

  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-subtitle text-text-strong font-semibold">이전 레포트</h2>
      {list.isPending && (
        <p className="text-caption text-text-sub py-6 text-center">불러오는 중…</p>
      )}
      {list.isError && (
        <p role="alert" className="text-caption text-danger py-6 text-center">
          레포트 목록을 불러오지 못했어요.
        </p>
      )}
      {list.data?.length === 0 && (
        <p className="text-caption text-text-sub py-6 text-center">아직 받은 레포트가 없어요.</p>
      )}
      {list.data && list.data.length > 0 && (
        <ul className="flex flex-col gap-4">
          {list.data.map((item, index) => (
            <li key={item.id}>
              <ReportCard item={item} latest={index === 0} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ReportCard({ item, latest }: { item: ReportListItem; latest: boolean }) {
  const pending = pendingStatusLabel(item.status);
  const meta = [formatMonthDay(item.createdAt), latest && "최신", pending]
    .filter(Boolean)
    .join(" · ");
  return (
    <Link
      href={`/report/${item.id}`}
      className="rounded-card bg-surface shadow-card flex min-h-[100px] items-center gap-3 px-[18px] py-5"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-caption text-text-sub font-medium">{meta}</p>
        <p className="text-subtitle text-text-strong leading-6 font-semibold text-balance">
          {item.headlines[0] || "새 레포트"}
        </p>
      </div>
      <Image src={chevronRight} alt="" width={16} height={16} />
    </Link>
  );
}
