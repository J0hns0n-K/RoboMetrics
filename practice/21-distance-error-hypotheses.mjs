// AI-authored teaching exercise. All example values below are fictional.
// No motor commands, robot connection, physical measurements or calibration fit.
const illustrativeCommandCm = 30;
const illustrativeResponseCm = 29;

// Student task: change only this 30 to 60, then save.
const probeCommandCm = 60;

if (!Number.isFinite(probeCommandCm) || probeCommandCm <= 0) {
  throw new RangeError('Use a finite positive hypothetical command distance.');
}
const offsetCm = illustrativeResponseCm - illustrativeCommandCm;
const scale = illustrativeResponseCm / illustrativeCommandCm;

export const exercise = {
  dataClass:'AI_FICTIONAL_VALUES_NOT_PHYSICAL_DATA',
  illustrativeCommandCm, illustrativeResponseCm, probeCommandCm,
  explanation:'Two assumed rules pass through the same invented example; neither is established for a robot.'
};
export const predictions = [
  {hypothesis:'CONSTANT_OFFSET',commandCm:probeCommandCm,predictedResponseCm:probeCommandCm+offsetCm},
  {hypothesis:'PROPORTIONAL_SCALE',commandCm:probeCommandCm,predictedResponseCm:probeCommandCm*scale}
];
console.log('설명용 가상값입니다. 실제 로봇 측정값이 아닙니다.');
console.log('30cm 명령에 29cm라는 가상 예시를 설명하는 두 가정을 비교합니다.');
console.table(predictions);
