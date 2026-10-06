// 팽주의 찻장 — 조언 카드의 꼬리표를 눌렀을 때만 열리는 쿠팡 파트너스 안내 (광고)
// 조언 화면(backdrop-blur·container query)은 fixed 를 가두므로 body 로 꺼내 띄운다
import { createPortal } from 'react-dom';
import { playSfx } from '../audio/engine.js';
import { OWNER_NAME } from '../data/scripts.js';
import { SHOP_TEXT } from '../data/shop.js';
import { ingredientIconUrl } from '../utils/assets.js';
import { haptic } from '../utils/haptics.js';
import { ExternalIcon, ThermometerIcon, TimerIcon } from './icons.jsx';
import Sheet from './Sheet.jsx';

const softText = (color) => `color-mix(in srgb, ${color} 62%, white)`;

function NoteTile({ icon, label, value }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 rounded-2xl border border-white/8 bg-white/4 px-1.5 py-2">
      <span className="grid h-6 place-items-center text-lamp-300">{icon}</span>
      <span className="text-[10.5px] tracking-wide text-ink-400">{label}</span>
      <span className="max-w-full truncate font-serif text-[15px] text-ink-100">{value}</span>
    </div>
  );
}

/** 새 창으로 쿠팡을 연다. 쿠팡 파트너스 링크이므로 rel="sponsored" */
function OutLink({ href, className, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored noopener"
      onClick={() => {
        playSfx('tap');
        haptic('light');
      }}
      className={className}
    >
      {children}
      <ExternalIcon className="h-4 w-4 shrink-0 opacity-70" />
      <span className="sr-only">(쿠팡, 새 창)</span>
    </a>
  );
}

export default function ShopSheet({ shop, onClose }) {
  const { leaf, fruit, text } = shop;
  return createPortal(
    <Sheet
      title={SHOP_TEXT.title}
      badge={
        <span className="rounded-full border border-white/20 px-2 py-px font-sans text-[11px] font-normal tracking-wide text-ink-300">
          {SHOP_TEXT.adBadge}
        </span>
      }
      onClose={onClose}
    >
      {/* 쿠팡 파트너스 고지는 링크보다 먼저, 스크롤하지 않아도 보이는 맨 위에 */}
      <p className="-mt-2.5 mb-4 break-keep text-[11px] leading-relaxed text-ink-400">{shop.disclosure}</p>

      {/* 오늘 밤 권한 찻잎 */}
      <div className="flex items-center gap-3.5">
        <div
          className="grid h-14 w-14 shrink-0 place-items-center rounded-[20px] border border-white/10"
          style={{ background: `radial-gradient(circle at 50% 42%, color-mix(in srgb, ${leaf.color} 38%, transparent), transparent 72%)` }}
        >
          <img src={ingredientIconUrl(leaf.icon)} alt="" draggable={false} className="h-9 w-9" />
        </div>
        <div className="min-w-0">
          <p className="font-serif text-[20px] leading-tight text-ink-100">{leaf.name}</p>
          <p className="mt-1 truncate text-[12.5px]" style={{ color: softText(leaf.color) }}>
            {leaf.virtue} · {leaf.image}
          </p>
        </div>
      </div>

      {/* 팽주가 건네는 말 */}
      <div className="relative mt-5 rounded-[20px] border border-white/10 bg-night-900/55 px-4 pb-3.5 pt-4">
        <span className="absolute -top-3 left-4 rounded-full bg-mint-200 px-3 py-0.5 font-serif text-[12.5px] font-bold text-night-900 shadow-md">
          {OWNER_NAME}
        </span>
        <p className="break-keep font-serif text-[14.5px] leading-[1.7] text-ink-100">{text.intro}</p>
      </div>

      {/* 우림 노트 */}
      <p className="mb-2 mt-5 text-[11px] tracking-wide text-ink-400">{SHOP_TEXT.noteLabel}</p>
      <div className="grid grid-cols-3 gap-2">
        <NoteTile icon={<ThermometerIcon className="h-5 w-5" />} label={SHOP_TEXT.water} value={shop.water} />
        <NoteTile icon={<TimerIcon className="h-5 w-5" />} label={SHOP_TEXT.time} value={shop.time} />
        <NoteTile icon={<img src={ingredientIconUrl(fruit.icon)} alt="" draggable={false} className="h-6 w-6" />} label={SHOP_TEXT.fruit} value={fruit.name} />
      </div>
      <div className="mt-2.5 space-y-1 break-keep text-[12.5px] leading-relaxed text-ink-300">
        {shop.tip && <p>{shop.tip}</p>}
        <p>{text.blendTip}</p>
      </div>

      {/* 쿠팡으로 */}
      <OutLink
        href={shop.link}
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-b from-lamp-200 to-lamp-400 px-5 font-serif text-[17px] font-bold text-night-900 shadow-[0_12px_32px_-10px_rgba(245,184,96,0.7)] active:scale-[0.97]"
      >
        {text.buyButton}
      </OutLink>
      {shop.teaware && (
        <OutLink
          href={shop.teaware}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/6 px-4 text-[15px] text-ink-100 active:scale-[0.97]"
        >
          {SHOP_TEXT.teawareButton}
        </OutLink>
      )}

      <p className="mt-4 break-keep text-center text-[12px] leading-relaxed text-ink-300">{SHOP_TEXT.freeNote}</p>

      <button
        type="button"
        onClick={() => {
          playSfx('tap');
          onClose();
        }}
        className="mx-auto mb-1 mt-2 block px-4 py-2.5 text-[13px] text-ink-400"
      >
        {SHOP_TEXT.close}
      </button>
    </Sheet>,
    document.body,
  );
}
