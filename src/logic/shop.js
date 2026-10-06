// 팽주의 찻장: 팽주가 권한 블렌딩의 찻잎을 집에서도 우려 볼 수 있도록 쿠팡 파트너스 링크와 우림 노트를 고른다
import { SHOP, SHOP_TEXT } from '../data/shop.js';
import { blendName, blendParts } from './blend.js';
import { fill } from './josa.js';

const isLink = (value) => typeof value === 'string' && /^https:\/\/\S+$/.test(value.trim());

/**
 * 팽주의 블렌딩 { leafId, fruitId } → 찻장에 보여 줄 찻잎
 * 찻장이 꺼져 있거나, 고지 문구가 없거나, 그 찻잎의 링크가 없으면 null (꼬리표를 띄우지 않는다)
 * @returns {{ leaf, fruit, link, water, time, tip, teaware, disclosure, text: { tag, intro, blendTip, buyButton } } | null}
 */
export function shopFor(blend, shop = SHOP) {
  if (!shop?.enabled || !shop.disclosure?.trim()) return null;
  const parts = blendParts(blend);
  const entry = parts ? shop.leaves?.[parts.leaf.id] : null;
  if (!entry || !isLink(entry.link)) return null;
  const vars = { leaf: parts.leaf.name, fruit: parts.fruit.name, blend: blendName(blend) };
  return {
    leaf: parts.leaf,
    fruit: parts.fruit,
    link: entry.link.trim(),
    water: entry.water ?? '',
    time: entry.time ?? '',
    tip: entry.tip ?? '',
    teaware: isLink(shop.teaware) ? shop.teaware.trim() : null,
    disclosure: shop.disclosure.trim(),
    text: {
      tag: fill(SHOP_TEXT.tag, vars),
      intro: fill(SHOP_TEXT.intro, vars),
      blendTip: fill(SHOP_TEXT.blendTip, vars),
      buyButton: fill(SHOP_TEXT.buyButton, vars),
    },
  };
}

/** npm run check: 찻잎마다 링크·우림 노트가 있는지, 고지 문구가 있는지 */
export function validateShopData(shop, ingredients) {
  const errors = [];
  const warnings = [];
  if (!shop?.enabled) return { errors, warnings, count: 0, enabled: false };
  let count = 0;
  for (const ingredient of ingredients) {
    const entry = shop.leaves?.[ingredient.id];
    const where = `shop.js › SHOP.leaves[${ingredient.id}] (${ingredient.name})`;
    if (!entry?.link) {
      warnings.push(`${where}: 쿠팡 링크가 비어 있어서 이 찻잎은 꼬리표를 띄우지 않아요.`);
      continue;
    }
    if (!isLink(entry.link)) {
      errors.push({ where, problems: [`https://로 시작하는 주소여야 해요. 지금 값: ${entry.link}`] });
      continue;
    }
    count += 1;
    if (!entry.water || !entry.time) warnings.push(`${where}: 우림 노트(water·time)가 비어 있어요.`);
  }
  if (shop.teaware && !isLink(shop.teaware)) {
    errors.push({ where: 'shop.js › SHOP.teaware', problems: [`https://로 시작하는 주소여야 해요. 지금 값: ${shop.teaware}`] });
  }
  if (!shop.disclosure?.includes('쿠팡 파트너스')) {
    errors.push({ where: 'shop.js › SHOP.disclosure', problems: ['쿠팡 파트너스 고지 문구는 꼭 있어야 해요 (파트너스 이용 약관)'] });
  }
  return { errors, warnings, count, enabled: true };
}
