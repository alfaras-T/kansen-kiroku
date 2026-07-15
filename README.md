# 観戦きろく（kansen-kiroku）

野球観戦の写真に、日付・スコア・球場をシンプルに重ねて保存・共有できるアプリです。
球団のロゴ・正式名称等のビジュアル商標は使用せず、一般的な愛称と略称のみを表示します。

Expo（React Native / TypeScript）製で、iOS・Android両方に対応しています。
観戦記録はサーバーに送信せず、**この端末内（AsyncStorage）にのみ保存**されます。ログインは不要です。

## 主な機能

- 写真を選んで日付・スコア・球場を重ねて保存 / 共有（写真なしでも記録カードを作成可能）
- 出力サイズ：元の写真のまま / スクエア(1:1) / ストーリー(9:16)
- 表示位置：右下・左下・右上・左上から選択
- スタイル：ナイター(アンバー)・デイゲーム(モノクロ)・レトロ(グリーン)の3プリセット
- 勝敗ハイライト、引き分け・延長表記、座席メモ(任意)
- 観戦履歴の記録・一覧・削除、マイチーム設定による通算成績(◯勝◯敗◯分)の自動集計

## 技術構成

- [Expo](https://expo.dev/) SDK 57 / React Native 0.86 / React 19（TypeScript, Expo Router）
- ナビゲーション: `expo-router`（タブ: 記録する / 観戦履歴）
- 画像選択: `expo-image-picker`
- 画像合成・書き出し: `react-native-view-shot`
- 保存・共有: `expo-media-library`, `expo-sharing`
- ローカル永続化: `@react-native-async-storage/async-storage`（この端末のみ、アカウント不要）
- 日付選択: `@react-native-community/datetimepicker`
- フォント: `@expo-google-fonts/oswald`, `@expo-google-fonts/jetbrains-mono`
- アイコン: `@expo/vector-icons`

## セットアップ（ローカルで動かす）

```bash
npm install
npx expo start
```

QRコードをスマートフォンの **Expo Go** アプリ（App Store / Google Playで入手）で読み取ると、その場で動作確認できます。
Macがあれば `npx expo start --ios` でiOSシミュレータ、`npx expo start --android` でAndroidエミュレータでも確認できます。

## コード検証について

このリポジトリは以下を実行し、エラーがないことを確認済みです。

```bash
npx tsc --noEmit        # 型チェック（エラー0件）
npx expo export --platform ios   # iOS向けMetroバンドル（1625モジュール、正常にビルド）
npx expo export --platform web   # Web向けMetroバンドル（正常にビルド）
```

ただし実機・シミュレータでの実際の画面動作までは確認していないため、`npx expo start` で一度実機確認してから
先の工程に進むことをおすすめします。

## GitHubで管理する

このプロジェクトはすでに `git init` 済みで、初回コミットも作成されています。GitHub側に空のリポジトリを
作ってリモートを追加すれば、そのままプッシュできます。

1. https://github.com/new で新しいリポジトリを作成する（README等は追加しないで「空」の状態で作成）
2. 作成後に表示されるURLを使って、このフォルダで以下を実行:

```bash
git remote add origin https://github.com/<あなたのユーザー名>/<リポジトリ名>.git
git branch -M main
git push -u origin main
```

GitHub CLI（`gh`）がインストール済みなら、次の1コマンドでリポジトリ作成〜プッシュまで完結します。

```bash
gh repo create <リポジトリ名> --private --source=. --remote=origin --push
```

### GitHubにしておくメリット

- 変更履歴が残るので、機能追加や不具合修正のたびに前の状態へ戻せる
- EAS Build は GitHub リポジトリと連携でき、`git push` するたびに自動でビルドを走らせる設定も可能
  （[EAS GitHubアプリの連携](https://docs.expo.dev/eas/github/)）
- 万一この端末が使えなくなっても、コードがクラウド上に残る

## 進め方について

このアプリはExpo製で、**同じコードから Web / iOS / Android** をすべて作れます。
今のフェーズでは「まずWebページとして公開し、将来的に同じコードからネイティブアプリ(App Store /
Google Play)を作る」という方針で進めています。

## Webページとして公開する（今のフェーズ）

### ローカルで確認する

```bash
npm install
npx expo start --web
```

ブラウザで `http://localhost:8081` が開きます。スマホの実機で確認したい場合は、パソコンと
同じWi-Fiに接続したスマホのブラウザで、ターミナルに表示されるネットワークURL（`http://<パソコンのIP>:8081`
など）を開いてください。

### 本番用に書き出す

```bash
npx expo export --platform web
```

`dist/` フォルダに、そのままどこにでもアップロードできる静的サイト一式が生成されます。

### ホスティング先のおすすめ

まだホスティング先が決まっていないとのことなので、用途別におすすめを挙げます。

| サービス | おすすめ度 | 特徴 |
|---|---|---|
| **Vercel** | ◎ まず迷ったらここ | GitHubリポジトリを連携するだけで、`git push`のたびに自動で公開・更新される。無料枠で十分 |
| **GitHub Pages** | ○ 完全無料に強いこだわりがあれば | 既に作成したGitHubリポジトリからそのまま公開できる。設定がやや手動 |
| **EAS Hosting** | ○ Expoで統一したい場合 | `eas deploy` コマンドで公開。Expoエコシステム内で完結する |

**Vercelを使う場合の流れ（推奨）**

1. https://vercel.com にGitHubアカウントでログイン
2. 「Add New Project」→ 観戦きろくのGitHubリポジトリを選択
3. Build Command に `npx expo export --platform web`、Output Directory に `dist` を指定
4. デプロイすると発行されるURLがそのまま公開ページになる（以後 `git push` するたびに自動更新）

### スマホの「ホーム画面に追加」でアプリのように使う（PWA対応済み）

このプロジェクトにはあらかじめPWA（Progressive Web App）対応を入れてあります。公開したURLを
スマホのブラウザで開き、以下の操作をすると、ホーム画面にアイコンが追加され、ブラウザのアドレスバー
なしでアプリのように起動できます。

- **iOS（Safari）**: 共有ボタン →「ホーム画面に追加」
- **Android（Chrome）**: メニュー →「アプリをインストール」（自動で案内が出ることもあります）

内部的には `public/manifest.json`（アプリ名・アイコン・起動時の見た目を定義）と
`public/sw.js`（オフラインでも開けるようにするService Worker）、`src/app/+html.tsx`
（関連メタタグの挿入）で構成されています。App Store / Google Play審査は不要なので、
今すぐ「アプリっぽく使える」状態にできます。

## App Store / Google Playへの公開手順（将来のフェーズ）

このアプリは「将来的にネイティブアプリとしてストア公開したい」という方針に合わせて、
Expoの標準的なマネージドワークフローで構築しています。公開までの大まかな流れは以下の通りです。

### 1. アプリ情報の確定・差し替え

- `app.json` の `ios.bundleIdentifier` / `android.package` を、実際に使用する一意のIDに変更してください（現在は仮の `com.example.kansenkiroku`）
- アプリアイコン・favicon・PWAアイコンは、ネイビー×アンバーの「ダイヤモンド」モチーフでオリジナル生成済みです（`assets/images/icon.png` 等）。気に入らない場合や本格的なブランディングをする場合は差し替えてください
- iOS 18以降向けの新しいアイコン形式（`assets/expo.icon`、Liquid Glass対応）は今回未対応で、Expoのデフォルトのままです。ネイティブアプリ公開前に対応をおすすめします
- アプリ名 (`app.json` の `name`) やストア掲載用のスクリーンショット・説明文も別途準備が必要です

### 2. アカウント準備

- **Apple Developer Program**（年額 $99）への登録
- **Google Play Console**（初回 $25の登録料）への登録
- 無料の [Expo (EAS)](https://expo.dev/) アカウント作成

### 3. ビルド（EAS Build）

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios
eas build --platform android
```

初回は `eas build:configure` の対話で `eas.json` が生成されます。iOSビルドにはApple Developer
アカウントの認証情報の入力（EASが対話形式でサポートします）が必要です。

### 4. 提出（EAS Submit）

```bash
eas submit --platform ios
eas submit --platform android
```

### 5. プライバシーポリシーの用意

このアプリは観戦記録をサーバーに送信しませんが、写真ライブラリへのアクセス・保存を行うため、
App Store / Google Playの審査では**プライバシーポリシーのURL**が必須です。「データは端末内にのみ保存し、
外部送信・第三者提供は行わない」旨を明記したページを用意し、`app.json` やストア掲載情報に記載してください。

## 商標について（継続して守ってほしい方針）

- 球団のロゴ・マスコット・ユニフォーム等のビジュアル商標は使用しない
- 球団の正式名称・企業名（例：読売ジャイアンツ、福岡ソフトバンクホークス）は使用せず、
  一般的な愛称（ジャイアンツ、ホークス 等）と略称（G、H 等）のみを表示する
- アプリを商用展開・大きく公開する場合は、念のため各球団のプロパティ利用規定を確認することをおすすめします

## 既知の制約・今後の改善候補

- 観戦記録は端末ローカル保存のみのため、機種変更時にはデータが引き継がれません（将来的にiCloud/Google
  Driveへのバックアップや、アカウントを使った複数端末同期を追加する余地があります）
- iOS 18以降向けの新アイコン形式（`assets/expo.icon`）は未対応。ネイティブアプリ公開前に用意をおすすめします
- 実機・シミュレータ・実ブラウザでの最終的な見た目確認は未実施です（型チェック・Metro/Web静的ビルドの検証のみ完了）
- ダークモード固定のデザインです（システムのライト/ダーク切り替えには追従しません）
- Web版はReact Native Web経由のため、JSバンドルがやや大きめです（現状 約2.7MB）。読み込み速度が気になる場合は、将来的にコード分割等の最適化の余地があります
