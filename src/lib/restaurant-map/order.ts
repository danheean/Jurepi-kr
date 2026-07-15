import type { Place } from './schema';
import { CURATOR_ENUM } from './schema';

/**
 * 큐레이터 추천순 (위치가 없을 때의 기본 정렬).
 *
 * 각 큐레이터(nuclear·dragon·honey)의 대표(먼저 작성한) 맛집이 상단에 번갈아
 * 오도록 큐레이터 단위로 라운드로빈 인터리브한다. 한 리스트가 상단을 독식하던
 * 임의(작성) 순서를 대체해, 첫 화면이 여러 큐레이터의 대표를 고루 보여준다.
 *
 * 큐레이터 노출 순서는 `CURATOR_ENUM` 순(nuclear→dragon→honey); 각 큐레이터
 * 내부의 리스트·장소 순서(입력 순서)는 그대로 보존한다. 위치가 있으면 호출부가
 * 가까운순으로 대체하므로 이 함수는 무위치 브라우즈 뷰에만 쓰인다.
 *
 * 순수·불변(새 배열 반환).
 */
export function recommendedOrder(places: readonly Place[]): Place[] {
  if (places.length === 0) return [];

  // Group by curator, preserving each curator's authoring order.
  const groups = new Map<string, Place[]>();
  for (const place of places) {
    const key = place.curator ?? '';
    const bucket = groups.get(key);
    if (bucket) bucket.push(place);
    else groups.set(key, [place]);
  }

  // Emission order: known curators in CURATOR_ENUM order, then any others
  // (e.g. missing curator) by first appearance.
  const knownKeys = CURATOR_ENUM.filter((c) => groups.has(c));
  const otherKeys = [...groups.keys()].filter(
    (k) => !(CURATOR_ENUM as readonly string[]).includes(k)
  );
  const queues = [...knownKeys, ...otherKeys].map((k) => groups.get(k)!);

  // Round-robin: nth place of each curator, in curator order, until all drained.
  const result: Place[] = [];
  for (let i = 0; result.length < places.length; i++) {
    for (const queue of queues) {
      if (i < queue.length) result.push(queue[i]);
    }
  }
  return result;
}
