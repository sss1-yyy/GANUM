import { MenuScreen } from "./MenuScreen";
import { MenuBottomNav } from "./MenuBottomNav";

export function MenuPage() {
  return (
    <div className="bg-surface relative flex h-dvh flex-col overflow-hidden">
      {/* 전체 메뉴 콘텐츠 */}
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        <MenuScreen />
      </div>

      {/* AI 챗봇 버튼 - 공통 기능 연결 전 */}
      <div className="absolute right-5 bottom-[80px] z-10">
        <button
          type="button"
          disabled
          title="AI 채팅 연결 예정"
          className="bg-primary text-surface flex h-12 w-12 items-center justify-center rounded-full font-semibold shadow-lg"
        >
          AI
        </button>
      </div>

      {/* Figma 원본 SVG 하단바 */}
      <MenuBottomNav />
    </div>
  );
}
