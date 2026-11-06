/**
 * Vitest 실행 스크립트 (npm run test / test:watch)
 *
 * Windows 에서 터미널 경로가 소문자 c:\ 로 열리면(VS Code 기본),
 * Vitest 가 같은 파일을 c:\ 와 C:\ 두 경로로 두 번 불러와서 테스트가 모두 실패해요.
 * 그래서 경로를 실제 대소문자(C:\)로 맞춘 뒤 Vitest 를 실행해요. (이슈 #60)
 */
import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// 이 파일(frontend/scripts)의 한 단계 위 = frontend 폴더. 어느 폴더에서 실행해도 같은 곳을 가리켜요
const cwd = realpathSync.native(fileURLToPath(new URL("..", import.meta.url)));
const vitest = realpathSync.native(join(cwd, "node_modules/vitest/vitest.mjs"));

const result = spawnSync(process.execPath, [vitest, ...process.argv.slice(2)], {
  cwd,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
