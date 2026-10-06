import { m } from 'framer-motion';
import { useEffect } from 'react';

// 아래에서 올라오는 시트. 바깥을 누르거나 Esc 를 누르면 닫힌다. badge 는 제목 옆 꼬리표 (예: 광고)
export default function Sheet({ title, badge, onClose, children, className = '' }) {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <m.div className="fixed inset-0 z-[60] flex flex-col justify-end" initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
      <m.div
        className="absolute inset-0 bg-night-950/60 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <m.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative mx-auto max-h-[90dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-[30px] border-t border-white/10 bg-night-800/95 px-5 pb-inset pt-3 shadow-2xl backdrop-blur-xl ${className}`}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 300 }}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/20" />
        {title && (
          <h2 className="mb-4 flex items-center gap-2 font-serif text-lg text-lamp-100">
            {title}
            {badge}
          </h2>
        )}
        {children}
      </m.div>
    </m.div>
  );
}
