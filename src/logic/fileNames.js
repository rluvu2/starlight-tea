/** 표정 변화 그림의 파일명: "bear_tired.png" → "bear_tired_happy.png" (확장자가 없으면 끝에 _happy) */
export function happyFileName(file) {
  const name = String(file);
  const dot = name.lastIndexOf('.');
  return dot > 0 ? `${name.slice(0, dot)}_happy${name.slice(dot)}` : `${name}_happy`;
}
