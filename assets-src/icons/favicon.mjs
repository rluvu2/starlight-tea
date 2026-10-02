// 브라우저 탭 아이콘(파비콘) 만들기
//   node assets-src/icons/favicon.mjs
//
// 앱 아이콘(app-icon.svg)은 16px 탭에서는 별과 찻잔이 뭉개져서, 작은 크기용으로 단순하게 다시 그렸습니다.
// (밤하늘 바탕 + 금빛 별 + 따뜻한 차가 담긴 찻잔)
//   public/favicon.svg  최신 브라우저
//   public/favicon.ico  16·32·48px (SVG 아이콘을 못 쓰는 브라우저, 검색 결과, 도메인 루트의 /favicon.ico 요청)
// PNG 로 옮기려면 크롬·엣지와 puppeteer-core 가 필요해요. (assets-src/guest-art/export.mjs 와 같음)
//   npm i -D puppeteer-core            (처음 한 번)
//   BROWSER_PATH=브라우저 실행 파일 경로  (없으면 윈도우 엣지 기본 위치를 씁니다)
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const ICO_SIZES = [16, 32, 48];

/** 별 모양 (중심 cx, cy · 바깥 반지름 r) */
function star(cx, cy, r, inner = 0.45) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 ? r * inner : r;
    return `${(cx + radius * Math.cos(angle)).toFixed(2)} ${(cy + radius * Math.sin(angle)).toFixed(2)}`;
  });
  return `M ${points.join(' L ')} Z`;
}

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <!-- 별빛 찻집 파비콘: 작은 탭에서도 보이도록 별과 찻잔만 크게 -->
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#151B4A"/>
      <stop offset="1" stop-color="#3B2A6A"/>
    </linearGradient>
    <linearGradient id="tea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F7B267"/>
      <stop offset="1" stop-color="#E0874A"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="15" fill="url(#sky)"/>
  <circle cx="13" cy="13" r="1.6" fill="#FFF3D6" opacity="0.8"/>
  <circle cx="52" cy="20" r="1.3" fill="#FFF3D6" opacity="0.7"/>
  <!-- 금빛 별 -->
  <path d="${star(32, 17.5, 11.5)}" fill="#FFD978" stroke="#F0B44C" stroke-width="1.6" stroke-linejoin="round"/>
  <!-- 손잡이 -->
  <path d="M 47 37.5 C 55 36.5 55 47 46 47.5" fill="none" stroke="#F3E3CC" stroke-width="3.6" stroke-linecap="round"/>
  <!-- 찻잔과 차 -->
  <path d="M 12 34 H 52 C 51.5 46 43.5 54 32 54 C 20.5 54 12.5 46 12 34 Z" fill="#FFF6EA"/>
  <ellipse cx="32" cy="34" rx="20" ry="4.2" fill="url(#tea)"/>
  <path d="M 17 39.5 C 18.5 45 22 48.5 27 50" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" opacity="0.9"/>
  <!-- 받침 -->
  <path d="M 11 57 H 53" stroke="#D9C2A4" stroke-width="3" stroke-linecap="round"/>
</svg>
`;

/** PNG 여러 장을 .ico 하나로 묶는다 (PNG 를 그대로 담는 ICO 형식 — 모든 최신 브라우저·윈도우가 읽음) */
function packIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // 예약
  header.writeUInt16LE(1, 2); // 1 = 아이콘
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // 너비 (256 은 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // 높이
    entry.writeUInt8(0, 2); // 팔레트 색 수
    entry.writeUInt8(0, 3); // 예약
    entry.writeUInt16LE(1, 4); // 색 평면
    entry.writeUInt16LE(32, 6); // 픽셀당 비트
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
}

writeFileSync(`${ROOT}public/favicon.svg`, SVG);
console.log('SVG → public/favicon.svg');

let puppeteer;
try {
  puppeteer = (await import(process.env.PUPPETEER_CORE ? pathToFileURL(process.env.PUPPETEER_CORE).href : 'puppeteer-core')).default;
} catch {
  console.log('favicon.ico 는 건너뛰었어요. `npm i -D puppeteer-core` 를 한 번 실행한 뒤 다시 실행해 주세요.');
  process.exit(0);
}
const browser = await puppeteer.launch({
  executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
});
const page = await browser.newPage();
const images = [];
for (const size of ICO_SIZES) {
  // 작은 크기에서도 벡터 그대로 바로 그려야 선이 또렷하다 (큰 그림을 줄이지 않음)
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  const sized = SVG.replace('width="64" height="64"', `width="${size}" height="${size}"`);
  // display:block — 글자 줄 높이 때문에 16px 그림이 아래로 밀리지 않게
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent"><style>svg{display:block}</style>${sized}</body></html>`);
  const png = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  images.push({ size, png: Buffer.from(png) });
}
await browser.close();
writeFileSync(`${ROOT}public/favicon.ico`, packIco(images));
console.log(`ICO (${ICO_SIZES.join('·')}px) → public/favicon.ico`);
