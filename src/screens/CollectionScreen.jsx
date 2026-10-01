import { AnimatePresence, m } from 'framer-motion';
import { useState } from 'react';
import { playSfx } from '../audio/engine.js';
import { IconButton } from '../components/Buttons.jsx';
import GuestImage from '../components/GuestImage.jsx';
import { ChevronLeftIcon, SparkleIcon, StarIcon } from '../components/icons.jsx';
import Sheet from '../components/Sheet.jsx';
import { buildCollection, useGameState } from '../hooks/useGameState.js';
import { formatDate } from '../logic/format.js';
import { INGREDIENT_LIST, ingredientById } from '../logic/gameData.js';
import { ingredientIconUrl } from '../utils/assets.js';
import { haptic } from '../utils/haptics.js';

const STATUS_LABEL = {
  unknown: '아직 찾아오지 않은 손님',
  visited: '꼭 맞는 차를 찾는 중',
  comforted: '마음이 따뜻해진 손님',
};

const softText = (color) => `color-mix(in srgb, ${color} 62%, white)`;

const cardBackground = (status) =>
  status === 'comforted'
    ? 'radial-gradient(circle at 50% 38%, rgba(255,214,150,0.38), rgba(30,37,87,0.55) 72%)'
    : 'radial-gradient(circle at 50% 38%, rgba(130,140,210,0.24), rgba(20,26,66,0.55) 72%)';

const number = (n) => String(n).padStart(3, '0');

function DetailSection({ label, children }) {
  return (
    <div className="mt-4">
      <p className="mb-1.5 text-xs tracking-wider text-ink-400">{label}</p>
      {children}
    </div>
  );
}

function GuestPortrait({ entry, className }) {
  return (
    <GuestImage
      guest={entry.guest}
      mood={entry.status === 'comforted' ? 'happy' : 'default'}
      silhouette={entry.status === 'unknown'}
      className={className}
    />
  );
}

function GuestDetail({ entry, onClose }) {
  const { guest, status, record, visits } = entry;
  const ingredient = record ? ingredientById(record.ingredientId) : null;
  return (
    <Sheet title={status === 'unknown' ? '아직 만나지 못한 손님' : guest.name} onClose={onClose}>
      <div className="relative mx-auto aspect-square w-[62%] overflow-hidden rounded-3xl" style={{ background: cardBackground(status) }}>
        <GuestPortrait entry={entry} className="absolute bottom-[-8%] left-[4%] w-[92%]" />
        <span className="absolute left-2.5 top-2.5 rounded-full bg-night-950/60 px-2 py-0.5 text-[10px] text-ink-300">
          No.{number(entry.number)}
        </span>
      </div>

      {status === 'unknown' ? (
        <p className="mt-5 pb-2 text-center text-[14px] leading-relaxed text-ink-300">별빛을 따라 언젠가 찾아올 거예요.</p>
      ) : (
        <>
          <DetailSection label="들려준 이야기">
            <p className="break-keep font-serif text-[15px] leading-[1.8] text-ink-100">“{guest.story}”</p>
          </DetailSection>
          {status === 'comforted' && ingredient ? (
            <>
              <DetailSection label="마음을 데운 차">
                <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 p-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: `${ingredient.color}26` }}>
                    <img src={ingredientIconUrl(ingredient.icon)} alt="" className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="font-serif text-[15px] text-ink-100">{ingredient.name}</p>
                    <p className="text-xs" style={{ color: softText(ingredient.color) }}>
                      {ingredient.virtue}
                    </p>
                  </div>
                </div>
              </DetailSection>
              <DetailSection label="그날 밤의 한마디">
                <p className="break-keep font-serif text-[15px] leading-[1.8] text-lamp-100">“{guest.perfect_match_dialogue}”</p>
              </DetailSection>
            </>
          ) : (
            <p className="mt-4 break-keep rounded-2xl bg-white/4 px-4 py-3 text-[13.5px] leading-relaxed text-ink-300">
              아직 이 손님의 마음에 꼭 맞는 차를 찾지 못했어요. 다시 찾아오면 다른 차를 내어 드려 볼까요?
            </p>
          )}
          <p className="mt-5 pb-1 text-center text-xs text-ink-400">
            찾아온 횟수 {visits}번{record?.firstAt ? ` · 처음 마음이 데워진 날 ${formatDate(record.firstAt)}` : ''}
          </p>
        </>
      )}
    </Sheet>
  );
}

function GuestGrid({ entries, onOpen }) {
  if (entries.length === 0) {
    return <p className="py-16 text-center text-sm text-ink-400">아직 등록된 손님이 없어요.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 pb-6">
      {entries.map((entry, index) => (
        <m.button
          key={entry.guest.id}
          type="button"
          onClick={() => onOpen(entry.guest.id)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(index, 12) * 0.05 }}
          whileTap={{ scale: 0.97 }}
          className="rounded-3xl border border-white/8 bg-white/4 p-2.5 text-left"
        >
          <div className="relative aspect-square overflow-hidden rounded-2xl" style={{ background: cardBackground(entry.status) }}>
            <GuestPortrait entry={entry} className="absolute bottom-[-8%] left-[4%] w-[92%]" />
            <span className="absolute left-2 top-2 rounded-full bg-night-950/60 px-2 py-0.5 text-[10px] text-ink-300">
              No.{number(entry.number)}
            </span>
            {entry.status === 'comforted' && (
              <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-lamp-300 text-night-900 shadow-[0_0_14px_rgba(255,208,138,0.7)]">
                <StarIcon className="h-4 w-4" />
              </span>
            )}
          </div>
          <p className="mt-2 truncate px-1 font-serif text-[15px] text-ink-100">{entry.status === 'unknown' ? '???' : entry.guest.name}</p>
          <p className="truncate px-1 pb-0.5 text-[12px] text-ink-400">{STATUS_LABEL[entry.status]}</p>
        </m.button>
      ))}
    </div>
  );
}

// 아홉 가지 열매: 찻잎(1위일 때)과 과일(2위일 때), 둘을 잇는 이미지
function TeaList({ entries }) {
  return (
    <div className="space-y-2.5 pb-6">
      <p className="break-keep rounded-2xl border border-lamp-300/15 bg-lamp-300/5 px-4 py-3 text-[12.5px] leading-relaxed text-ink-300">
        팽주는 이야기에 담긴 <b className="font-normal text-lamp-200">1위 마음은 찻잎</b>으로,{' '}
        <b className="font-normal text-lamp-200">2위 마음은 과일</b>로 블렌딩해요. 찻잎 9 × 과일 9, 모두 81가지 차가 있어요.
      </p>
      {INGREDIENT_LIST.map((ing, index) => {
        const names = entries.filter((e) => e.record?.ingredientId === ing.id).map((e) => e.guest.name);
        return (
          <m.div
            key={ing.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="flex gap-3 rounded-2xl border border-white/8 bg-white/4 p-3.5"
          >
            <div
              className="relative h-14 w-14 shrink-0 rounded-2xl"
              style={{ background: `linear-gradient(135deg, ${ing.color}30, ${ing.fruit.color}30)` }}
            >
              <img src={ingredientIconUrl(ing.icon)} alt="" className="absolute left-1 top-1 h-8 w-8" />
              <img src={ingredientIconUrl(ing.fruit.icon)} alt="" className="absolute bottom-1 right-1 h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-serif text-[16px] text-ink-100">
                  {ing.name} <span className="text-ink-400">·</span> {ing.fruit.name}
                </span>
                <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ backgroundColor: `${ing.color}2e`, color: softText(ing.color) }}>
                  {ing.virtue}
                </span>
              </div>
              <p className="mt-0.5 font-serif text-[13px] text-lamp-200">{ing.image}</p>
              <p className="mt-1 break-keep text-[13px] leading-relaxed text-ink-300">{ing.description}</p>
              {names.length > 0 && (
                <p className="mt-1.5 flex items-start gap-1 break-keep text-[12px] text-lamp-300">
                  <SparkleIcon className="mt-0.5 h-3 w-3 shrink-0" />
                  {names.join(', ')}의 마음을 데웠어요
                </p>
              )}
            </div>
          </m.div>
        );
      })}
      <p className="pt-4 text-center text-[11px] leading-relaxed tracking-wide text-ink-400">아홉 가지 열매 · 갈라디아서 5:22–23</p>
    </div>
  );
}

const TABS = [
  ['guests', '손님'],
  ['teas', '찻잎 · 과일'],
];

// 손님 도감: guests.js 의 모든 손님이 자동으로 나열된다 (새 손님은 잠긴 채로)
export default function CollectionScreen({ onClose }) {
  const { state } = useGameState();
  const [tab, setTab] = useState('guests');
  const [detailId, setDetailId] = useState(null);
  const entries = buildCollection(state.save);
  const total = entries.length;
  const comfortedCount = entries.filter((e) => e.status === 'comforted').length;
  const detail = entries.find((e) => e.guest.id === detailId) ?? null;

  return (
    <m.div
      className="fixed inset-0 z-50 bg-night-950/90 backdrop-blur-md"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 32 }}
      transition={{ type: 'spring', damping: 30, stiffness: 260 }}
    >
      <div className="mx-auto flex h-full max-w-md flex-col">
        <header className="px-4 pt-inset">
          <div className="flex items-center gap-3 py-1">
            <IconButton label="닫기" onClick={onClose}>
              <ChevronLeftIcon />
            </IconButton>
            <h1 className="flex-1 font-serif text-xl text-lamp-100">손님 도감</h1>
          </div>

          <div className="mt-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] text-ink-300">마음을 데운 손님</span>
              <span className="font-serif text-[15px] tabular-nums text-ink-100">
                <b className="text-lamp-200">{comfortedCount}</b> / {total}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <m.div
                className="h-full rounded-full bg-linear-to-r from-lamp-300 to-lamp-500"
                initial={{ width: 0 }}
                animate={{ width: `${total ? (comfortedCount / total) * 100 : 0}%` }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
              />
            </div>
          </div>

          <div role="tablist" className="relative mt-3 grid grid-cols-2 rounded-2xl bg-white/5 p-1">
            <span
              aria-hidden="true"
              className="absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-xl bg-lamp-200 transition-transform duration-300 ease-out"
              style={{ transform: tab === 'teas' ? 'translateX(100%)' : 'translateX(0)' }}
            />
            {TABS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => {
                  setTab(key);
                  playSfx('tap');
                  haptic('light');
                }}
                className={`relative h-10 rounded-xl text-[15px] transition-colors ${tab === key ? 'text-night-900' : 'text-ink-300'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-inset">
          {tab === 'guests' ? (
            <GuestGrid
              entries={entries}
              onOpen={(id) => {
                setDetailId(id);
                playSfx('page');
                haptic('light');
              }}
            />
          ) : (
            <TeaList entries={entries} />
          )}
        </div>
      </div>

      <AnimatePresence>{detail && <GuestDetail key={detail.guest.id} entry={detail} onClose={() => setDetailId(null)} />}</AnimatePresence>
    </m.div>
  );
}
