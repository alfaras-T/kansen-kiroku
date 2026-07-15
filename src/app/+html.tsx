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
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/favicon.ico" />

        {/* Android/Chromeでスクロールバウンス等を無効化し、ネイティブアプリに近い挙動にする */}
        <ScrollViewStyleReset />

        {/* Service Workerを登録してオフラインキャッシュ・インストール可否に対応 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js').catch(function () {});
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
