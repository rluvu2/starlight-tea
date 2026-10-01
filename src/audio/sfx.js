// 효과음 모음. 모두 Web Audio 로 합성한다.
// 각 함수는 (AudioContext, { out: 건조한 출력, wet: 잔향 입력 }) 을 받는다.
import { bell, noiseBuffer, softTone } from './voices.js';

const shuffle = (list) => [...list].sort(() => Math.random() - 0.5);

/** 버튼, 대사 넘김: 아주 작은 '톡' */
export function tap(ac, { out }) {
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(900, t);
  osc.frequency.exponentialRampToValueAtTime(560, t + 0.06);
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(0.07, t + 0.004);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  osc.connect(amp).connect(out);
  osc.start(t);
  osc.stop(t + 0.1);
  osc.onended = () => amp.disconnect();
}

/** 재료 고르기 */
export function select(ac, { out, wet }) {
  bell(ac, out, 88, ac.currentTime, 0.045, 0.9, wet, 0.25);
}

/** 손님 입장: 문에 달린 풍경 */
export function chime(ac, { out, wet }) {
  const t = ac.currentTime + 0.02;
  shuffle([84, 86, 88, 91, 93, 96])
    .slice(0, 4)
    .forEach((note, i) => bell(ac, out, note, t + i * (0.09 + Math.random() * 0.07), 0.045 - i * 0.006, 2.4, wet, 0.7));
}

/** 손님 퇴장: 조금 더 작고 낮게 */
export function farewell(ac, { out, wet }) {
  const t = ac.currentTime + 0.02;
  [91, 88, 84].forEach((note, i) => bell(ac, out, note, t + i * 0.13, 0.03, 2.2, wet, 0.7));
}

/** 재료가 찻주전자에 퐁 */
export function plop(ac, { out, wet }) {
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(280, t);
  osc.frequency.exponentialRampToValueAtTime(820, t + 0.07);
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  const send = ac.createGain();
  send.gain.value = 0.3;
  osc.connect(amp).connect(out);
  amp.connect(send).connect(wet);
  osc.start(t);
  osc.stop(t + 0.2);
  osc.onended = () => {
    amp.disconnect();
    send.disconnect();
  };
}

/** 찻잔이 가득 찼을 때 */
export function full(ac, { out, wet }) {
  const t = ac.currentTime;
  bell(ac, out, 84, t, 0.05, 1.8, wet, 0.5);
  bell(ac, out, 91, t + 0.09, 0.035, 1.8, wet, 0.5);
}

/** 찻잔을 내려놓는 소리: 도자기 '딸깍' */
export function serve(ac, { out, wet }) {
  const t = ac.currentTime;
  [
    [2350, 0.05],
    [3480, 0.03],
    [5120, 0.015],
  ].forEach(([freq, level]) => {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    const amp = ac.createGain();
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(level, t + 0.002);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    const send = ac.createGain();
    send.gain.value = 0.25;
    osc.connect(amp).connect(out);
    amp.connect(send).connect(wet);
    osc.start(t);
    osc.stop(t + 0.4);
    osc.onended = () => {
      amp.disconnect();
      send.disconnect();
    };
  });
}

/** 정답: 별이 쏟아지는 아르페지오 */
export function sparkle(ac, { out, wet }) {
  const t = ac.currentTime + 0.02;
  [72, 76, 79, 84, 88, 91, 96].forEach((note, i) => bell(ac, out, note, t + i * 0.075, 0.045, 2.4, wet, 0.8));
}

/** 오답: 부드럽게 내려가는 두 음 (실패의 느낌보다는 '음…') */
export function soft(ac, { out }) {
  const t = ac.currentTime;
  softTone(ac, out, 69, t, 0.06, 0.5);
  softTone(ac, out, 65, t + 0.16, 0.05, 0.7);
}

/** 도감·설정 열기: 사락 넘기는 바람 소리 */
export function page(ac, { out }) {
  const t = ac.currentTime;
  const source = ac.createBufferSource();
  source.buffer = noiseBuffer(ac);
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 0.9;
  filter.frequency.setValueAtTime(500, t);
  filter.frequency.exponentialRampToValueAtTime(2200, t + 0.22);
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(0.16, t + 0.05);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
  source.connect(filter).connect(amp).connect(out);
  source.start(t);
  source.stop(t + 0.3);
  source.onended = () => amp.disconnect();
}

/** 별조각 획득: 반짝 올라가는 두 음 */
export function star(ac, { out, wet }) {
  const t = ac.currentTime + 0.05;
  bell(ac, out, 91, t, 0.05, 1.6, wet, 0.6);
  bell(ac, out, 96, t + 0.11, 0.045, 2, wet, 0.7);
}
