import { useRouter } from "expo-router";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CONTACT_EMAIL, WEB_BASE_URL } from "@/constants/contact";
import { MaxContentWidth, Spacing } from "@/constants/theme";

const LAST_UPDATED = "2026年7月21日";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <ThemedText type="small" themeColor="textSecondary" style={styles.body}>
      {children}
    </ThemedText>
  );
}

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  function backToApp() {
    if (Platform.OS === "web") {
      // アプリ内(設定画面など)から遷移してきた場合は、同一タブ内の
      // クライアントサイド遷移で戻ることで、ページ全体のリロード
      // (白画面フラッシュやスプラッシュの再生)を避ける。
      // 直接URLを開かれた場合など戻り先の履歴がない場合のみ、
      // アプリのトップへ直接遷移する。
      if (router.canGoBack()) {
        router.back();
      } else {
        window.location.href = `${WEB_BASE_URL}/`;
      }
    } else {
      Linking.openURL(WEB_BASE_URL);
    }
  }

  return (
    <ThemedView style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Pressable onPress={backToApp} hitSlop={10}>
            <ThemedText type="link" themeColor="accent">
              ← Ball Filmsを開く
            </ThemedText>
          </Pressable>
          <ThemedText type="title" style={styles.title}>
            プライバシーポリシー
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Ball Films
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            最終更新日: {LAST_UPDATED}
          </ThemedText>
        </View>

        <Section title="基本方針">
          <Body>
            Ball Films（以下「本アプリ」）は、野球観戦の記録・写真加工を行うアプリです。本アプリは、観戦記録・写真・設定などの利用者データを外部のサーバーへ送信しません。すべてのデータは、お使いの端末（スマートフォン・ブラウザ）の中にのみ保存されます。アカウント登録やログインも不要です。
          </Body>
        </Section>

        <Section title="取得する情報">
          <Body>
            本アプリは、利用者を特定できる情報（氏名・メールアドレス・位置情報など）を取得しません。お問い合わせフォームをご利用いただいた場合のみ、送信内容（お問い合わせ本文）が、端末のメールアプリを通じて開発者宛に送られます。これは端末のメールアプリが行う送信であり、本アプリ自体が送信するものではありません。
          </Body>
        </Section>

        <Section title="写真ライブラリへのアクセス">
          <Body>
            本アプリは、次の目的でのみ端末の写真ライブラリへアクセスします。
            {"\n"}・観戦写真を選択し、日付やスコアなどを重ねて加工するため
            {"\n"}・加工後の画像を写真ライブラリへ保存するため
            {"\n\n"}
            選択・生成された画像が本アプリの外部（サーバー等）へ送信されることはありません。
          </Body>
        </Section>

        <Section title="端末内に保存される情報">
          <Body>
            観戦履歴（試合日・球場・対戦カード・スコア・メモ）、マイチーム設定、お気に入りチーム（配色設定）、生成した画像の調整設定などが、端末内のストレージ（AsyncStorage／ブラウザのlocalStorage）に保存されます。これらはアプリを削除する、またはブラウザのデータを消去すると失われます。設定画面の「観戦履歴を書き出す」機能を使うと、これらのデータをファイルとして端末内に書き出し、バックアップとして保管できます。
          </Body>
        </Section>

        <Section title="第三者への提供・広告・解析">
          <Body>
            本アプリは、広告の配信、アクセス解析、第三者への情報提供のいずれも行いません。外部の解析SDKや広告SDKは組み込んでいません。Cookieも使用していません。
          </Body>
        </Section>

        <Section title="球団名・ロゴについて">
          <Body>
            本アプリは、プロ野球球団の公式ロゴ・正式名称（企業名）を使用していません。一般に知られた愛称・略称のみを表示しています。
          </Body>
        </Section>

        <Section title="改定について">
          <Body>
            本ポリシーの内容は、本アプリの機能変更等に応じて予告なく改定される場合があります。重要な変更がある場合は、本ページの内容を更新してお知らせします。
          </Body>
        </Section>

        <Section title="お問い合わせ">
          <Body>
            本ポリシーに関するご質問は、下記メールアドレスまでご連絡ください。
            {"\n"}
            {CONTACT_EMAIL}
          </Body>
        </Section>

        {Platform.OS === "web" && (
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.footer}
          >
            Ball Films
          </ThemedText>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: { marginBottom: Spacing.four, gap: 4 },
  title: { fontSize: 24, lineHeight: 30, marginTop: 8, marginBottom: 4 },
  section: { marginBottom: Spacing.four },
  sectionTitle: { marginBottom: 6 },
  body: { lineHeight: 21 },
  footer: { textAlign: "center", marginTop: Spacing.four },
});
