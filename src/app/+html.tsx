import { ScrollViewStyleReset } from 'expo-router/html';

// Web版の <head> をカスタマイズする。
// 配布はネイティブアプリ版が中心だが、iOS Safariの「ホーム画面に追加」で
// プレビューした際にアプリ名の頭文字ではなく正しいアイコンが表示されるよう、
// apple-touch-iconのみ設定する(マニフェスト等のフルPWA対応は行わない)。
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
        <link rel="apple-touch-icon" href="/kansen-kiroku/apple-touch-icon.png" />

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
