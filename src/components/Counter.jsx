import { Candle, Teapot } from './teaware.jsx';

// 찻집의 나무 카운터와 소품. children 은 카운터 위에 놓인다 (내어 드린 찻잔 등)
export default function Counter({ children }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-10" style={{ height: 'var(--counter-h)' }}>
      <div className="absolute inset-x-0 top-0 h-3 rounded-t-md bg-linear-to-b from-[#b88866] to-[#8d5f45] shadow-[inset_0_1px_0_rgba(255,226,190,0.45)]" />
      <div
        className="absolute inset-x-0 bottom-0 top-3"
        style={{
          background:
            'repeating-linear-gradient(180deg, rgba(0,0,0,0) 0 11px, rgba(0,0,0,0.1) 11px 12px), linear-gradient(180deg, #6b4535, #3a251e)',
        }}
      />
      <div className="absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-lamp-300/25 bg-black/15 px-3 py-0.5 font-serif text-[11px] tracking-[0.3em] text-lamp-200/75">
        별빛 찻집
      </div>
      <Teapot className="absolute bottom-[calc(100%-10px)] left-[5%] w-[17%] max-w-[76px]" />
      <Candle className="absolute bottom-[calc(100%-8px)] right-[9%] h-[40px] w-[19px]" />
      {children}
    </div>
  );
}
