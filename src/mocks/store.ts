/**
 * 목 서버의 "DB" 역할을 하는 메모리 저장소입니다.
 * - 새로고침하면 처음 상태로 돌아옵니다.
 * - 개발 중 코드가 핫 리로드되어도 값이 유지되도록 globalThis 에 보관합니다.
 */
type StoreMap = Map<string, unknown>;

const globalKey = "__ganumMockStore__";

function getStoreMap(): StoreMap {
  const g = globalThis as typeof globalThis & { [globalKey]?: StoreMap };
  if (!g[globalKey]) g[globalKey] = new Map();
  return g[globalKey];
}

/** key 로 상태를 가져오고, 없으면 init() 으로 만듭니다. 기능별로 고유한 key 를 쓰세요. 예: "paper" */
export function mockState<T>(key: string, init: () => T): T {
  const map = getStoreMap();
  if (!map.has(key)) map.set(key, init());
  return map.get(key) as T;
}

/** 모든 목 상태를 초기화합니다. (테스트에서 사용) */
export function resetMockState(): void {
  getStoreMap().clear();
}

let idCounter = 0;
/** order_1, report_2 처럼 사람이 읽기 쉬운 임시 ID */
export function nextMockId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
}
