import { m } from 'framer-motion';
import { playSfx } from '../audio/engine.js';
import { haptic } from '../utils/haptics.js';

/** 누르면 살짝 눌리고(Framer Motion) 소리·진동으로 응답하는 기본 버튼 */
export function TapButton({ onClick, sound = 'tap', feel = 'light', disabled, className = '', children, ...rest }) {
  return (
    <m.button
      type="button"
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 600, damping: 28 }}
      onClick={(event) => {
        if (disabled) return;
        if (sound) playSfx(sound);
        if (feel) haptic(feel);
        onClick?.(event);
      }}
      className={className}
      {...rest}
    >
      {children}
    </m.button>
  );
}

export function PrimaryButton({ className = '', children, ...rest }) {
  return (
    <TapButton
      className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-b from-lamp-200 to-lamp-400 px-5 font-serif text-[17px] font-bold text-night-900 shadow-[0_12px_32px_-10px_rgba(245,184,96,0.7)] transition-[filter,opacity] disabled:from-white/12 disabled:to-white/8 disabled:text-ink-400 disabled:shadow-none ${className}`}
      {...rest}
    >
      {children}
    </TapButton>
  );
}

export function SecondaryButton({ className = '', children, ...rest }) {
  return (
    <TapButton
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/6 px-4 text-[15px] text-ink-100 backdrop-blur-md ${className}`}
      {...rest}
    >
      {children}
    </TapButton>
  );
}

export function IconButton({ label, className = '', children, ...rest }) {
  return (
    <TapButton
      aria-label={label}
      title={label}
      className={`grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-night-800/55 text-ink-200 backdrop-blur-md ${className}`}
      {...rest}
    >
      {children}
    </TapButton>
  );
}
