/** 화면에 숫자·날짜를 보여줄 때 쓰는 공통 함수입니다. 직접 toLocaleString 등을 쓰지 말고 여기 것을 사용하세요. */

const KRW = new Intl.NumberFormat("ko-KR");

/** 1234567 → "1,234,567" */
export function formatNumber(value: number): string {
  return KRW.format(value);
}

/** 1234567 → "1,234,567원" */
export function formatKRW(value: number): string {
  return `${formatNumber(value)}원`;
}

/**
 * 만 원 단위로 줄여서 보여줍니다. 400000 → "40만 원", 12000000 → "1,200만 원", 5000 → "5,000원"
 * 만 원으로 딱 떨어지지 않는 금액은 원 단위로 그대로 보여줍니다.
 */
export function formatManWon(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10_000 && abs % 10_000 === 0) {
    return `${formatNumber(abs / 10_000)}만 원`;
  }
  return formatKRW(abs);
}

export type ChangeTone = "up" | "down" | "flat";

export function changeTone(value: number | null | undefined): ChangeTone {
  if (value === null || value === undefined || value === 0) return "flat";
  return value > 0 ? "up" : "down";
}

/** 12.5 → "12.5%". 소수 첫째 자리까지 표시 */
export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`;
}

/** 부호 포함. 1.3 → "+1.3%", -4.6 → "-4.6%", 0 → "0.0%" */
export function formatSignedPercent(value: number | null | undefined, fractionDigits = 1): string {
  if (value === null || value === undefined) return "-";
  const text = Math.abs(value).toFixed(fractionDigits);
  if (value > 0) return `+${text}%`;
  if (value < 0) return `-${text}%`;
  return `${text}%`;
}

/** ▲ 1.5% / ▼ 0.6% 형태 (Figma 포트폴리오·자산 화면) */
export function formatArrowPercent(value: number, fractionDigits = 1): string {
  const text = `${Math.abs(value).toFixed(fractionDigits)}%`;
  if (value > 0) return `▲ ${text}`;
  if (value < 0) return `▼ ${text}`;
  return text;
}

/** 부호 포함 금액. 240000 → "+240,000원" */
export function formatSignedKRW(value: number): string {
  if (value > 0) return `+${formatKRW(value)}`;
  if (value < 0) return `-${formatKRW(Math.abs(value))}`;
  return formatKRW(0);
}

/** "2026-10-08" 또는 RFC3339 → "10월 8일" */
export function formatMonthDay(date: string): string {
  const parts = parseDateParts(date);
  return `${parts.month}월 ${parts.day}일`;
}

/** "2026-08-15" → "2026.08.15" */
export function formatDotDate(date: string): string {
  const parts = parseDateParts(date);
  return `${parts.year}.${String(parts.month).padStart(2, "0")}.${String(parts.day).padStart(2, "0")}`;
}

function parseDateParts(date: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!match) throw new Error(`날짜 형식이 올바르지 않아요: ${date}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

/** 기준일(today)부터 마감일까지 남은 일수. 마감 지났으면 음수 */
export function daysUntil(deadline: string, today: string): number {
  const a = parseDateParts(deadline);
  const b = parseDateParts(today);
  const ms = Date.UTC(a.year, a.month - 1, a.day) - Date.UTC(b.year, b.month - 1, b.day);
  return Math.round(ms / 86_400_000);
}

/** 12 → "D-12", 0 → "D-DAY", -1 → "마감" */
export function formatDDay(days: number): string {
  if (days < 0) return "마감";
  if (days === 0) return "D-DAY";
  return `D-${days}`;
}
