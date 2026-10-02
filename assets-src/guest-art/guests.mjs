// 새 손님 24명의 그림 (보통 표정 + _happy 표정)
import {
  anger, beret, body, bowtie, bubble, cardigan, chinShadow, circ, collarTag, ell, face, gloom, group, hardHat, headband, heart, hoodie, line, linear,
  nightcap, note, pair, pajama, path, radial, roundCollar, scarf, shirtCollar, shiver, sparkle, starShape, svgDoc, sweat, tear, whiskers,
} from './parts.mjs';

const HEAD = (rx = 130, ry = 118, cy = 220, stroke = '#6E4630') => ell(256, cy, rx, ry, 'url(#headG)', stroke);
const NOSE = (fill = '#3B2619', y = 244) =>
  path(`M 236 ${y} Q 256 ${y - 10} 276 ${y} Q 274 ${y + 18} 256 ${y + 22} Q 238 ${y + 18} 236 ${y} Z`, fill) + ell(249, y + 1, 7, 3, '#FFFFFF', null, 0, { opacity: 0.55 });
const MUZZLE = (fill, stroke, cy = 266, rx = 58, ry = 43) => ell(256, cy, rx, ry, fill, stroke, 3);
const happyBits = (spots = [[110, 120, 1], [404, 150, 0.8], [392, 300, 0.6]]) => spots.map(([x, y, s]) => sparkle(x, y, s)).join('');

/**
 * 한 손님 그림
 * @param c { title, head:[밝음,어두움], body:[위,아래,선], outline, back, headShape, marks, muzzle, face, outfit, hat, sad, happy, mood }
 */
function compose(c, happy) {
  const defs = radial('headG', c.head[0], c.head[1]) + linear('bodyG', c.body[0], c.body[1]) + (c.defs ?? '');
  const pick = (v) => (typeof v === 'function' ? v(happy) : v ?? '');
  const parts = [
    `  <!-- 몸통 -->`,
    pick(c.bodyShape) || body('bodyG', c.body[2]),
    pick(c.outfit),
    chinShadow(c.chinY ?? 338),
    `  <!-- 귀·뒤쪽 -->`,
    pick(c.back),
    `  <!-- 머리 -->`,
    pick(c.headShape) || HEAD(c.headSize?.[0], c.headSize?.[1], c.headSize?.[2], c.outline),
    pick(c.marks),
    pick(c.muzzle),
    `  <!-- 표정 -->`,
    face(c.face ?? {}, { kind: c.mood, happy, look: c.look ?? 0 }),
    pick(c.front),
    pick(c.hat),
    `  <!-- 기분 -->`,
    happy ? pick(c.happy) : pick(c.sad),
  ];
  return svgDoc(`${c.title}${happy ? ' · 마음이 따뜻해진 표정' : ''}`, defs, parts.filter(Boolean).map((p) => (p.startsWith('  <!--') ? `\n${p}` : `  ${p}`)).join('\n'));
}

export const GUEST_ART = {
  /* ── 쉬움 ───────────────────────────────────────── */
  penguin_newcomer: {
    title: '이사 온 아기 펭귄 (guest_007)',
    head: ['#4A5470', '#2C3247'], body: ['#3D4660', '#2A3046', '#1E2233'], outline: '#1E2233', mood: 'teary',
    outfit: path('M 186 520 C 190 432 214 374 256 368 C 298 374 322 432 326 520 Z', '#F6F3EC', '#C9C1B4', 4) + scarf('#E0605A', '#A83E3A', '#F7D9A8'),
    back: line('M 246 110 Q 238 86 252 80 M 262 108 Q 270 86 284 92', '#1E2233', 6),
    marks: path('M 256 150 C 226 118 152 130 150 200 C 148 268 196 316 256 318 C 316 316 364 268 362 200 C 360 130 286 118 256 150 Z', '#FFFDF8'),
    muzzle: path('M 230 250 Q 256 236 282 250 Q 270 276 256 278 Q 242 276 230 250 Z', '#F2A33C', '#B8701E', 4),
    face: { brow: '#2C3247', sadMouth: 'none', happyMouth: 'none', blush: { y: 266, dx: 82 } },
    sad: tear(392, 260, 0.9) + line('M 92 150 l 18 -6 M 100 168 l 16 2', '#9AB8E0', 4),
    happy: happyBits() + heart(394, 120, 0.9),
  },
  puppy_waiting: {
    title: '주인을 기다리는 강아지 (guest_008)',
    head: ['#F0CFA0', '#D3A36E'], body: ['#E9C597', '#CF9F68', '#8A5A36'], outline: '#8A5A36', mood: 'teary',
    outfit: collarTag('#D9534F', '#F2C14E', '#8A3A30'),
    marks: (happy) =>
      ell(312, 210, 32, 28, '#C48A58', null, 0, { opacity: 0.85 }) +
      pair(path('M 150 128 C 98 140 84 236 106 298 C 120 334 162 320 172 286 C 184 246 188 168 150 128 Z', '#A8744A', '#6E4630', 6, happy ? { transform: 'rotate(-6 150 128)' } : {})),
    muzzle: MUZZLE('#F7E6CC', '#D2B08A') + NOSE(),
    face: { happyMouth: 'grin' },
    sad: '',
    happy: happyBits([[96, 330, 0.9], [420, 120, 1], [410, 300, 0.7]]) + line('M 70 250 q 10 -6 4 -16 M 442 250 q -10 -6 -4 -16', '#E0A93A', 4),
  },
  hedgehog_prickly: {
    title: '가시가 많은 고슴도치 (guest_009)',
    head: ['#F1DDBE', '#DCC09A'], body: ['#A8CFA6', '#86B686', '#4E7A52'], outline: '#7A5A40', headSize: [124, 112, 222], mood: 'teary',
    outfit: roundCollar('#D7EBD2', '#4E7A52'),
    back: (happy) => {
      const pts = [];
      const n = 15;
      for (let i = 0; i <= n * 2; i++) {
        const a = Math.PI * (0.92 + (1.16 * i) / (n * 2));
        const r = i % 2 === 0 ? (happy ? 150 : 140) : happy ? 172 : 196;
        pts.push([256 + r * Math.cos(a) * 1.08, 230 + r * Math.sin(a)]);
      }
      const d = happy
        ? pts.reduce((acc, [x, y], i) => (i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : i % 2 === 1 ? `${acc} Q ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} ${x.toFixed(1)} ${y.toFixed(1)}`), '')
        : `M ${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ')}`;
      return path(`${d} L 256 260 Z`, happy ? '#9C7A5C' : '#8B6A4E', '#5A4030', 6) + pair(circ(170, 136, 22, '#E7C9A3', '#7A5A40', 5));
    },
    muzzle: ell(256, 264, 42, 32, '#F8EBD6', '#D6B994', 3) + circ(256, 246, 12, '#2B1C14') + circ(252, 242, 3.5, '#FFFFFF'),
    face: { brow: '#7A5A40', mouth: { y: 258 } },
    sad: sweat(96, 250, 0.9),
    happy: happyBits() + heart(108, 270, 0.8),
  },
  duckling_pond: {
    title: '수영이 무서운 아기 오리 (guest_010)',
    head: ['#FFE98F', '#F7C948'], body: ['#FFE48A', '#F6C944', '#C99A2E'], outline: '#B8862A', headSize: [124, 116, 222], mood: 'nervous',
    outfit:
      ell(256, 418, 176, 50, '#F49AA6', '#C9606E', 6) + ell(256, 408, 118, 24, '#F6C944') +
      [120, 196, 316, 392].map((x) => ell(x, 424 + (Math.abs(x - 256) > 100 ? -8 : 10), 18, 14, '#FFFFFF', null, 0, { opacity: 0.95 })).join(''),
    back: line('M 248 110 C 236 82 256 72 260 94 M 262 106 C 268 80 290 84 280 102', '#B8862A', 6),
    muzzle: path('M 212 254 Q 256 234 300 254 Q 302 276 256 282 Q 210 276 212 254 Z', '#F5A142', '#BB6C1C', 4) + ell(244, 252, 4, 2.5, '#9A5418') + ell(268, 252, 4, 2.5, '#9A5418'),
    face: { brow: '#B8862A', y: 208, sadMouth: 'none', happyMouth: 'none', blush: { y: 262, dx: 92 } },
    sad: sweat(386, 150) + shiver(96, 200, -1) + shiver(416, 230, 1),
    happy: happyBits([[104, 150, 1], [410, 140, 0.8]]) + tear(108, 300, 0.8) + tear(404, 290, 0.7),
  },
  hamster_wheel: {
    title: '쳇바퀴를 못 멈추는 햄스터 (guest_011)',
    head: ['#F6CF96', '#E2AB68'], body: ['#64B3DE', '#3E89BA', '#2D6A92'], outline: '#9A6A3A', mood: 'tired',
    outfit: path('M 196 346 Q 256 390 316 346', 'none', '#FFFFFF', 10) + line('M 190 346 L 176 420 M 322 346 L 336 420', '#FFFFFF', 8),
    back: pair(circ(162, 128, 30, '#E8B47C', '#9A6A3A', 5) + circ(164, 130, 15, '#F2A7A7')),
    marks: pair(ell(188, 278, 46, 36, '#FFF4E4', '#E8CFAE', 3)),
    muzzle: path('M 246 246 L 266 246 L 256 258 Z', '#E68A94', '#B85E6E', 2) + whiskers(262, '#9A6A3A'),
    face: { brow: '#9A6A3A', mouth: { y: 256 }, blush: { y: 270, dx: 76 } },
    hat: headband('#E55B4D', '#A83A30', 132),
    sad: sweat(392, 176) + sweat(110, 200, 0.75) + line('M 420 290 l 30 0 M 426 310 l 22 0 M 420 330 l 30 0', '#9AB8E0', 4),
    happy: happyBits([[110, 120, 0.9], [406, 140, 0.8]]) + ell(392, 318, 10, 18, '#3A3A3A', '#222', 2, { transform: 'rotate(30 392 318)' }) + line('M 388 304 L 396 330', '#EDEDED', 3, { transform: 'rotate(30 392 318)' }),
  },
  fox_promise: {
    title: '약속을 깜빡한 아기 여우 (guest_012)',
    head: ['#F4A05A', '#DB7A34'], body: ['#F0EAE0', '#D8CEC0', '#9A8A78'], outline: '#8A4A22', mood: 'shy',
    outfit: scarf('#5BB5A7', '#2F7D72', '#E8F6F3'),
    back: pair(path('M 154 162 L 128 52 L 220 116 Z', '#E07F3A', '#8A4A22', 6) + path('M 160 148 L 144 82 L 202 118 Z', '#FBE3C8') + path('M 128 52 L 138 86 L 158 72 Z', '#4A2A1A')),
    marks: path('M 138 230 Q 168 300 256 308 Q 344 300 374 230 Q 340 262 300 254 Q 256 292 212 254 Q 172 262 138 230 Z', '#FFF6EA'),
    muzzle: ell(256, 250, 15, 11, '#2B1C14') + circ(251, 247, 3.5, '#FFFFFF'),
    face: { brow: '#8A4A22', mouth: { y: 260 } },
    front: (happy) =>
      group(path('M -26 -24 L 26 -24 L 26 24 L -26 24 Z', '#FFE27A', '#C9A73A', 4) + (happy ? line('M -12 2 L -2 12 L 16 -10', '#4E9B49', 6) : line('M 0 -12 L 0 6', '#C24B5E', 6) + circ(0, 15, 3.5, '#C24B5E')), 'translate(390 360) rotate(10)'),
    sad: sweat(384, 168, 0.9),
    happy: happyBits([[110, 128, 1], [410, 130, 0.8]]),
  },
  owl_exam: {
    title: '결과를 기다리는 부엉이 (guest_013)',
    head: ['#B8957A', '#8C6B50'], body: ['#A88468', '#86654C', '#5A4030'], outline: '#5A4030', headSize: [136, 120, 222], mood: 'nervous',
    outfit: path('M 196 520 C 196 432 220 372 256 364 C 292 372 316 432 316 520 Z', '#EAD8C0', '#C9AE8A', 4) + [392, 420, 448].map((y) => line(`M 230 ${y} q 8 8 16 0 M 252 ${y + 12} q 8 8 16 0 M 266 ${y} q 8 8 16 0`, '#B89A74', 3)).join(''),
    back: pair(path('M 150 140 L 124 64 L 198 112 Z', '#8C6B50', '#5A4030', 6)),
    marks: (happy) => pair(circ(203, 214, 52, '#F1E2CC', '#C9AE8A', 3) + (happy ? '' : circ(203, 214, 26, '#F6C94A', '#C99A2E', 3))),
    muzzle: path('M 242 248 Q 256 236 270 248 L 256 278 Z', '#E8A93C', '#A8701E', 4),
    face: { brow: '#5A4030', ew: 13, eh: 14, sadMouth: 'none', happyMouth: 'none', blush: { y: 280, dx: 92 } },
    front: group(path('M -6 -60 L 6 -60 L 6 30 L 0 44 L -6 30 Z', '#F2C14E', '#8A6420', 3) + path('M -6 30 L 6 30 L 0 44 Z', '#3A3A3A'), 'translate(378 136) rotate(28)'),
    sad: sweat(112, 160),
    happy: happyBits() + starShape(116, 300, 14, '#FFD86B', '#E0A93A'),
  },
  mouse_alone: {
    title: '혼자 잠드는 아기 생쥐 (guest_014)',
    head: ['#D6CFD4', '#ADA4AB'], body: ['#BCD6F0', '#9BBCE0', '#5E80A8'], outline: '#6E6670', headSize: [124, 112, 224], mood: 'teary',
    outfit: pajama('#5E80A8', '#FFF3C4'),
    back: pair(circ(150, 132, 54, '#C5BCC2', '#6E6670', 6) + circ(152, 134, 34, '#F2B8C0')),
    muzzle: circ(256, 252, 11, '#E68A9A', '#B85E6E', 2) + whiskers(266, '#7E7680'),
    face: { brow: '#6E6670', mouth: { y: 262 }, blush: { y: 268, dx: 84 } },
    hat: nightcap('#7FA6D9', '#4C72A8', '#FFFFFF', '#FFFFFF'),
    sad: '',
    happy: happyBits([[100, 210, 0.8], [410, 300, 0.7]]) + heart(102, 300, 0.8),
  },

  /* ── 보통 ───────────────────────────────────────── */
  beaver_dam: {
    title: '쉬지 못하는 비버 (guest_015)',
    head: ['#B88258', '#8C5A36'], body: ['#D9604E', '#B8483A', '#7A2E24'], outline: '#5E3A22', mood: 'tired',
    outfit: [150, 200, 312, 362].map((x) => line(`M ${x} 372 L ${x - 14} 520`, '#8A3428', 6, { opacity: 0.6 })).join('') + [410, 452].map((y) => line(`M 84 ${y} L 428 ${y}`, '#8A3428', 6, { opacity: 0.5 })).join('') + shirtCollar('#F4EDE4', '#B8A890', false),
    back: pair(circ(160, 138, 26, '#9A6A44', '#5E3A22', 5)),
    muzzle: MUZZLE('#E8C9A4', '#B8916A', 268, 62, 44) + NOSE('#2B1C14', 242),
    face: { brow: '#5E3A22', mouth: { y: 264 }, sadMouth: 'flat' },
    front: path('M 245 286 L 256 286 L 256 304 Q 250 306 245 302 Z M 256 286 L 267 286 L 267 302 Q 262 306 256 304 Z', '#FFFDF5', '#8C6B50', 2.5),
    hat: hardHat('#F2C14E', '#A88220'),
    sad: sweat(390, 190) + [[96, 300], [120, 330], [420, 320]].map(([x, y]) => path(`M ${x} ${y} l 12 -4 l 4 8 l -12 4 Z`, '#D9B48A', '#9A7A50', 2)).join(''),
    happy: happyBits([[96, 210, 0.9], [420, 230, 0.8]]),
  },
  parrot_secret: {
    title: '비밀을 들킨 앵무새 (guest_016)',
    head: ['#93D77A', '#56A34A'], body: ['#7CC466', '#4E9B49', '#2F6A2C'], outline: '#2F6A2C', headSize: [124, 114, 224], mood: 'grumpy',
    outfit: pair(path('M 70 520 C 80 444 112 400 152 384 Q 170 452 152 520 Z', '#4E9BD6', '#2F6A9A', 5) + line('M 110 440 Q 128 470 126 520', '#E2584E', 8)),
    back: path('M 236 112 C 214 70 230 40 252 48 C 244 70 250 92 256 110 Z', '#E2584E', '#A83A30', 5) + path('M 256 110 C 258 70 282 44 300 58 C 282 70 276 92 270 112 Z', '#F2C14E', '#A88220', 5) + path('M 246 112 C 240 76 258 54 270 62 C 260 80 262 98 262 112 Z', '#4E9BD6', '#2F6A9A', 5),
    marks: pair(ell(203, 214, 40, 34, '#FFFFFF', '#CFE6C8', 2)),
    muzzle: path('M 222 240 Q 256 220 290 240 Q 296 278 258 302 Q 262 274 246 260 Q 232 250 222 240 Z', '#F2C66A', '#A8822A', 4) + path('M 232 262 Q 254 280 250 294 Q 236 282 232 262 Z', '#3E3A3F'),
    face: { brow: '#2F6A2C', sadMouth: 'none', happyMouth: 'none', blush: { y: 270, dx: 90 } },
    sad: bubble(400, 110, 'dots') + anger(116, 132, 1),
    happy: bubble(400, 110, 'heart') + happyBits([[110, 140, 0.9]]),
  },
  elephant_burden: {
    title: '짐을 도맡은 코끼리 (guest_017)',
    head: ['#BCC6D6', '#94A0B6'], body: ['#E0B158', '#BC8730', '#7A561A'], outline: '#5E6A80', mood: 'tired',
    outfit: roundCollar('#F2E1B8', '#7A561A') + line('M 186 352 L 168 520 M 326 352 L 344 520', '#9A6E24', 8, { opacity: 0.6 }),
    back: pair(path('M 160 150 C 70 108 20 200 44 282 C 64 348 142 348 170 300 Z', '#A9B4C6', '#5E6A80', 6) + path('M 150 172 C 92 150 64 214 80 266 C 96 306 138 300 156 282 Z', '#E8C4CC')),
    muzzle: (happy) =>
      (happy
        ? path('M 226 232 Q 216 300 242 332 Q 274 356 302 320 Q 314 300 302 290 Q 288 314 272 310 Q 260 298 286 232 Z', 'url(#headG)', '#5E6A80', 6)
        : path('M 226 232 Q 222 300 236 338 Q 250 372 288 362 Q 302 356 294 342 Q 272 350 266 330 Q 260 300 286 232 Z', 'url(#headG)', '#5E6A80', 6)) +
      line('M 238 268 q 18 6 36 0 M 238 292 q 16 6 32 0', '#7A869C', 3.5),
    face: { brow: '#5E6A80', y: 206, sadMouth: 'none', happyMouth: 'none', blush: { y: 252, dx: 86 } },
    sad: [[386, 336, 60, 40, '#C9A06A'], [394, 298, 50, 38, '#D9B27A'], [400, 264, 40, 34, '#E6C48E']]
      .map(([x, y, w, h, fill]) => path(`M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`, fill, '#8A6A3A', 4) + line(`M ${x + w / 2} ${y} L ${x + w / 2} ${y + h}`, '#A8865A', 4))
      .join('') + sweat(108, 156),
    happy: happyBits([[110, 120, 1], [404, 120, 0.9], [420, 300, 0.7]]),
  },
  frog_mirror: {
    title: '거울이 싫은 개구리 (guest_018)',
    head: ['#B0DF8A', '#72B054'], body: ['#C2B2E2', '#9886C4', '#5E4E8A'], outline: '#3E7A2E', mood: 'sulky', look: -8,
    outfit: hoodie('#AE9CD6', '#5E4E8A'),
    headShape: pair(circ(196, 156, 50, 'url(#headG)', '#3E7A2E', 6)) + ell(256, 240, 152, 104, 'url(#headG)', '#3E7A2E') + pair(circ(196, 156, 44, 'url(#headG)')),
    marks: [[150, 220, 7], [176, 290, 6], [340, 284, 7], [372, 230, 6], [300, 300, 5], [214, 304, 5], [256, 196, 6]].map(([x, y, r]) => circ(x, y, r, '#5E9A44', null, 0, { opacity: 0.55 })).join('') + circ(242, 232, 4, '#2E5A22') + circ(270, 232, 4, '#2E5A22'),
    muzzle: (happy) => (happy ? line('M 176 262 Q 256 312 336 262', '#2E5A22', 5) : line('M 196 282 Q 256 266 316 282', '#2E5A22', 5)),
    face: { lx: 196, rx: 316, y: 156, brow: '#3E7A2E', sadMouth: 'none', happyMouth: 'none', blush: { y: 270, dx: 100 } },
    front: (happy) => group(line('M 0 30 L 0 80', '#B88A4A', 12) + ell(0, 0, 32, 38, '#D8ECF6', '#B88A4A', 7) + (happy ? sparkle(-8, -8, 0.7) : line('M -12 -14 L 6 8', '#FFFFFF', 4, { opacity: 0.8 })), 'translate(410 330) rotate(-12)'),
    sad: gloom(232, 96),
    happy: happyBits([[100, 120, 0.9], [96, 300, 0.7]]),
  },
  tiger_temper: {
    title: '욱하는 아기 호랑이 (guest_019)',
    head: ['#F6A851', '#E0822C'], body: ['#94C982', '#6BA65A', '#3E6A34'], outline: '#8A4A1A', mood: 'grumpy',
    outfit: roundCollar('#D6EBCB', '#3E6A34'),
    back: pair(circ(156, 132, 36, '#E8903C', '#8A4A1A', 6) + circ(158, 134, 17, '#FFF1DC')),
    marks: path('M 248 106 L 256 142 L 264 106 Z', '#3E2A1A') + pair(line('M 216 112 Q 226 130 218 150 M 130 210 Q 154 218 170 210 M 134 240 Q 158 246 174 238', '#3E2A1A', 7)) + pair(ell(203, 184, 18, 9, '#FFF6EA')),
    muzzle: MUZZLE('#FFF6EA', '#E2C8A8', 270, 64, 44) + path('M 240 250 Q 256 242 272 250 Q 266 264 256 266 Q 246 264 240 250 Z', '#C9605A') + whiskers(274, '#8A4A1A'),
    face: { brow: '#3E2A1A', mouth: { y: 266 } },
    sad: anger(396, 132, 1.1),
    happy: happyBits([[110, 128, 0.9]]) + line('M 392 150 q 10 -8 20 0 q 10 8 20 0 M 396 172 q 10 -8 20 0 q 10 8 20 0', '#E0A93A', 4),
  },
  otter_farewell: {
    title: '친구와 헤어지는 수달 (guest_020)',
    head: ['#AF805B', '#86583A'], body: ['#A07454', '#7E5638', '#5A3A24'], outline: '#5A3A24', headSize: [128, 112, 222], mood: 'teary',
    outfit: scarf('#E8B64A', '#A87A1E', '#FFF3C4'),
    back: pair(circ(158, 150, 22, '#9A6A48', '#5A3A24', 5)),
    marks: path('M 148 236 Q 160 314 256 318 Q 352 314 364 236 Q 320 266 256 262 Q 192 266 148 236 Z', '#F2DEC4'),
    muzzle: circ(238, 266, 24, '#F7E9D6') + circ(274, 266, 24, '#F7E9D6') + path('M 240 246 Q 256 238 272 246 Q 268 260 256 262 Q 244 260 240 246 Z', '#2B1C14') + whiskers(268, '#5A3A24'),
    face: { brow: '#5A3A24', mouth: { y: 262 } },
    front: (happy) =>
      group(path('M -40 -26 L 40 -26 L 40 26 L -40 26 Z', '#FFFDF5', '#B8A88A', 4) + line('M -40 -26 L 0 4 L 40 -26', '#B8A88A', 4) + (happy ? heart(0, 2, 0.6) : ''), 'translate(170 384) rotate(-8)'),
    sad: '',
    happy: happyBits([[110, 140, 0.9], [404, 130, 0.8]]) + heart(406, 290, 0.8),
  },
  sparrow_choir: {
    title: '무대가 무서운 참새 (guest_021)',
    head: ['#B88A62', '#8C5E3A'], body: ['#AC7E56', '#85593A', '#4E3220'], outline: '#4E3220', headSize: [124, 114, 222], mood: 'nervous',
    outfit: path('M 196 520 C 196 440 220 380 256 372 C 292 380 316 440 316 520 Z', '#EFE7DA', '#C9BBA6', 4) + bowtie('#D9534F', '#8A3A30', 360),
    marks: pair(ell(184, 266, 54, 42, '#F2EDE4') + ell(176, 270, 12, 9, '#3A2A20')) + path('M 230 296 Q 256 332 282 296 Q 256 306 230 296 Z', '#2E2620'),
    muzzle: path('M 240 246 L 272 246 L 256 270 Z', '#4A4038', '#2A221C', 3),
    face: { brow: '#4E3220', sadMouth: 'none', happyMouth: 'none', blush: { y: 252, dx: 92 } },
    sad: sweat(392, 160) + group(note(0, 0, 0.9, '#9AA6B8'), 'translate(100 170) rotate(-14)') + shiver(410, 240, 1),
    happy: note(98, 180, 1, '#E2584E') + note(410, 150, 0.9, '#4E9BD6') + note(420, 290, 0.7, '#4E9B49') + happyBits([[110, 300, 0.7]]),
  },
  monkey_helper: {
    title: '고맙단 말을 못 들은 원숭이 (guest_022)',
    head: ['#AD7A52', '#835430'], body: ['#F6CF66', '#E0AE3C', '#9A7420'], outline: '#553420', headSize: [122, 116, 222], mood: 'sulky',
    outfit: roundCollar('#FFF0C8', '#9A7420'),
    back: pair(circ(134, 228, 40, '#9B6A45', '#553420', 6) + circ(136, 230, 23, '#F2C9A8')),
    marks: path('M 256 168 C 230 140 160 150 158 210 C 156 250 176 270 190 282 C 200 320 230 332 256 332 C 282 332 312 320 322 282 C 336 270 356 250 354 210 C 352 150 282 140 256 168 Z', '#F4D2B0', '#C99E78', 3),
    muzzle: circ(248, 256, 4, '#553420') + circ(264, 256, 4, '#553420'),
    face: { brow: '#553420', mouth: { y: 264 } },
    front: (happy) => group(path('M -34 -42 L 34 -42 L 34 42 L -34 42 Z', '#7FB3E0', '#3E6E9A', 4) + [-24, -8, 8, 24].map((y) => circ(-34, y, 4, '#FFFFFF', '#3E6E9A', 2)).join('') + (happy ? heart(4, 0, 0.6) : line('M -16 -14 L 22 -14 M -16 2 L 22 2 M -16 18 L 12 18', '#DCEBF7', 4)), 'translate(380 372) rotate(8)'),
    sad: gloom(232, 94),
    happy: happyBits([[110, 128, 1], [104, 300, 0.7]]),
  },

  /* ── 어려움 ─────────────────────────────────────── */
  panda_bestfriend: {
    title: '단짝이 그리운 판다 (guest_023)',
    head: ['#FDFBF6', '#E2DDD4'], body: ['#B2DDCE', '#86C0AE', '#4E8A78'], outline: '#4A4650', mood: 'teary',
    outfit: roundCollar('#E2F2EC', '#4E8A78'),
    back: pair(circ(152, 124, 44, '#2E2B30', '#2E2B30', 6)),
    marks: pair(ell(203, 220, 34, 44, '#2E2B30', null, 0, { transform: 'rotate(24 203 220)' })),
    muzzle: MUZZLE('#FFFFFF', '#DCD6CC', 272, 54, 38) + NOSE('#2E2B30', 248),
    face: { brow: '#4A4650', eye: '#2B1C14', sclera: true, happyEye: '#FFFFFF', mouth: { y: 270 }, ink: '#2E2B30' },
    sad: '',
    happy: happyBits([[110, 140, 0.8]]) + heart(400, 120, 0.9) + heart(420, 300, 0.7),
  },
  seal_resolution: {
    title: '작심삼일 물개 (guest_024)',
    head: ['#D7DDE4', '#AEB8C4'], body: ['#C2CCD8', '#9AA6B6', '#5E6878'], outline: '#5E6878', headSize: [132, 116, 222], mood: 'tired',
    outfit: pair(path('M 92 470 Q 110 410 160 392 Q 168 440 140 488 Z', '#9AA6B6', '#5E6878', 5)),
    muzzle: ell(234, 268, 28, 22, '#EEF1F4', '#B8C0CA', 3) + ell(278, 268, 28, 22, '#EEF1F4', '#B8C0CA', 3) + [[224, 262], [236, 272], [276, 262], [288, 272]].map(([x, y]) => circ(x, y, 2.5, '#8A94A2')).join('') + path('M 242 246 Q 256 238 270 246 Q 264 258 256 260 Q 248 258 242 246 Z', '#2E2B30') + whiskers(270, '#6E7888'),
    face: { brow: '#5E6878', mouth: { y: 268 }, philtrum: false, blush: { y: 262, dx: 96 } },
    hat: headband('#F06A5E', '#B8463C', 128),
    sad: group(path('M -30 -40 L 30 -40 L 34 40 L -34 40 Z', '#F2B84E', '#B8822A', 4) + path('M -30 -40 l 10 -8 l 10 8 l 10 -8 l 10 8 l 10 -8 l 10 8', '#F2B84E', '#B8822A', 3) + path('M -14 2 Q 0 -10 14 2 Q 0 14 -14 2 Z M 14 2 L 24 -6 L 24 10 Z', '#4E9BD6'), 'translate(392 374) rotate(12)') + [[214, 330], [300, 338], [256, 352]].map(([x, y]) => circ(x, y, 4, '#E2B068')).join('') + sweat(110, 168),
    happy: happyBits([[108, 140, 1], [410, 160, 0.9], [404, 300, 0.7]]),
  },
  badger_keeper: {
    title: '모임을 지키는 오소리 (guest_025)',
    head: ['#BDBBC2', '#918E98'], body: ['#A8846A', '#7E5E42', '#4E3828'], outline: '#4A4650', mood: 'worried',
    outfit: cardigan('#6A4C34', '#4E3828'),
    back: pair(circ(160, 140, 24, '#8C8994', '#4A4650', 5)),
    marks: path('M 256 102 Q 226 150 228 220 Q 230 280 256 300 Q 282 280 284 220 Q 286 150 256 102 Z', '#F7F5F2') + pair(path('M 146 150 Q 200 162 222 252 Q 200 266 178 244 Q 152 204 146 150 Z', '#2E2B30') + ell(176, 272, 40, 28, '#F7F5F2')),
    muzzle: ell(256, 262, 16, 11, '#2E2B30') + circ(251, 259, 3, '#FFFFFF'),
    face: { brow: '#2E2B30', lx: 200, rx: 312, sclera: true, happyEye: '#FFFFFF', mouth: { y: 272 }, ink: '#2E2B30', blush: { y: 280, dx: 74 } },
    front: pair(circ(200, 214, 28, 'none', '#C9A85A', 4)) + line('M 228 210 Q 256 200 284 210', '#C9A85A', 4) + group(path('M -36 -30 L 36 -30 L 36 30 L -36 30 Z', '#4E7A5E', '#2E4A38', 4) + path('M -20 -16 L 20 -16 L 20 0 L -20 0 Z', '#F4EDE0'), 'translate(152 386) rotate(-10)'),
    sad: gloom(232, 92) + sweat(392, 150, 0.8),
    happy: happyBits([[400, 120, 0.9], [112, 120, 0.8]]),
  },
  giraffe_family: {
    title: '가족에게 지친 기린 (guest_026)',
    head: ['#F7D886', '#E2B154'], body: ['#F4CF72', '#E0B050', '#8A6420'], outline: '#8A6420', mood: 'teary',
    bodyShape: path('M 64 520 C 70 452 120 410 196 396 L 206 300 L 306 300 L 316 396 C 392 410 442 452 448 520 Z', 'url(#bodyG)', '#8A6420', 6),
    outfit: [[226, 340, 20, 14], [282, 372, 18, 16], [236, 400, 16, 12], [140, 470, 24, 16], [360, 460, 26, 18], [300, 492, 20, 14]].map(([x, y, rx, ry]) => ell(x, y, rx, ry, '#C9873E', null, 0, { opacity: 0.85 })).join(''),
    chinY: 304,
    back: pair(line('M 218 120 L 208 70', '#E0B050', 14) + circ(206, 64, 13, '#7A4E2A') + path('M 148 168 Q 96 148 82 178 Q 108 198 152 192 Z', '#F2C868', '#8A6420', 5)),
    headShape: ell(256, 204, 112, 104, 'url(#headG)', '#8A6420'),
    marks: [[196, 140, 16, 11], [316, 136, 14, 10], [176, 250, 12, 9], [338, 246, 13, 9]].map(([x, y, rx, ry]) => ell(x, y, rx, ry, '#C9873E', null, 0, { opacity: 0.8 })).join(''),
    muzzle: ell(256, 272, 72, 48, '#F7E2B8', '#C9A66A', 3) + ell(238, 266, 6, 4, '#7A4E2A') + ell(274, 266, 6, 4, '#7A4E2A'),
    face: { brow: '#8A6420', lx: 210, rx: 302, y: 196, mouth: { y: 280 }, philtrum: false, blush: { y: 246, dx: 92 } },
    sad: gloom(232, 112),
    happy: happyBits([[110, 120, 0.9], [404, 130, 0.8]]) + circ(400, 318, 22, '#E2584E', '#A83A30', 4) + path('M 400 296 q 4 -12 14 -14', '#6A8A3A', '#4E6A2A', 3),
  },
  koala_cart: {
    title: '장바구니를 못 닫는 코알라 (guest_027)',
    head: ['#B8B8C4', '#8E8E9C'], body: ['#94BAE2', '#6E98C8', '#4C72A0'], outline: '#5A5A68', headSize: [126, 114, 224], mood: 'tired',
    outfit: shirtCollar('#FFFFFF', '#B8C4D4'),
    back: pair(circ(138, 156, 64, '#A9A9B6', '#5A5A68', 6) + circ(142, 160, 40, '#F2F0F4') + [[-30, -16], [-36, 8], [-26, 30], [-6, 40]].map(([dx, dy]) => circ(142 + dx, 160 + dy, 12, '#F2F0F4')).join('')),
    muzzle: ell(256, 254, 25, 33, '#3A3540') + ell(248, 238, 7, 10, '#FFFFFF', null, 0, { opacity: 0.4 }),
    face: { brow: '#5A5A68', lx: 196, rx: 316, y: 218, ew: 12, eh: 14, mouth: { y: 286 }, philtrum: false, blush: { y: 270, dx: 98 } },
    sad: group(path('M -26 -44 Q -26 -50 -20 -50 L 20 -50 Q 26 -50 26 -44 L 26 44 Q 26 50 20 50 L -20 50 Q -26 50 -26 44 Z', '#3A3F4A', '#22252C', 4) + path('M -18 -40 L 18 -40 L 18 34 L -18 34 Z', '#CDE8F7') + line('M -10 -8 L -6 10 L 10 10 L 14 -4 L -8 -4 M -2 16 l 0 0 M 8 16 l 0 0', '#3E6E9A', 4) + circ(-2, 18, 3, '#3E6E9A') + circ(8, 18, 3, '#3E6E9A'), 'translate(392 380) rotate(10)') + gloom(232, 96),
    happy: happyBits([[110, 260, 0.8], [404, 300, 0.7]]) + heart(400, 120, 0.8),
  },
  redpanda_brush: {
    title: '붓을 놓은 레서판다 (guest_028)',
    head: ['#E5834F', '#C2582E'], body: ['#F1E9DA', '#D8CCB8', '#8A7A62'], outline: '#6A2A18', headSize: [128, 114, 224], mood: 'sulky',
    outfit: bowtie('#D9534F', '#8A3A30', 352) + [[160, 430, '#4E9BD6'], [346, 410, '#F2C14E'], [300, 470, '#7FBF6A'], [196, 470, '#E2584E']].map(([x, y, c]) => circ(x, y, 9, c, null, 0, { opacity: 0.85 })).join(''),
    back: pair(path('M 156 156 Q 140 78 210 98 Q 200 130 156 156 Z', '#8A3A20', '#6A2A18', 6) + path('M 162 144 Q 154 98 196 108 Q 190 128 162 144 Z', '#FFF3E6')),
    marks: pair(ell(203, 178, 22, 12, '#FFF6EC') + path('M 150 232 Q 168 302 236 302 Q 222 270 198 260 Q 170 254 150 232 Z', '#FFF6EC') + line('M 203 238 L 196 268', '#8A3A20', 6)),
    muzzle: ell(256, 272, 44, 32, '#FFF6EC', '#E2C8A8', 3) + ell(256, 256, 14, 9, '#2B1C14'),
    face: { brow: '#6A2A18', mouth: { y: 262 } },
    front: (happy) => group(line('M 0 0 L 0 90', '#9A6A3A', 9) + path('M -8 -2 L 8 -2 L 6 -26 Q 0 -40 -6 -26 Z', happy ? '#E2584E' : '#5A4A3A', '#3A2A20', 3), happy ? 'translate(120 360) rotate(-24)' : 'translate(116 430) rotate(-76)'),
    hat: beret('#3E4A7A', '#252E52'),
    sad: gloom(232, 96),
    happy: happyBits([[410, 130, 0.9], [416, 300, 0.7]]) + circ(386, 220, 7, '#4E9BD6') + circ(410, 250, 6, '#F2C14E') + circ(380, 262, 5, '#7FBF6A'),
  },
  fawn_quarrel: {
    title: '다투는 소리에 깬 아기 사슴 (guest_029)',
    head: ['#E2AA72', '#C0864F'], body: ['#F7C3CC', '#E596A6', '#A85E6E'], outline: '#7A4A26', headSize: [120, 112, 224], mood: 'teary',
    outfit: pajama('#A85E6E', '#FFFFFF'),
    back: pair(path('M 158 164 Q 90 118 58 160 Q 90 210 164 198 Z', '#CF955E', '#7A4A26', 6) + path('M 150 168 Q 100 140 80 164 Q 104 192 152 188 Z', '#F4C9B4')),
    marks: [[232, 134, 9, 7], [276, 128, 8, 6], [256, 152, 7, 5], [296, 150, 6, 5], [214, 154, 6, 5]].map(([x, y, rx, ry]) => ell(x, y, rx, ry, '#FFF6EA', null, 0, { opacity: 0.9 })).join(''),
    muzzle: ell(256, 272, 48, 36, '#F7E3CC', '#D2B08A', 3) + ell(256, 256, 14, 10, '#2B1C14') + circ(252, 253, 3, '#FFFFFF'),
    face: { brow: '#7A4A26', mouth: { y: 264 } },
    front: path('M 168 412 Q 168 390 192 390 L 320 390 Q 344 390 344 412 L 344 446 Q 344 466 320 466 L 192 466 Q 168 466 168 446 Z', '#FBDDE4', '#C98A9A', 5) + starShape(256, 424, 13, '#FFFFFF') + line('M 196 404 q 6 -6 12 0 M 304 404 q 6 -6 12 0', '#E9B7C4', 3),
    sad: shiver(96, 190, -1) + shiver(416, 190, 1),
    happy: happyBits([[110, 130, 0.9]]) + heart(404, 128, 0.9),
  },
  wolf_gruff: {
    title: '퉁명스러워진 늑대 (guest_030)',
    head: ['#ADB2BC', '#858B96'], body: ['#5E6372', '#444856', '#2E313A'], outline: '#4A4E58', mood: 'grumpy', look: 6,
    outfit: hoodie('#555A68', '#2E313A', '#D8DCE4'),
    back: pair(path('M 156 162 L 138 58 L 220 120 Z', '#8C919C', '#4A4E58', 6) + path('M 162 148 L 152 86 L 202 122 Z', '#E7DCDC') + path('M 132 214 L 108 236 L 134 240 L 116 262 L 146 258', '#ADB2BC', '#4A4E58', 5)),
    marks: path('M 176 250 Q 200 312 256 316 Q 312 312 336 250 Q 300 276 256 272 Q 212 276 176 250 Z', '#ECEEF2'),
    muzzle: MUZZLE('#E9EBEF', '#B8BDC6', 268, 54, 44) + NOSE('#2E2B30', 244),
    face: { brow: '#2E313A', mouth: { y: 268 }, ink: '#2E2B30' },
    sad: line('M 392 140 l 26 -10 M 396 160 l 30 0', '#8A90A0', 4) + anger(118, 140, 0.9),
    happy: happyBits([[110, 130, 0.9], [406, 140, 0.8]]),
  },
};

export const renderGuest = (key, happy) => compose(GUEST_ART[key], happy);
