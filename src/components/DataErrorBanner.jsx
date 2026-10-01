import { useState } from 'react';
import { DATA_ERRORS, DATA_WARNINGS } from '../logic/gameData.js';

// 개발 모드(npm run dev)에서만 보이는 데이터 오류 안내.
// 기획자가 guests.js 를 고치다 실수하면 화면에서 바로 알 수 있다.
export default function DataErrorBanner() {
  const [open, setOpen] = useState(true);
  if (!open || (DATA_ERRORS.length === 0 && DATA_WARNINGS.length === 0)) return null;

  return (
    <div className="fixed inset-x-3 top-3 z-[100] max-h-[45dvh] overflow-y-auto rounded-2xl border border-rose-300/40 bg-[#3a1626]/95 p-4 text-[13px] leading-relaxed text-rose-50 shadow-2xl backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <p className="font-bold">
          데이터 확인이 필요해요 {DATA_ERRORS.length > 0 && `· 오류 ${DATA_ERRORS.length}개 (해당 항목은 게임에서 빠졌어요)`}
        </p>
        <button type="button" onClick={() => setOpen(false)} className="shrink-0 rounded-full bg-white/10 px-2.5 py-0.5 text-xs">
          닫기
        </button>
      </div>
      <ul className="mt-2 space-y-2">
        {DATA_ERRORS.map((error, i) => (
          <li key={`e${i}`}>
            <p className="font-mono text-[12px] text-rose-200">{error.where}</p>
            <ul className="list-disc pl-5">
              {error.problems.map((problem, j) => (
                <li key={j}>{problem}</li>
              ))}
            </ul>
          </li>
        ))}
        {DATA_WARNINGS.map((warning, i) => (
          <li key={`w${i}`} className="text-amber-100">
            ⚠ {warning}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-rose-200/80">이 안내는 개발 모드에서만 보여요.</p>
    </div>
  );
}
