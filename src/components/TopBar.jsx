import { m } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useGameState } from '../hooks/useGameState.js';
import { IconButton } from './Buttons.jsx';
import { BookIcon, GearIcon, StarIcon } from './icons.jsx';

// 상단: 보유 별조각 갯수 + 도감·설정 메뉴
export default function TopBar({ onOpenCollection, onOpenSettings }) {
  const { state } = useGameState();
  const { stars } = state.save;
  // 별조각이 늘면 날아오는 별이 도착할 즈음 숫자가 바뀐다
  const [shown, setShown] = useState(stars);
  useEffect(() => {
    if (stars <= shown) {
      setShown(stars);
      return undefined;
    }
    const timer = setTimeout(() => setShown(stars), 950);
    return () => clearTimeout(timer);
  }, [stars, shown]);

  return (
    <header className="relative z-20 flex items-center justify-between gap-3 px-4 pt-safe">
      <div
        id="star-counter"
        className="flex items-center gap-1.5 rounded-full border border-lamp-300/25 bg-night-800/60 py-1.5 pl-2.5 pr-3.5 backdrop-blur-md"
        aria-label={`보유 별조각 ${shown}개`}
      >
        <StarIcon className="h-4.5 w-4.5 text-lamp-300 drop-shadow-[0_0_6px_rgba(255,208,138,0.8)]" />
        <m.span
          key={shown}
          className="font-serif text-[16px] font-bold tabular-nums text-lamp-100"
          initial={{ scale: 1.5, opacity: 0.4 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18 }}
        >
          {shown}
        </m.span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <IconButton label="손님 도감" sound="page" onClick={onOpenCollection}>
          <BookIcon />
        </IconButton>
        <IconButton label="설정" sound="page" onClick={onOpenSettings}>
          <GearIcon />
        </IconButton>
      </div>
    </header>
  );
}
