// 손님 그림 만들기 — 기존 곰·양·다람쥐와 같은 화풍(512×512 SVG)
//   node assets-src/guest-art/export.mjs            모든 손님
//   node assets-src/guest-art/export.mjs fox_promise  특정 손님만
//
// SVG 원본은 assets-src/guests/ 에, 게임이 쓰는 768×768 투명 PNG 는 public/assets/guests/ 에 저장합니다.
// (보통 표정 이름.png + 정답 뒤 표정 이름_happy.png)
// PNG 로 옮기려면 크롬·엣지와 puppeteer-core 가 필요해요.
//   npm i -D puppeteer-core            (처음 한 번)
//   BROWSER_PATH=브라우저 실행 파일 경로  (없으면 윈도우 엣지 기본 위치를 씁니다)
// 새 손님을 그리려면 guests.mjs 의 GUEST_ART 에 항목을 하나 추가하세요. (부품은 parts.mjs)
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GUEST_ART, renderGuest } from './guests.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(GUEST_ART);
const unknown = keys.filter((key) => !GUEST_ART[key]);
if (unknown.length) {
  console.error(`guests.mjs 에 없는 손님이에요: ${unknown.join(', ')}`);
  process.exit(1);
}

mkdirSync(`${ROOT}assets-src/guests`, { recursive: true });
const jobs = keys.flatMap((key) => [false, true].map((happy) => ({ name: happy ? `${key}_happy` : key, svg: renderGuest(key, happy) })));
for (const { name, svg } of jobs) writeFileSync(`${ROOT}assets-src/guests/${name}.svg`, svg);
console.log(`SVG ${jobs.length}개 → assets-src/guests/`);

let puppeteer;
try {
  puppeteer = (await import('puppeteer-core')).default;
} catch {
  console.log('PNG 는 건너뛰었어요. `npm i -D puppeteer-core` 를 한 번 실행한 뒤 다시 실행해 주세요.');
  process.exit(0);
}
const browser = await puppeteer.launch({
  executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
});
const page = await browser.newPage();
await page.setViewport({ width: 768, height: 768, deviceScaleFactor: 1 });
for (const { name, svg } of jobs) {
  const sized = svg.replace('width="512" height="512"', 'width="768" height="768"');
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${sized}</body></html>`);
  await page.screenshot({ path: `${ROOT}public/assets/guests/${name}.png`, omitBackground: true, clip: { x: 0, y: 0, width: 768, height: 768 } });
}
await browser.close();
console.log(`PNG ${jobs.length}개 → public/assets/guests/`);
