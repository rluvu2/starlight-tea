// 끝없이 이어지는 로파이 피아노 배경 음악 (매번 조금씩 다른 멜로디를 즉흥 생성)
import { bass, bell, piano } from './voices.js';

const BPM = 66;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;

// C장조, IV–iii–ii–I 로 내려오는 포근한 진행과 vi–IV–I–V 진행
const CHORDS = {
  Fmaj7: { bass: 41, notes: [53, 57, 60, 64] },
  Em7: { bass: 40, notes: [52, 55, 59, 62], avoid: [72, 84] },
  Dm7: { bass: 38, notes: [50, 53, 57, 60] },
  Cmaj7: { bass: 36, notes: [48, 52, 55, 59] },
  Am7: { bass: 45, notes: [52, 55, 57, 60] },
  G6: { bass: 43, notes: [50, 52, 55, 59], avoid: [72, 84] },
};
const SECTIONS = {
  A: ['Fmaj7', 'Em7', 'Dm7', 'Cmaj7'],
  B: ['Am7', 'Fmaj7', 'Cmaj7', 'G6'],
};
const FORM = ['A', 'A', 'B', 'A'];

// 멜로디는 펜타토닉 안에서만 움직여 어떤 화음 위에서도 편안하게 들린다
const SCALE = [69, 72, 74, 76, 79, 81, 84];
// [시작 박, 길이(박)]
const RHYTHMS = [
  [],
  [[0, 2]],
  [[1, 1], [2, 2]],
  [[0, 1.5], [1.5, 0.5], [2, 2]],
  [[2, 1], [3, 1]],
  [[0.5, 1.5], [2.5, 1.5]],
  [[0, 3]],
];
const STEPS = [-2, -1, -1, 0, 1, 1, 2];

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const humanize = () => (Math.random() - 0.5) * 0.024;

/** 낡은 LP 판처럼 아주 작게 지직거리는 소리 */
function createCrackle(ac, out) {
  const length = ac.sampleRate * 3;
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] += (Math.random() * 2 - 1) * 0.006;
    if (Math.random() < 0.00028) {
      const amp = (0.25 + Math.random() * 0.5) * (Math.random() < 0.5 ? -1 : 1);
      for (let k = 0; k < 24 && i + k < length; k++) data[i + k] += amp * Math.exp(-k / 3.5);
    }
  }
  const source = ac.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const highpass = ac.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 1100;
  const lowpass = ac.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 5500;
  const level = ac.createGain();
  level.gain.value = 0.12;
  source.connect(highpass).connect(lowpass).connect(level).connect(out);
  source.start();
  return {
    stop() {
      try {
        source.stop();
      } catch {
        /* 이미 멈춤 */
      }
      level.disconnect();
    },
  };
}

export function createMusic(ac, out) {
  // 테이프가 살짝 늘어지는 듯한 음정 흔들림
  const wobbleOsc = ac.createOscillator();
  wobbleOsc.frequency.value = 0.33;
  const wobble = ac.createGain();
  wobble.gain.value = 5;
  wobbleOsc.connect(wobble);
  wobbleOsc.start();

  let timer = null;
  let crackle = null;
  let nextBarTime = 0;
  let bar = 0;
  let melodyIndex = 3;

  function nextMelodyNote(chord) {
    let index = Math.min(SCALE.length - 1, Math.max(0, melodyIndex + pick(STEPS)));
    if (chord.avoid?.includes(SCALE[index])) index = index > melodyIndex ? Math.min(SCALE.length - 1, index + 1) : Math.max(0, index - 1);
    melodyIndex = index;
    return SCALE[index];
  }

  function scheduleBar(barNumber, t) {
    const section = SECTIONS[FORM[Math.floor(barNumber / 4) % FORM.length]];
    const chord = CHORDS[section[barNumber % 4]];

    bass(ac, out, chord.bass, t + humanize(), BAR * 0.98);
    // 아래에서 위로 살짝 굴리듯 치는 화음
    chord.notes.forEach((note, i) => {
      piano(ac, out, note, t + 0.035 * i + humanize(), 0.07 + Math.random() * 0.025, BAR * 0.95, wobble);
    });
    if (Math.random() < 0.6) {
      const at = t + BEAT * (Math.random() < 0.5 ? 2 : 2.5) + humanize();
      chord.notes.slice(-2).forEach((note, i) => piano(ac, out, note, at + 0.03 * i, 0.04, BEAT * 1.8, wobble));
    }

    const rhythm = barNumber < 4 ? pick([RHYTHMS[0], RHYTHMS[1], RHYTHMS[0]]) : pick(RHYTHMS);
    for (const [start, beats] of rhythm) {
      const note = nextMelodyNote(chord);
      piano(ac, out, note, t + start * BEAT + humanize(), 0.06 + Math.random() * 0.03, Math.max(beats * BEAT * 1.4, 1.6), wobble);
    }

    // 가끔 별이 반짝이듯 높은 종소리
    if (Math.random() < 0.16) bell(ac, out, pick([84, 88, 91, 96]), t + BEAT * pick([1.5, 2.5, 3.5]), 0.022, 3);
  }

  function tick() {
    while (nextBarTime < ac.currentTime + 1.2) {
      scheduleBar(bar, nextBarTime);
      nextBarTime += BAR;
      bar += 1;
    }
  }

  return {
    start() {
      if (timer) return;
      nextBarTime = ac.currentTime + 0.2;
      bar = 0;
      melodyIndex = 3;
      tick();
      timer = setInterval(tick, 300);
      crackle = createCrackle(ac, out);
    },
    stop() {
      clearInterval(timer);
      timer = null;
      crackle?.stop();
      crackle = null;
    },
  };
}
