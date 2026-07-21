# Ball Films アプリリリースガイド

Ball Filmsをios App StoreとGoogle Play Storeにリリースするための手順です。

---

## 前提条件

- Apple Developer Program アカウント（$99/年）
- Google Play Developer アカウント（$25, 一度だけ）
- 開発機またはシミュレータ
- Expo CLI と EAS CLI がインストール済み

```bash
npm install -g expo-cli
npm install -g eas-cli
```

---

## 1. EASプロジェクトの初期化

```bash
cd /path/to/kansen-kiroku
eas init
```

このコマンドで以下を求められます：
- **Expo Account**: 既存のアカウントがあれば使用、なければ作成
- **Project ID**: Expoが自動生成するか、カスタム入力

実行後、プロジェクトルートに `eas.json` が作成されます。

---

## 2. `eas.json` の設定

以下は基本的な設定例です：

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "production": {
      "ios": {
        "image": "latest"
      },
      "android": {
        "image": "latest"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "appleTeamId": "XXXXXXXXXX"
      },
      "android": {
        "serviceAccount": "path/to/service-account.json"
      }
    }
  }
}
```

---

## 3. app.json のバージョン確認と更新

アプリをリリースする前に、`app.json` の `version` フィールドを更新してください：

```json
{
  "expo": {
    "version": "1.0.1",
    "ios": {
      "buildNumber": "2"
    },
    "android": {
      "versionCode": 2
    }
  }
}
```

- **version**: セマンティックバージョニング（1.0.0形式）
- **buildNumber** (iOS): 必ず前回より大きい整数
- **versionCode** (Android): 必ず前回より大きい整数

---

## 4. iOS 用ビルド・署名準備

### 4.1 Apple ID のセットアップ

```bash
eas credentials
```

以下を選択：
- `iOS` → `Production` → `App Store`
- **Apple ID**: Apple Developer Programのメールアドレス
- **Apple Team ID**: Apple Developer Centerで確認可能
  - https://developer.apple.com/account/#/membership

### 4.2 ビルド用プロビジョニングプロファイルの作成

Exoがこれを自動で作成・管理します。手動で作成する必要はありません。

---

## 5. Android 用ビルド・署名準備

### 5.1 キーストア（署名用秘密鍵）の設定

```bash
eas credentials
```

以下を選択：
- `Android` → `Production`
- **Keystore**: 既存があれば使用、なければ自動生成

自動生成した場合、キーストアはEAS側で安全に保管されるため、ローカルで秘密鍵を管理する必要がありません。

### 5.2 Google Play Console への登録

Google Play Console (https://play.google.com/console) で：
1. 新しいアプリを作成
2. **App name**: Ball Films
3. **Package name**: `jp.ballfilms.app` (app.json と同じ)
4. **Default language**: 日本語
5. **Category**: グラフィックス・デザイン (または類似)
6. **Content rating**: フォーム送信（アプリの内容に基づいて分類）

---

## 6. iOS ビルドとテスト

### 6.1 ビルド実行

```bash
eas build --platform ios --profile production
```

これにより：
- Exoのクラウドサーバーで iOS アプリがビルドされます
- 完成したら `.ipa` ファイルが生成されます

### 6.2 ローカルテスト（オプション）

```bash
eas build --platform ios --profile production --local
```

ローカルでビルドしたい場合（Xcode 環境が必要）。

---

## 7. Android ビルドとテスト

### 7.1 ビルド実行

```bash
eas build --platform android --profile production
```

これにより：
- Exoのクラウドサーバーで Android アプリがビルドされます
- 完成したら `.aab` (Android App Bundle) ファイルが生成されます

### 7.2 テスト用ビルド（オプション）

内部テスト用に AAB ビルド前に APK（インストール可能ファイル）でテストしたい場合：

```bash
eas build --platform android --profile preview
```

preview 用に `eas.json` に以下を追加：

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

---

## 8. App Store への申請（iOS）

### 8.1 App Store Connect での準備

https://appstoreconnect.apple.com にアクセス：

1. **App Information**
   - **Name**: Ball Films
   - **Subtitle**: 野球観戦写真にスコアを重ねて共有
   - **Description**: 野球観戦で撮った写真に日付・スコア・球場を重ねて保存・共有できるアプリです...
   - **Keywords**: 野球,観戦,写真,スコア,球場

2. **Screenshots**（3.5インチ、5.5インチ、6.5インチ用各4〜5枚）
   - アプリの主な画面を表示
   - テキストは英語が無難（グローバル対応）

3. **Preview**（オプション、15秒以内）

4. **Rating**
   - 暴力: なし
   - 下品・不快: なし
   - 性的コンテンツ: なし
   - その他：適切に選択

5. **Privacy**
   - **Privacy Policy URL**: https://alfaras-t.github.io/kansen-kiroku/privacy
   - 取得データなし（ローカル保存のみ）

### 8.2 ビルド の App Store Connect へのアップロード

```bash
eas submit --platform ios --latest
```

プロンプトで：
- **Apple ID**: 確認
- **Signing Certificate**: 既存の証明書を使用

**または** EAS に自動提出させない場合、手動で Transporter で `.ipa` をアップロード：

```bash
xcrun altool --upload-app -f "build.ipa" -t ios -u "your-apple-id@example.com" -p "app-specific-password"
```

App Specific Password（アプリ用パスワード）を生成（https://appleid.apple.com → Security）

### 8.3 App Store Review への申請

App Store Connect で **Build** を選択し、**Submit for Review** をクリック。

**レビュー期間**: 通常 1〜3 営業日

---

## 9. Google Play Store への申請（Android）

### 9.1 Google Play Console での準備

https://play.google.com/console にアクセス：

1. **App details**
   - **Title**: Ball Films
   - **Short description**: 野球観戦写真にスコアを重ねて共有（80文字以内）
   - **Full description**: 詳細説明（4000文字以内）

2. **Screenshots**（5.5インチ用4〜8枚）
   - Google Play は横向き推奨、縦向き対応も可

3. **App icon**（512x512px、32bit PNG）
   - `assets/images/icon.png` を使用

4. **Feature graphic**（1024x500px、JPEG/PNG）
   - アプリのプロモーション画像

5. **Content rating questionnaire**
   - 自動的に各国の格付け（ESRB、PEGI等）を決定

6. **Pricing & distribution**
   - **Free / Paid**: Free を選択
   - **Countries**: 配布地域（全世界推奨）
   - **Content rating**: 更新

7. **Privacy policy**
   - https://alfaras-t.github.io/kansen-kiroku/privacy

### 9.2 Android App Bundle のアップロード

```bash
eas submit --platform android --latest
```

プロンプトで：
- **Google Play Service Account**: EAS が初回に設定

**または** 手動でアップロード：

https://play.google.com/console → **Release** → **Create new release** → `.aab` ファイルをドラッグ&ドロップ

### 9.3 リリース

**Testing** タブで内部テスト / ベータテスト / 段階的ロールアウト を選択後、**Release to Production** で公開。

**レビュー期間**: 通常 数時間〜24時間

---

## 10. バージョン更新・継続的リリース

### 10.1 アプリを更新する場合

1. **コード修正・機能追加**
2. **バージョン番号を更新**
   ```json
   {
     "version": "1.0.1",
     "ios": { "buildNumber": "2" },
     "android": { "versionCode": 2 }
   }
   ```
3. **Git にコミット**
   ```bash
   git add app.json
   git commit -m "v1.0.1 release"
   ```
4. **新しいビルド作成**
   ```bash
   eas build --platform ios --profile production
   eas build --platform android --profile production
   ```
5. **提出**
   ```bash
   eas submit --platform ios --latest
   eas submit --platform android --latest
   ```

---

## 11. Web 版（GitHub Pages）の更新

Web 版は GitHub Actions で自動公開されます。

- メイン ブランチに `git push` で自動的にビルド・公開
- https://alfaras-t.github.io/kansen-kiroku/ で確認可能

---

## よくある質問

### Q1. ビルド過程でエラーが出た場合

```bash
eas build --platform ios --profile production --logs
```

`--logs` フラッグで詳細ログを確認できます。

### Q2. 署名証明書をリセットしたい場合

```bash
eas credentials
# → 証明書を削除して再生成
```

**注意**: 既にリリース済みのアプリの証明書をリセットすると、次のビルド以降、以前のバージョンとの互換性が失われる可能性があります。

### Q3. App Store Review に落とされた場合

一般的な理由：
- **Metadata**: 説明文や画像が不適切
- **Functionality**: バグや予期しない動作
- **Design**: Apple のガイドライン違反（例：ステータスバー非表示）

→ 修正して再申請可能（無制限）

### Q4. テスト フライト（iOS）やベータ版配布したい

```bash
eas submit --platform ios --latest --profile preview
```

TestFlight に自動提出されます。選んだテスター（メールアドレス）がテスト可能。

### Q5. Play Store の段階的ロールアウトを使いたい

Google Play Console → **Release** → **Staged rollout** で 10%, 25%, 50%, 100% と段階的に公開可能。各段階での不具合報告を受けて判断できます。

---

## チェックリスト

- [ ] `app.json` のバージョン確認
- [ ] EAS プロジェクト初期化（`eas init`）
- [ ] iOS 署名認証情報設定（`eas credentials`）
- [ ] Android キーストア設定（`eas credentials`）
- [ ] App Store Connect でアプリ登録・メタデータ入力
- [ ] Google Play Console でアプリ登録・メタデータ入力
- [ ] iOS ビルド・テスト
- [ ] Android ビルド・テスト
- [ ] App Store へ申請
- [ ] Google Play へ申請

---

## リソース

- **Expo Build Documentation**: https://docs.expo.dev/build/introduction/
- **Expo Submit Documentation**: https://docs.expo.dev/submit/introduction/
- **App Store Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Google Play Policies**: https://play.google.com/about/storelisting-policies/
- **EAS CLI Reference**: https://docs.expo.dev/eas-cli/introduction/

---

## サポート

問題が発生した場合：
- Expo Forums: https://forums.expo.dev
- GitHub Issues: https://github.com/alfaras-T/kansen-kiroku/issues
- Expo Slack: https://expo.io/slack
