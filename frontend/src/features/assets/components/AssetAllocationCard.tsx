import { USE_MOCK } from "@/shared/api/config";
import { formatPercent } from "@/shared/lib/format";
import type { AssetCategorySummary, AssetCategoryType } from "@/shared/types";

const categoryStyles: Record<AssetCategoryType, { label: string; color: string }> = {
  DEPOSIT: { label: "예적금", color: "var(--color-primary)" },
  STOCK: { label: "증권", color: "var(--color-primary-light)" },
  CASH: { label: "입출금", color: "var(--color-coach)" },
  CRYPTO: { label: "코인", color: "var(--color-sub)" },
  ETF: { label: "ETF", color: "var(--color-negative)" },
  OTHER: { label: "기타", color: "var(--color-outline)" },
};

export function AssetAllocationCard({ categories }: { categories: AssetCategorySummary[] }) {
  const items = categories.filter((category) => category.weightPercent > 0);
  const total = items.reduce((sum, category) => sum + category.weightPercent, 0);
  const segments = items.map(({ type, weightPercent }, index) => {
    const precedingWeight = items
      .slice(0, index)
      .reduce((sum, category) => sum + category.weightPercent, 0);
    const size = (weightPercent / total) * 100;
    const offset = (precedingWeight / total) * 100;
    return { type, weightPercent, size, offset };
  });

  return (
    <section className="rounded-card bg-surface shadow-card space-y-3 p-4">
      <h2 className="font-semibold">{USE_MOCK ? "[예시] 자산 배분" : "자산 배분"}</h2>

      {segments.length === 0 ? (
        <p className="text-caption text-text-sub">표시할 자산 배분이 없어요.</p>
      ) : (
        <div className="flex items-center gap-4">
          <svg aria-hidden="true" viewBox="0 0 100 100" className="size-24 shrink-0">
            {segments.map(({ type, size, offset }) => (
              <circle
                key={type}
                cx="50"
                cy="50"
                r="38"
                pathLength={100}
                fill="none"
                stroke={categoryStyles[type].color}
                strokeWidth="18"
                strokeDasharray={`${size} ${100 - size}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 50 50)"
              />
            ))}
          </svg>

          <ul className="text-caption flex-1 space-y-2">
            {segments.map(({ type, weightPercent }) => (
              <li key={type} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: categoryStyles[type].color }}
                />
                <span className="flex-1">{categoryStyles[type].label}</span>
                <span className="font-semibold">{formatPercent(weightPercent)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
