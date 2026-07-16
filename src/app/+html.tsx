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
          html/bodyの背景色(デフォルト白)が下部にはみ出して見えてしまう問題への対策。
          高さを確実に画面いっぱいにし、背景色をアプリのテーマ色に合わせる。
        */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                height: 100%;
                min-height: 100%;
                background-color: #0B1220;
                margin: 0;
                padding: 0;
              }
              /* 100dvh(動的ビューポート高さ)が使える環境ではそちらを優先する。
                 ホーム画面に追加したPWA(standalone)モードでは、100%/100vhだけだと
                 実際に見えている画面の高さと合わず、下部に余白ができてしまうことがある。 */
              html {
                height: 100dvh;
                min-height: 100dvh;
                height: -webkit-fill-available;
              }
              body {
                overscroll-behavior: none;
                height: 100dvh;
                min-height: -webkit-fill-available;
              }
            `,
          }}
        />

        {/* Service Workerを登録してオフラインキャッシュ・インストール可否に対応 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/kansen-kiroku/sw.js').catch(function () {});
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
