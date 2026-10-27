/** 서버가 내려준 RFC3339 시각을 "10월 25일 09:00 기준" 처럼 보여줍니다. (meta.asOf 표시용) */
export function formatAsOf(asOf: string | null | undefined): string {
  if (!asOf) return "기준 시각 미확인";
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(asOf);
  if (!match) return "기준 시각 미확인";
  return `${Number(match[2])}월 ${Number(match[3])}일 ${match[4]}:${match[5]} 기준`;
}

/**
 * 화면에서 "오늘"이 필요할 때는 기기 시계 대신 서버가 알려준 기준 시각(meta.asOf)을 씁니다.
 * (목데이터 모드의 오늘은 2026-10-25 로 고정되어 있어서, 기기 시계를 쓰면 D-day 가 어긋납니다.)
 * asOf 가 없을 때만 기기의 오늘 날짜를 씁니다.
 */
export function referenceDate(asOf: string | null | undefined): string {
  const match = asOf ? /^(\d{4}-\d{2}-\d{2})/.exec(asOf) : null;
  if (match) return match[1];
  return new Date().toISOString().slice(0, 10);
}

/** "2026-10-25" 에서 n일 전/후 날짜 (YYYY-MM-DD) */
export function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
