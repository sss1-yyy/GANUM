import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { MenuScreen } from "./MenuScreen";

export function MenuPage() {
  return (
    <div className="bg-surface relative h-dvh">
      <ScreenFrame tabBar className="gap-6">
        <MenuScreen />
      </ScreenFrame>
    </div>
  );
}
