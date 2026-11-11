import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { MenuScreen } from "./MenuScreen";

export function MenuPage() {
  return (
    <div className="bg-surface relative h-dvh">
      <ScreenFrame tabBar className="gap-6">
        <MenuScreen />
      </ScreenFrame>

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
    </div>
  );
}
