/** 시뮬레이션 화면에서 쓰는 날짜 계산 (모두 "YYYY-MM-DD" 문자열, UTC 기준) */

function parts(date: string): [number, number, number] {
  const [y, m, d] = date.split("-").map(Number);
  return [y, m, d];
}

function toDate(y: number, m: number, d: number): string {
  return new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10);
}

/** n달 전/후. 그 달에 없는 날(예: 3월 31일 → 2월)은 그 달 말일로 맞춰요 */
export function shiftMonths(date: string, months: number): string {
  const [y, m, d] = parts(date);
  const last = daysInMonth(y, m + months);
  return toDate(y, m + months, Math.min(d, last));
}

/** month 는 1~12 (범위를 넘으면 앞뒤 해로 넘어가요) */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** 그 달 1일의 요일 (0 = 일요일) */
export function firstWeekday(year: number, month: number): number {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
}

export function dateOf(year: number, month: number, day: number): string {
  return toDate(year, month, day);
}

export function yearMonthOf(date: string): { year: number; month: number } {
  const [year, month] = parts(date);
  return { year, month };
}
