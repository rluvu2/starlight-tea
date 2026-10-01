import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// iOS Safari 는 viewport 의 user-scalable=no 를 무시하므로 핀치 확대를 직접 막는다
document.addEventListener('gesturestart', (event) => event.preventDefault(), { passive: false });
// 길게 눌렀을 때 뜨는 메뉴(이미지 저장 등) 방지 — 고민을 적는 입력창은 예외
window.addEventListener('contextmenu', (event) => {
  if (!(event.target instanceof HTMLTextAreaElement)) event.preventDefault();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
