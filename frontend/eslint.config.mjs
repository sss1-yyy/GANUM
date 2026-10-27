import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * 폴더 경계 규칙 (충돌 방지의 핵심)
 *  - features/A 는 features/B 를 import 할 수 없어요. 둘이 같이 쓰는 것은 components/ 또는 shared/ 로 올립니다.
 *  - components/, shared/ 는 features/ 를 import 할 수 없어요.
 *  - features/ 는 app/ 을 import 할 수 없어요.
 *  - 목데이터 내부(@/mocks/*)는 src/mocks 와 각 기능의 mocks 폴더 안에서만 import 합니다.
 */
const FEATURES = [
  "home",
  "landing",
  "login",
  "diagnosis",
  "invest",
  "chat",
  "portfolio",
  "report",
  "simulation",
  "assets",
  "benefits",
  "mypage",
];

const featureBoundary = (feature) => ({
  files: [`src/features/${feature}/**/*.{ts,tsx}`],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: FEATURES.filter((other) => other !== feature).flatMap((other) => [
              `@/features/${other}`,
              `@/features/${other}/*`,
              `**/features/${other}`,
              `**/features/${other}/*`,
            ]),
            message:
              "다른 기능 폴더를 직접 가져올 수 없어요. 같이 쓰는 코드는 src/components 또는 src/shared 로 옮겨 주세요. (docs/conflict-avoidance.md)",
          },
          {
            group: ["@/app/*", "**/app/*"],
            message: "features 는 app 을 가져올 수 없어요. app 이 features 를 가져다 씁니다.",
          },
          {
            group: ["@/mocks", "@/mocks/*"],
            message:
              "기능 코드(mocks 폴더 밖)는 목데이터를 직접 가져올 수 없어요. API 함수(api.ts)만 사용하세요.",
          },
        ],
      },
    ],
  },
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...FEATURES.map(featureBoundary),
  // 각 기능의 mocks 폴더는 src/mocks 도구를 자유롭게 쓸 수 있어요 (위 규칙을 다시 풀어줌)
  {
    files: ["src/features/*/mocks/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    files: ["src/components/**/*.{ts,tsx}", "src/shared/**/*.{ts,tsx}"],
    ignores: ["src/shared/api/client.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*", "**/features/*"],
              message:
                "components / shared 는 features 를 가져올 수 없어요. 방향은 features → components/shared 입니다.",
            },
            {
              group: ["@/app/*", "**/app/*"],
              message: "components / shared 는 app 을 가져올 수 없어요.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "coverage/**"]),
]);

export default eslintConfig;
