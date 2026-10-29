// AI 제공 연습 틀. ____ 한 곳은 학생이 선택·수정할 자리다.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export function classifyResult(result) {
  if (result.success) return '경로 찾음';
  const fieldName = 'reason'; // success 또는 reason 중 실패 이유가 담긴 필드 이름을 선택한다.
  const failureCode = result[fieldName];
  if (failureCode === 'BUDGET_EXCEEDED') return '예산 제한으로 아직 길의 유무를 모름';
  if (failureCode === 'UNREACHABLE') return '현재 지도와 이동 규칙에서 길이 없음';
  return '아직 분류하지 않음';
}

export async function loadCases() {
  const read = async name => JSON.parse(await readFile(
    new URL('../data/failure-semantics/' + name, import.meta.url), 'utf8'));
  const disconnected = await read('unreachable-goal-run-01.json');
  const connected = await read('reachable-goal-budget-control-run-01.json');
  const pick = (data, budget) => {
    const result = data.trials.find(trial => trial.budget === budget)?.results.astar;
    if (!result) throw new Error('기존 실험에서 해당 예산의 A* 결과를 찾지 못했습니다.');
    return result;
  };
  return [
    {map: '목표가 고립된 지도', budget: 2, result: pick(disconnected, 2)},
    {map: '목표에 연결된 지도', budget: 2, result: pick(connected, 2)},
    {map: '목표가 고립된 지도', budget: 300, result: pick(disconnected, 300)},
    {map: '목표에 연결된 지도', budget: 300, result: pick(connected, 300)}
  ];
}

async function main() {
  const cases = await loadCases();
  console.log('기존 원시 데이터 4개를 읽는 분류 연습입니다. 새로운 탐색 실험은 실행하지 않습니다.');
  console.table(cases.map(({map, budget, result}) => ({
    지도: map, 예산: budget, success: result.success, reason: result.reason,
    분류: classifyResult(result)
  })));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
