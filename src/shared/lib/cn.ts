/** 조건부 className 을 합치는 작은 도우미. cn("a", cond && "b") */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}
