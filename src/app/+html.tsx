import { ScrollViewStyleReset } from 'expo-router/html';

// Web版の <head> をカスタマイズする。
// このアプリは「ホーム画面に追加して使うアプリ」としては配布しない
// (配布はネイティブアプリ版のみ)。Web版は動作確認用のプレビューとして
// ブラウザで開くだけなので、PWAのインストール可否に関わる設定は持たない。
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
        <meta name="theme-color" content="#0B1220" />
        <link rel="icon" href="/kansen-kiroku/favicon.ico" />

        <title>Ball Films</title>

        {/* Android/Chromeでスクロールバウンス等を無効化し、ネイティブアプリに近い挙動にする */}
        <ScrollViewStyleReset />

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
      </head>
      <body>{children}</body>
    </html>
  );
}
