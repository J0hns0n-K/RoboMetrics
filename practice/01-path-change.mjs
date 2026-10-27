// AI가 제공한 연습용 코드. 직접 수정한 부분은 이후 Git 차이로 확인한다.
// 계산 방법: 바뀐 거리(after) - 원래 거리(before)

function pathChange(before, after) {
  return after - before;
}

const before = 8;
const after = 4;

const change = pathChange(before, after);
console.log('수정 전 이동 거리:', before);
console.log('수정 후 이동 거리:', after);
console.log('이동 거리 차이:', change);
