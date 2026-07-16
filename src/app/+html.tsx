import { ScrollViewStyleReset } from 'expo-router/html';

// Web版の <head> をカスタマイズし、ホーム画面への追加(PWA)に必要な
// メタタグ・マニフェスト・Service Workerの登録を行う。
// See: https://docs.expo.dev/router/reference/static-rendering/#root-html
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta
          name="description"
          content="野球観戦の写真に日付・スコア・球場を重ねて保存・共有できるアプリ「観戦きろく」"
        />

        {/* PWA / ホーム画面追加対応 */}
        <meta name="theme-color" content="#0B1220" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="観戦きろく" />
        <link rel="manifest" href="/kansen-kiroku/manifest.json" />
        <link rel="apple-touch-icon" href="/kansen-kiroku/apple-touch-icon.png" />
        <link rel="icon" href="/kansen-kiroku/favicon.ico" />

        {/* Android/Chromeでスクロールバウンス等を無効化し、ネイティブアプリに近い挙動にする */}
        <ScrollViewStyleReset />

        {/*
          ホーム画面に追加したPWA(standalone)モードで、コンテンツが画面より短い場合に
          高さがずれてタブバーごと画面下部に固定されない問題への対策。
          100%/100vh/100dvhだけでは環境によって実際の表示領域と合わないことがあるため、
          JavaScriptで実際に見えている高さを測定し、CSS変数(--app-height)として
          反映する（モバイルWebの定番の対策方法）。
        */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                height: 100%;
                background-color: #0B1220;
                margin: 0;
                padding: 0;
              }
              html {
                height: var(--app-height, 100%);
              }
              body {
                height: var(--app-height, 100%);
                overscroll-behavior: none;
              }
              #root {
                height: var(--app-height, 100%);
              }
              #root > div {
                height: 100%;
                min-height: 100%;
              }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                function setAppHeight() {
                  var h = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
                  document.documentElement.style.setProperty('--app-height', h + 'px');
                }
                setAppHeight();
                window.addEventListener('resize', setAppHeight);
                window.addEventListener('orientationchange', setAppHeight);
                if (window.visualViewport) {
                  window.visualViewport.addEventListener('resize', setAppHeight);
                }
              })();
            `,
          }}
        />

        {/*
          Service Workerを登録してオフラインキャッシュ・インストール可否に対応。
          sw.js自体がCDN/ブラウザにキャッシュされて更新が遅れることがあるため、
          バージョン付きクエリで取得し、登録後は明示的にupdate()も呼んで
          最新のsw.jsを確実に取りに行くようにする。
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker
                    .register('/kansen-kiroku/sw.js?v=2')
                    .then(function (reg) {
                      reg.update().catch(function () {});
                    })
                    .catch(function () {});
                });
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
