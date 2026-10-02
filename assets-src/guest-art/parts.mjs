// 별빛 찻집 손님 그림 공용 부품 (512×512, 기존 곰·양·다람쥐 그림과 같은 화풍)
export const SW = 6; // 바깥선 두께

const attrs = (o) => Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== false).map(([k, v]) => `${k}="${v}"`).join(' ');
export const path = (d, fill = 'none', stroke, sw = SW, extra = {}) =>
  `<path ${attrs({ d, fill, stroke, 'stroke-width': stroke ? sw : undefined, 'stroke-linejoin': stroke ? 'round' : undefined, 'stroke-linecap': stroke ? 'round' : undefined, ...extra })}/>`;
export const ell = (cx, cy, rx, ry, fill, stroke, sw = SW, extra = {}) =>
  `<ellipse ${attrs({ cx, cy, rx, ry, fill, stroke, 'stroke-width': stroke ? sw : undefined, ...extra })}/>`;
export const circ = (cx, cy, r, fill, stroke, sw = SW, extra = {}) => `<circle ${attrs({ cx, cy, r, fill, stroke, 'stroke-width': stroke ? sw : undefined, ...extra })}/>`;
export const line = (d, stroke, sw = 4, extra = {}) => path(d, 'none', stroke, sw, extra);
/** 왼쪽 반을 그리고 좌우 대칭으로 한 벌 더 */
export const pair = (svg) => `${svg}<g transform="translate(512 0) scale(-1 1)">${svg}</g>`;
export const group = (svg, transform) => `<g transform="${transform}">${svg}</g>`;

export const radial = (id, light, dark, cx = 0.42, cy = 0.35, r = 0.78) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></radialGradient>`;
export const linear = (id, top, bottom) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`;

export function svgDoc(title, defs, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- ${title} -->
  <defs>${defs}</defs>
${body}
</svg>
`;
}

/* ── 몸통 ───────────────────────────────────────────────────────── */
export const BODY = 'M 64 520 C 70 420 128 362 204 344 L 308 344 C 384 362 442 420 448 520 Z';
export const body = (gradId, stroke) => path(BODY, `url(#${gradId})`, stroke, SW);
export const chinShadow = (y = 338, rx = 74) => ell(256, y, rx, 14, '#000000', null, 0, { opacity: 0.17 });

// 둥근 목둘레(니트·티셔츠)
export const roundCollar = (fill, stroke) => path('M 184 346 Q 256 398 328 346 L 316 338 Q 256 382 196 338 Z', fill, stroke, 4);
// 목도리 (끝자락이 오른쪽 아래로)
export function scarf(fill, dark, stripe) {
  return [
    path('M 172 334 Q 256 384 340 334 L 348 360 Q 256 414 164 360 Z', fill, dark, 5),
    path('M 286 368 L 316 452 L 288 462 L 268 378 Z', fill, dark, 5),
    stripe ? line('M 278 398 L 302 390 M 284 420 L 308 412', stripe, 6) : '',
    stripe ? line('M 196 356 Q 200 372 206 382 M 236 368 Q 238 382 240 392', stripe, 6) : '',
  ].join('');
}
// 후드티 (모자 + 끈)
export function hoodie(hoodFill, stroke, string = '#FFF6E2') {
  return [
    path('M 164 356 Q 168 330 214 336 Q 256 378 298 336 Q 344 330 348 356 Q 312 402 256 402 Q 200 402 164 356 Z', hoodFill, stroke, 5),
    line('M 236 388 L 230 438 M 276 388 L 282 438', string, 5),
    circ(230, 442, 5, string, stroke, 2),
    circ(282, 442, 5, string, stroke, 2),
  ].join('');
}
// 셔츠 깃 + 단추
export function shirtCollar(fill = '#FFFDF8', stroke = '#C9C1B4', buttons = true) {
  return [
    path('M 208 342 L 250 354 L 232 382 Z', fill, stroke, 4),
    path('M 304 342 L 262 354 L 280 382 Z', fill, stroke, 4),
    buttons ? circ(256, 392, 5, stroke) + circ(256, 422, 5, stroke) : '',
  ].join('');
}
// 잠옷 (테두리 선 + 단추 + 별무늬)
export function pajama(piping, star = '#FFF3C4') {
  return [
    line('M 206 346 Q 228 400 256 418 Q 284 400 306 346', piping, 7),
    circ(256, 440, 6, piping),
    circ(256, 470, 6, piping),
    starShape(150, 420, 9, star),
    starShape(368, 404, 8, star),
    starShape(330, 470, 7, star),
  ].join('');
}
// 카디건 (V 자 앞섶 + 단추) — 안에는 셔츠
export function cardigan(edge, stroke) {
  return [
    path('M 204 344 L 256 446 L 308 344 Z', '#F4EFE6', '#CFC6B8', 4),
    shirtCollar('#FFFDF8', '#CFC6B8', false),
    line('M 204 346 L 256 450 L 308 346', edge, 9),
    circ(256, 474, 6, stroke),
  ].join('');
}
// 나비넥타이
export const bowtie = (fill, stroke, y = 356) =>
  path(`M 256 ${y} L 226 ${y - 14} Q 218 ${y} 226 ${y + 14} Z M 256 ${y} L 286 ${y - 14} Q 294 ${y} 286 ${y + 14} Z`, fill, stroke, 4) + circ(256, y, 7, fill, stroke, 4);
// 목걸이(이름표)
export const collarTag = (band, tag, stroke) => path('M 186 338 Q 256 378 326 338 L 330 352 Q 256 394 182 352 Z', band, stroke, 4) + circ(256, 386, 13, tag, stroke, 4) + circ(256, 386, 4, stroke);

/* ── 모자 ───────────────────────────────────────────────────────── */
export const hardHat = (fill, stroke) =>
  path('M 150 146 Q 152 66 256 62 Q 360 66 362 146 Z', fill, stroke, SW) + path('M 128 148 Q 256 130 384 148 Q 386 166 370 168 Q 256 154 142 168 Q 126 166 128 148 Z', fill, stroke, 5) + line('M 256 64 L 256 140', stroke, 4, { opacity: 0.5 });
export const headband = (fill, stroke, y = 150) => path(`M 132 ${y + 14} Q 256 ${y - 22} 380 ${y + 14} L 384 ${y + 38} Q 256 ${y + 2} 128 ${y + 38} Z`, fill, stroke, 4);
export const beret = (fill, stroke) => path('M 158 128 Q 170 66 262 62 Q 356 64 366 116 Q 330 140 250 138 Q 190 138 158 128 Z', fill, stroke, SW) + line('M 266 62 L 272 44', stroke, 6);
export const nightcap = (fill, stroke, band = '#FFFFFF', pom = '#FFFFFF') =>
  path('M 150 136 Q 190 54 300 70 Q 400 90 428 196 Q 402 150 352 128 Q 260 104 150 136 Z', fill, stroke, SW) +
  path('M 140 140 Q 256 98 372 138 L 366 160 Q 256 124 146 162 Z', band, stroke, 4) + circ(430, 204, 18, pom, stroke, 4);

/* ── 얼굴 ───────────────────────────────────────────────────────── */
export const DEFAULT_FACE = { lx: 203, rx: 309, y: 214, ew: 14, eh: 16, eye: '#2B1C14', brow: '#6E4630', mouth: { x: 256, y: 268 }, blush: { y: 262, dx: 88, opacity: 0.45 }, ink: '#3B2619' };

function openEyes(f, { look = 0, size = 1, lowered = 0 } = {}) {
  return [f.lx, f.rx]
    .map((x) => {
      const cx = x + look;
      const cy = f.y + lowered;
      const rim = f.sclera ? ell(cx, cy, f.ew * size + 6, f.eh * size + 6, '#FBF7F0', f.ink, 2.5) : '';
      return rim + ell(cx, cy, f.ew * size, f.eh * size, f.eye) + circ(cx + 4 * size, cy - 5 * size, 4.6 * size, '#FFFFFF') + circ(cx - 4 * size, cy + 6 * size, 2 * size, '#FFFFFF');
    })
    .join('');
}
// 흰자 + 작은 눈동자 (놀람·긴장)
function wideEyes(f, look = 0) {
  return [f.lx, f.rx].map((x) => ell(x, f.y, f.ew + 4, f.eh + 3, '#FBF7F0', f.ink, 3) + circ(x + look, f.y + 2, f.ew * 0.6, f.eye) + circ(x + look + 3, f.y - 2, 2.6, '#FFFFFF')).join('');
}
// 반쯤 감긴 눈 (지침)
function tiredEyes(f) {
  return [f.lx, f.rx]
    .map((x) => path(`M ${x - 17} ${f.y - 4} A 17 15 0 0 0 ${x + 17} ${f.y - 4} Z`, f.eye) + circ(x + 5, f.y + 1, 3.4, '#FFFFFF') + line(`M ${x - 21} ${f.y - 5} Q ${x} ${f.y - 11} ${x + 21} ${f.y - 4}`, f.ink, 5.5))
    .join('');
}
// 눈썹: 'worried' 안쪽이 올라감, 'angry' 안쪽이 내려감, 'flat', 'soft'(행복)
function brows(f, kind) {
  const by = f.y - 32;
  const shapes = {
    worried: (x, s) => `M ${x - 20 * s} ${by + 6} Q ${x} ${by + 2} ${x + 16 * s} ${by - 8}`,
    angry: (x, s) => `M ${x - 20 * s} ${by - 8} Q ${x} ${by - 2} ${x + 18 * s} ${by + 8}`,
    flat: (x, s) => `M ${x - 18 * s} ${by} Q ${x} ${by - 3} ${x + 18 * s} ${by}`,
    soft: (x, s) => `M ${x - 20 * s} ${by + 2} Q ${x} ${by - 10} ${x + 20 * s} ${by + 2}`,
  };
  const shape = shapes[kind] ?? shapes.flat;
  return line(shape(f.lx, 1), f.brow, 6) + line(shape(f.rx, -1), f.brow, 6);
}
export function blush(f, happy) {
  const { y, dx, opacity } = f.blush;
  return ell(256 - dx, y, 18, 10, '#E8968A', null, 0, { opacity: happy ? 0.72 : opacity }) + ell(256 + dx, y, 18, 10, '#E8968A', null, 0, { opacity: happy ? 0.72 : opacity });
}
function mouthShape(f, kind) {
  const { x, y } = f.mouth;
  const ink = f.ink;
  const philtrum = f.philtrum === false ? '' : line(`M ${x} ${y} L ${x} ${y + 10}`, ink, 4);
  switch (kind) {
    case 'wobble':
      return philtrum + line(`M ${x - 18} ${y + 21} Q ${x - 9} ${y + 15} ${x} ${y + 20} Q ${x + 9} ${y + 25} ${x + 18} ${y + 19}`, ink, 4);
    case 'frown':
      return philtrum + line(`M ${x - 15} ${y + 24} Q ${x} ${y + 12} ${x + 15} ${y + 24}`, ink, 4);
    case 'flat':
      return philtrum + line(`M ${x - 13} ${y + 20} L ${x + 13} ${y + 20}`, ink, 4);
    case 'fang':
      return philtrum + line(`M ${x - 18} ${y + 22} Q ${x} ${y + 12} ${x + 18} ${y + 22}`, ink, 4) + path(`M ${x - 10} ${y + 17} L ${x - 6} ${y + 26} L ${x - 2} ${y + 15} Z`, '#FFFFFF', ink, 2);
    case 'o':
      return philtrum + ell(x, y + 22, 7, 8, ink);
    case 'smile':
      return philtrum + line(`M ${x - 20} ${y + 12} Q ${x - 10} ${y + 27} ${x} ${y + 14} Q ${x + 10} ${y + 27} ${x + 20} ${y + 12}`, ink, 4);
    case 'grin':
      return philtrum + path(`M ${x - 20} ${y + 13} Q ${x} ${y + 42} ${x + 20} ${y + 13} Q ${x} ${y + 20} ${x - 20} ${y + 13} Z`, '#7A2E2E', ink, 4) + path(`M ${x - 9} ${y + 28} Q ${x} ${y + 22} ${x + 9} ${y + 28} Q ${x} ${y + 36} ${x - 9} ${y + 28} Z`, '#F08C8C');
    default:
      return '';
  }
}

/**
 * 표정 한 벌
 * sad 표정(kind): worried, teary, tired, nervous, grumpy, sulky, shy  /  happy: true
 */
export function face(face, { kind = 'worried', happy = false, look = 0 } = {}) {
  const f = { ...DEFAULT_FACE, ...face, mouth: { ...DEFAULT_FACE.mouth, ...face?.mouth }, blush: { ...DEFAULT_FACE.blush, ...face?.blush } };
  const out = [];
  if (happy) {
    out.push(brows(f, 'soft'));
    out.push([f.lx, f.rx].map((x) => line(`M ${x - 17} ${f.y + 4} Q ${x} ${f.y - 16} ${x + 17} ${f.y + 4}`, f.happyEye ?? f.eye, 7)).join(''));
    out.push(mouthShape(f, f.happyMouth ?? 'smile'));
    out.push(blush(f, true));
    return out.join('');
  }
  if (kind === 'tired') out.push(brows(f, 'worried'), tiredEyes(f), mouthShape(f, f.sadMouth ?? 'wobble'));
  else if (kind === 'nervous') out.push(brows(f, 'worried'), wideEyes(f, look), mouthShape(f, f.sadMouth ?? 'wobble'));
  else if (kind === 'grumpy') out.push(brows(f, 'angry'), openEyes(f, { look, size: 0.9 }), mouthShape(f, f.sadMouth ?? 'fang'));
  else if (kind === 'sulky') out.push(brows(f, 'flat'), openEyes(f, { look: look || 7, size: 0.92, lowered: 2 }), mouthShape(f, f.sadMouth ?? 'flat'));
  else if (kind === 'shy') out.push(brows(f, 'worried'), openEyes(f, { lowered: 5, size: 0.9 }), mouthShape(f, f.sadMouth ?? 'o'));
  else out.push(brows(f, 'worried'), openEyes(f, { look }), mouthShape(f, f.sadMouth ?? (kind === 'teary' ? 'frown' : 'wobble')));
  if (kind === 'teary') out.push(tear(f.lx + 6, f.y + 20), tear(f.rx - 6, f.y + 20, 0.8));
  out.push(blush(f, false));
  return out.join('');
}

/* ── 기분 소품 ─────────────────────────────────────────────────── */
export const sweat = (x, y, s = 1) => path(`M ${x} ${y} Q ${x + 12 * s} ${y + 16 * s} ${x + 8 * s} ${y + 26 * s} A ${10 * s} ${10 * s} 0 0 1 ${x - 10 * s} ${y + 22 * s} Q ${x - 10 * s} ${y + 14 * s} ${x} ${y} Z`, '#A9DBF3', '#5E9FC2', 3);
export const tear = (x, y, s = 1) => path(`M ${x} ${y} Q ${x + 9 * s} ${y + 13 * s} ${x + 6 * s} ${y + 20 * s} A ${7.5 * s} ${7.5 * s} 0 0 1 ${x - 7.5 * s} ${y + 17 * s} Q ${x - 7 * s} ${y + 11 * s} ${x} ${y} Z`, '#9FD8F5', '#5E9FC2', 2.5);
// 화난 표시 (네 갈래 꺾쇠)
export const anger = (x, y, s = 1) => {
  const d = (a) => {
    const r = (Math.PI / 180) * a;
    const c = Math.cos(r);
    const n = Math.sin(r);
    const p = (u, v) => `${(x + (u * c - v * n) * s).toFixed(1)} ${(y + (u * n + v * c) * s).toFixed(1)}`;
    return `M ${p(5, -14)} Q ${p(6, -6)} ${p(14, -5)}`;
  };
  return [45, 135, 225, 315].map((a) => line(d(a), '#E0585B', 5)).join('');
};
// 떨림 선
export const shiver = (x, y, side = -1) => line(`M ${x} ${y} q ${6 * side} 8 0 16 q ${-6 * side} 8 0 16 M ${x + 14 * side} ${y + 6} q ${5 * side} 7 0 14 q ${-5 * side} 7 0 14`, '#8FA8C8', 3.5);
// 우울한 그늘 선 (이마)
export const gloom = (x = 236, y = 120) => [0, 14, 28, 42].map((dx) => line(`M ${x + dx} ${y} L ${x + dx} ${y + 26}`, '#7C6FA6', 3.5, { opacity: 0.55, 'stroke-dasharray': '6 5' })).join('');
export const starShape = (x, y, r, fill, stroke) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${(x + rr * Math.cos(a)).toFixed(1)} ${(y + rr * Math.sin(a)).toFixed(1)}`);
  }
  return path(`M ${pts.join(' L ')} Z`, fill, stroke, stroke ? 2 : undefined);
};
export const sparkle = (x, y, s = 1, fill = '#FFD86B') =>
  path(`M ${x} ${y - 16 * s} Q ${x + 3 * s} ${y - 3 * s} ${x + 16 * s} ${y} Q ${x + 3 * s} ${y + 3 * s} ${x} ${y + 16 * s} Q ${x - 3 * s} ${y + 3 * s} ${x - 16 * s} ${y} Q ${x - 3 * s} ${y - 3 * s} ${x} ${y - 16 * s} Z`, fill, '#E0A93A', 2);
export const heart = (x, y, s = 1, fill = '#F27A8A', stroke = '#C24B5E') =>
  path(`M ${x} ${y + 12 * s} C ${x - 22 * s} ${y - 2 * s} ${x - 14 * s} ${y - 20 * s} ${x} ${y - 8 * s} C ${x + 14 * s} ${y - 20 * s} ${x + 22 * s} ${y - 2 * s} ${x} ${y + 12 * s} Z`, fill, stroke, 3);
export const note = (x, y, s = 1, fill = '#7C6FD0') =>
  ell(x, y, 9 * s, 7 * s, fill, null, 0, { transform: `rotate(-20 ${x} ${y})` }) + line(`M ${x + 8 * s} ${y - 2 * s} L ${x + 8 * s} ${y - 34 * s} Q ${x + 20 * s} ${y - 26 * s} ${x + 22 * s} ${y - 16 * s}`, fill, 4 * s);
// 말줄임 말풍선
export const bubble = (x, y, inner = 'dots') =>
  path(`M ${x - 44} ${y - 22} Q ${x - 44} ${y - 40} ${x - 24} ${y - 40} L ${x + 24} ${y - 40} Q ${x + 44} ${y - 40} ${x + 44} ${y - 22} L ${x + 44} ${y - 6} Q ${x + 44} ${y + 12} ${x + 24} ${y + 12} L ${x - 10} ${y + 12} L ${x - 26} ${y + 26} L ${x - 22} ${y + 12} Q ${x - 44} ${y + 12} ${x - 44} ${y - 6} Z`, '#FFFFFF', '#9AA6B8', 4) +
  (inner === 'heart' ? heart(x, y - 16, 0.9) : circ(x - 16, y - 14, 5, '#7C8798') + circ(x, y - 14, 5, '#7C8798') + circ(x + 16, y - 14, 5, '#7C8798'));
// 수염
export const whiskers = (y = 270, color = '#6E6866') =>
  pair(line(`M 196 ${y - 6} L 144 ${y - 16} M 196 ${y + 4} L 142 ${y + 6} M 198 ${y + 13} L 150 ${y + 26}`, color, 3, { opacity: 0.7 }));
