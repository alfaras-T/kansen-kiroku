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
          content="野球観戦の写真に日付・スコア・球場を重ねて保存・共有できるアプリ「Ball Films」"
        />

        {/* PWA / ホーム画面追加対応 */}
        <meta name="theme-color" content="#0B1220" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Ball Films" />
        <link rel="manifest" href="/kansen-kiroku/manifest.json" />
        <link rel="apple-touch-icon" href="/kansen-kiroku/apple-touch-icon.png" />
        <link rel="icon" href="/kansen-kiroku/favicon.ico" />

        <title>Ball Films</title>

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
              body {
                overscroll-behavior: none;
              }
            `,
          }}
        />
        {/*
          ホーム画面に追加したPWA(standalone)モードで、コンテンツが画面より短い場合に
          高さがずれてタブバーごと画面下部に固定されない問題への対策。
          パーセンテージ指定(height:100%)はどこか1階層でも途切れると効かなくなるため、
          実際に見えている高さをJavaScriptで測定し、html/body/#root、および
          #root配下の入れ子(最初の子要素)を辿って、ピクセル単位の高さを直接指定する。
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                function getViewportHeight() {
                  return (window.visualViewport && window.visualViewport.height) || window.innerHeight;
                }
                function applyHeight() {
                  var h = getViewportHeight() + 'px';
                  document.documentElement.style.height = h;
                  document.body.style.height = h;
                  var el = document.getElementById('root');
                  var depth = 0;
                  while (el && depth < 2) {
                    el.style.height = h;
                    el.style.minHeight = h;
                    el = el.firstElementChild;
                    depth++;
                  }
                }
                applyHeight();
                window.addEventListener('resize', applyHeight);
                window.addEventListener('orientationchange', applyHeight);
                window.addEventListener('load', applyHeight);
                if (window.visualViewport) {
                  window.visualViewport.addEventListener('resize', applyHeight);
                }
                // 初期レンダリングのタイミングずれ対策として、少し遅らせても再適用する
                setTimeout(applyHeight, 100);
                setTimeout(applyHeight, 500);
                setTimeout(applyHeight, 1500);
                // ハイドレーション完了やスプラッシュの消去でDOM構造が変わった時にも再適用する
                var rootEl = document.getElementById('root');
                if (rootEl && window.MutationObserver) {
                  var pending = false;
                  var observer = new MutationObserver(function () {
                    if (pending) return;
                    pending = true;
                    requestAnimationFrame(function () {
                      pending = false;
                      applyHeight();
                    });
                  });
                  observer.observe(rootEl, { childList: true, subtree: true });
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
          さらに、新しいService Workerが有効化されて制御が切り替わった瞬間に
          一度だけ自動でページを再読み込みし、手動でキャッシュを消さなくても
          最新版がすぐに反映されるようにする。
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                var reloadedForSW = false;
                navigator.serviceWorker.addEventListener('controllerchange', function () {
                  if (reloadedForSW) return;
                  reloadedForSW = true;
                  window.location.reload();
                });
                window.addEventListener('load', function () {
                  navigator.serviceWorker
                    .register('/kansen-kiroku/sw.js?v=3')
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
