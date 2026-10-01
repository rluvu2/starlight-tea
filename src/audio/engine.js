// 오디오 엔진: AudioContext 하나에 배경 음악 / 효과음 / 잔향을 연결해 관리한다.
// 브라우저 정책상 소리는 사용자의 첫 터치 이후에만 시작할 수 있다 (unlockAudio).
import { createMusic } from './music.js';
import * as sfx from './sfx.js';

const MUSIC_LEVEL = 0.85;
const SFX_LEVEL = 0.85;

const SOUNDS = {
  tap: sfx.tap,
  select: sfx.select,
  chime: sfx.chime,
  farewell: sfx.farewell,
  plop: sfx.plop,
  full: sfx.full,
  serve: sfx.serve,
  sparkle: sfx.sparkle,
  soft: sfx.soft,
  page: sfx.page,
  star: sfx.star,
};

let ctx = null;
let graph = null;
let music = null;
let musicEnabled = true;
let sfxEnabled = true;
let musicPlaying = false;
let stopTimer = null;
let adPlaying = false; // 광고가 재생되는 동안에는 소리를 멈춰 둔다

function makeImpulse(ac, seconds, decay) {
  const length = Math.floor(ac.sampleRate * seconds);
  const impulse = ac.createBuffer(2, length, ac.sampleRate);
  const fadeIn = ac.sampleRate * 0.01;
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const tail = Math.pow(1 - i / length, decay);
      data[i] = (Math.random() * 2 - 1) * tail * Math.min(1, i / fadeIn);
    }
  }
  return impulse;
}

function buildGraph(ac) {
  const master = ac.createGain();
  master.gain.value = 0.9;
  const limiter = ac.createDynamicsCompressor();
  limiter.threshold.value = -12;
  limiter.knee.value = 10;
  limiter.ratio.value = 4;
  limiter.attack.value = 0.005;
  limiter.release.value = 0.25;
  master.connect(limiter).connect(ac.destination);

  const reverb = ac.createConvolver();
  reverb.buffer = makeImpulse(ac, 3.2, 2.6);
  const reverbReturn = ac.createGain();
  reverbReturn.gain.value = 0.35;
  reverb.connect(reverbReturn).connect(master);

  // 음악: 악기들 → 톤(로파이 필터) → 페이더 → 마스터 (+ 페이더 뒤에서 잔향으로)
  const musicIn = ac.createGain();
  const musicTone = ac.createBiquadFilter();
  musicTone.type = 'lowpass';
  musicTone.frequency.value = 3400;
  musicTone.Q.value = 0.4;
  const musicFader = ac.createGain();
  musicFader.gain.value = 0;
  const musicSend = ac.createGain();
  musicSend.gain.value = 0.8;
  musicIn.connect(musicTone).connect(musicFader).connect(master);
  musicFader.connect(musicSend).connect(reverb);

  // 효과음: 건조한 출력 + 소리마다 따로 보내는 잔향
  const sfxOut = ac.createGain();
  sfxOut.gain.value = SFX_LEVEL;
  sfxOut.connect(master);
  const sfxWet = ac.createGain();
  sfxWet.gain.value = SFX_LEVEL;
  sfxWet.connect(reverb);

  return { musicIn, musicFader, sfxOut, sfxWet };
}

function fadeMusic(target, seconds) {
  const gain = graph.musicFader.gain;
  const now = ctx.currentTime;
  gain.cancelScheduledValues(now);
  gain.setValueAtTime(gain.value, now);
  gain.linearRampToValueAtTime(target, now + seconds);
}

function startMusic() {
  if (!ctx || musicPlaying) return;
  clearTimeout(stopTimer);
  musicPlaying = true;
  music.start();
  fadeMusic(MUSIC_LEVEL, 2.5);
}

function stopMusic() {
  if (!ctx || !musicPlaying) return;
  musicPlaying = false;
  fadeMusic(0, 0.8);
  stopTimer = setTimeout(() => {
    if (!musicPlaying) music.stop();
  }, 900);
}

/** 사용자 터치 이벤트 안에서 호출해야 한다. 여러 번 불러도 안전하다. */
export function unlockAudio() {
  try {
    if (!ctx) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      ctx = new AudioCtor();
      graph = buildGraph(ctx);
      music = createMusic(ctx, graph.musicIn);
      // 구형 iOS 잠금 해제용 무음 버퍼
      const silent = ctx.createBufferSource();
      silent.buffer = ctx.createBuffer(1, 1, 22050);
      silent.connect(ctx.destination);
      silent.start(0);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) ctx.suspend().catch(() => {});
        else if (!adPlaying) ctx.resume().catch(() => {});
      });
    }
    if (ctx.state !== 'running' && !document.hidden && !adPlaying) ctx.resume().catch(() => {});
    if (musicEnabled) startMusic();
  } catch {
    /* 오디오를 쓸 수 없는 환경이면 조용히 넘어간다 */
  }
}

export function setMusicEnabled(on) {
  musicEnabled = on;
  if (!ctx) return;
  if (on) startMusic();
  else stopMusic();
}

export function setSfxEnabled(on) {
  sfxEnabled = on;
}

export function playSfx(name) {
  if (!ctx || !sfxEnabled || ctx.state !== 'running') return;
  try {
    SOUNDS[name]?.(ctx, { out: graph.sfxOut, wet: graph.sfxWet });
  } catch {
    /* 효과음 하나 실패해도 게임은 계속 */
  }
}

/** 보상형 광고가 화면에 뜨기 직전: 배경 음악과 효과음을 잠시 멈춘다 */
export function pauseForAd() {
  adPlaying = true;
  ctx?.suspend().catch(() => {});
}

/** 광고가 끝난 뒤: 다시 재생한다 */
export function resumeAfterAd() {
  adPlaying = false;
  if (ctx && !document.hidden) ctx.resume().catch(() => {});
}
