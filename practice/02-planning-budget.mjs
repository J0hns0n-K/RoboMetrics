// AI가 제공한 실험 실행 예제. 길찾기 함수는 기존 참고 코드를 사용한다.
import {makeMap, plan, verifyPath} from '../src/core.mjs';

// 이번에 직접 바꿀 숫자: 컴퓨터가 검토할 수 있는 칸 수
const budget = 8;

// 가운데 칸만 막힌 3×3 지도. 출발점은 왼쪽 위, 도착점은 오른쪽 아래.
const map = makeMap(3, 3, [[1, 1]]);

console.log('검토 예산:', budget, '칸 (출발점과 도착점도 포함)');
for (const [algorithm, name] of [['astar', 'A*'], ['greedy', 'Greedy']]) {
  const result = plan(map, algorithm, budget);
  if (result.success && !verifyPath(map, result.path)) {
    throw new Error('반환된 경로가 지도와 맞지 않습니다.');
  }
  console.log(name, result.success ? '길 찾기 성공' : `길 찾기 실패 (${result.reason})`);
  console.log('  이동 횟수:', result.pathLength ?? '성공한 경로 없음');
  console.log('  실제 검토한 칸 수:', result.expanded);
}
