// 데이터에 적힌 파일명을 실제 이미지 주소로 바꾼다.
// 이미지는 public/assets/ 아래에 두면 빌드 없이도 교체할 수 있다.
import { happyFileName } from '../logic/fileNames.js';

const BASE = import.meta.env.BASE_URL;

const encodePath = (file) => String(file).split('/').map(encodeURIComponent).join('/');

export const guestImageUrl = (file) => `${BASE}assets/guests/${encodePath(file)}`;
export const guestHappyImageUrl = (file) => guestImageUrl(happyFileName(file));
export const ingredientIconUrl = (file) => `${BASE}assets/ingredients/${encodePath(file)}`;
