// Web Audio 로 직접 합성하는 악기 소리들 (음원 파일 없이 동작)

export const midiToHz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

const pianoWaves = new WeakMap();
function pianoWave(ac) {
  if (!pianoWaves.has(ac)) {
    // 배음이 빠르게 줄어드는 부드러운 펠트 피아노 음색
    const imag = new Float32Array([0, 1, 0.38, 0.16, 0.08, 0.05, 0.025, 0.012, 0.006]);
    pianoWaves.set(ac, ac.createPeriodicWave(new Float32Array(imag.length), imag));
  }
  return pianoWaves.get(ac);
}

const noiseBuffers = new WeakMap();
export function noiseBuffer(ac) {
  if (!noiseBuffers.has(ac)) {
    const buffer = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ac, buffer);
  }
  return noiseBuffers.get(ac);
}

function envelope(param, time, peak, attack, length, sustainRatio = 0.3) {
  param.setValueAtTime(0.0001, time);
  param.exponentialRampToValueAtTime(peak, time + attack);
  param.exponentialRampToValueAtTime(Math.max(peak * sustainRatio, 0.0002), time + Math.min(0.45, length * 0.4));
  param.exponentialRampToValueAtTime(0.0001, time + length);
}

/** 펠트 피아노: 살짝 어긋난 두 현 + 닫혀 가는 필터 */
export function piano(ac, out, midi, time, velocity, length, wobble) {
  const freq = midiToHz(midi);
  const a = ac.createOscillator();
  const b = ac.createOscillator();
  a.setPeriodicWave(pianoWave(ac));
  b.setPeriodicWave(pianoWave(ac));
  a.frequency.setValueAtTime(freq, time);
  b.frequency.setValueAtTime(freq, time);
  b.detune.setValueAtTime(5, time);

  const bLevel = ac.createGain();
  bLevel.gain.value = 0.6;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.4;
  filter.frequency.setValueAtTime(Math.min(freq * 7, 5200), time);
  filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.6, 380), time + length * 0.7);

  const amp = ac.createGain();
  envelope(amp.gain, time, velocity, 0.012, length, 0.32);

  a.connect(filter);
  b.connect(bLevel).connect(filter);
  filter.connect(amp).connect(out);
  if (wobble) {
    wobble.connect(a.detune);
    wobble.connect(b.detune);
  }
  a.start(time);
  b.start(time);
  a.stop(time + length + 0.05);
  b.stop(time + length + 0.05);
  a.onended = () => {
    try {
      if (wobble) {
        wobble.disconnect(a.detune);
        wobble.disconnect(b.detune);
      }
    } catch {
      /* 이미 연결이 끊긴 경우 */
    }
    amp.disconnect();
  };
}

/** 부드러운 베이스 (폰 스피커에서도 들리도록 한 옥타브 위 배음을 섞음) */
export function bass(ac, out, midi, time, length) {
  const low = ac.createOscillator();
  low.type = 'sine';
  low.frequency.setValueAtTime(midiToHz(midi), time);
  const high = ac.createOscillator();
  high.type = 'triangle';
  high.frequency.setValueAtTime(midiToHz(midi + 12), time);
  const highLevel = ac.createGain();
  highLevel.gain.value = 0.22;
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(0.15, time + 0.05);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + length);
  low.connect(amp);
  high.connect(highLevel).connect(amp);
  amp.connect(out);
  low.start(time);
  high.start(time);
  low.stop(time + length + 0.05);
  high.stop(time + length + 0.05);
  low.onended = () => amp.disconnect();
}

/** 맑은 종소리 (첼레스타/풍경 느낌) */
export function bell(ac, out, midi, time, velocity, length = 2, wet = null, wetLevel = 0.5) {
  const freq = midiToHz(midi);
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(velocity, time + 0.004);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + length);
  const partials = [
    [1, 1],
    [2.0, 0.32],
    [3.01, 0.14],
    [4.2, 0.06],
  ];
  const oscillators = partials.map(([ratio, level]) => {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * ratio, time);
    const gain = ac.createGain();
    gain.gain.value = level;
    osc.connect(gain).connect(amp);
    osc.start(time);
    osc.stop(time + length + 0.05);
    return osc;
  });
  amp.connect(out);
  let send = null;
  if (wet) {
    send = ac.createGain();
    send.gain.value = wetLevel;
    amp.connect(send).connect(wet);
  }
  oscillators[0].onended = () => {
    amp.disconnect();
    send?.disconnect();
  };
}

/** 짧고 둥근 음 (사인파) */
export function softTone(ac, out, midi, time, velocity, length) {
  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(midiToHz(midi), time);
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(velocity, time + 0.03);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + length);
  osc.connect(amp).connect(out);
  osc.start(time);
  osc.stop(time + length + 0.05);
  osc.onended = () => amp.disconnect();
}
