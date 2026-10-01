import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

/**
 * 배포 설정은 프로젝트 루트의 .env 파일에서 읽는다. (환경변수로 덮어쓸 수도 있다)
 *
 *   BASE_PATH            기본 '/' — 커스텀 도메인(https://내도메인/) 기준
 *                        도메인 연결 전 https://아이디.github.io/저장소이름/ 에서 시험할 때만 '/저장소이름/'
 *   CUSTOM_DOMAIN        커스텀 도메인. 적어 두면 빌드 결과에 CNAME 파일을 만든다.
 *   VITE_ADSENSE_CLIENT  AdSense 게시자 ID(ca-pub-…). 비워 두면 광고 스크립트를 넣지 않는다.
 */

const ADSENSE_CLIENT = /^ca-pub-\d{10,20}$/;

function normalizeBase(value) {
  const path = String(value ?? '').trim();
  if (!path || path === '/') return '/';
  return `/${path.replace(/^\/+|\/+$/g, '')}/`;
}

/**
 * index.html 의 <!-- ADSENSE:START --> … <!-- ADSENSE:END --> 블록을 다룬다.
 * - 게시자 ID가 없으면 블록을 통째로 뺀다 (광고 없이 조언이 바로 열린다)
 * - 개발 서버(npm run dev)에서는 data-adbreak-test="on" 테스트 광고, 배포 빌드에서는 자동으로 제거
 */
function adsenseSnippet({ client, isBuild }) {
  return {
    name: 'starlight-adsense',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const block = /<!-- ADSENSE:START[\s\S]*?ADSENSE:END -->/;
        if (!client) return html.replace(block, '<!-- 광고 꺼짐: .env 의 VITE_ADSENSE_CLIENT 가 비어 있어요 -->');
        let out = html.replace(/%VITE_ADSENSE_CLIENT%/g, client);
        if (isBuild) out = out.replace(/\s*data-adbreak-test="on"/g, '');
        return out;
      },
    },
  };
}

/**
 * 링크 미리보기(카카오톡·SNS 썸네일)는 절대 주소가 필요하다.
 * SITE_URL → 없으면 CUSTOM_DOMAIN → 없으면 GitHub Actions 의 저장소 정보(아이디.github.io/저장소/) 순서로 정한다.
 */
function resolveSiteUrl(env, domain, base) {
  const explicit = env.SITE_URL?.trim();
  if (explicit) return explicit.endsWith('/') ? explicit : `${explicit}/`;
  if (domain) return `https://${domain}${base}`;
  const owner = process.env.GITHUB_REPOSITORY_OWNER;
  return owner ? `https://${owner.toLowerCase()}.github.io${base}` : '';
}

/** index.html 의 %SITE_URL% 을 채운다. 주소를 정할 수 없으면 SITE_META 블록을 뺀다 */
function siteMeta({ siteUrl }) {
  return {
    name: 'starlight-site-meta',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (!siteUrl) return html.replace(/<!-- SITE_META:START[\s\S]*?SITE_META:END -->/, '');
        return html.replace(/%SITE_URL%/g, siteUrl);
      },
    },
  };
}

/** GitHub Pages 배포 마무리: 404.html, CNAME, ads.txt */
function githubPages({ domain, client }) {
  let outDir;
  return {
    name: 'starlight-github-pages',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      // 어떤 주소로 들어와도 게임이 열리도록 (라우터가 없으니 index.html 과 같은 내용이면 된다)
      copyFileSync(join(outDir, 'index.html'), join(outDir, '404.html'));
      if (domain) writeFileSync(join(outDir, 'CNAME'), `${domain}\n`);
      const adsTxt = join(outDir, 'ads.txt');
      if (client && existsSync(adsTxt)) {
        const publisher = client.replace(/^ca-/, '');
        writeFileSync(adsTxt, readFileSync(adsTxt, 'utf8').replace(/pub-X{16}/g, publisher));
      }
    },
  };
}

export default defineConfig(({ command, mode, isPreview }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const client = ADSENSE_CLIENT.test(env.VITE_ADSENSE_CLIENT?.trim() ?? '') ? env.VITE_ADSENSE_CLIENT.trim() : '';
  const domain = env.CUSTOM_DOMAIN?.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '') ?? '';

  return {
    // 개발 서버는 / 에서, 빌드와 미리보기(npm run preview)는 BASE_PATH 에서 연다
    base: command === 'build' || isPreview ? normalizeBase(env.BASE_PATH) : '/',
    plugins: [
      react(),
      tailwindcss(),
      adsenseSnippet({ client, isBuild: command === 'build' }),
      siteMeta({ siteUrl: resolveSiteUrl(env, domain, normalizeBase(env.BASE_PATH)) }),
      githubPages({ domain, client }),
    ],
    build: {
      assetsInlineLimit: 0,
    },
  };
});
