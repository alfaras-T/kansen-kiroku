// お問い合わせフォームの送信先。
// mailto 方式のため、ここに設定したアドレスへ「ユーザーのメールアプリから」送られる。
// アプリがサーバーへ送信することはない。
export const CONTACT_EMAIL = "info.ballfilms.jp@gmail.com";

// 公開中のWeb版のURL。プライバシーポリシー/サポートページは、アプリ内の
// クライアントサイドルーティング(タブ内遷移)と衝突する構造上の理由から、
// アプリ内リンクからも実際のページ遷移(Linking.openURL)で開く。
// ストア審査担当者が直接開く場合と同じ経路になるため、挙動の一貫性も保てる。
export const WEB_BASE_URL = "https://alfaras-t.github.io/kansen-kiroku";
