import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CONTACT_EMAIL, WEB_BASE_URL } from "@/constants/contact";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { Rule, Space } from "@/constants/typography";
import { useTheme } from "@/hooks/use-theme";

const LAST_UPDATED = "2026年8月6日";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const colors = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {title}
      </Text>
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

/**
 * onClose を渡した場合は「アプリ内モーダルとして開かれている」とみなし、
 * 戻るボタンで画面遷移せずモーダルを閉じるだけにする。
 * 渡さない場合（_layout.tsx の RootGate から /privacy · /support を
 * 直接開いた場合。ストア審査担当者はこちらを通る）は従来どおり
 * アプリのトップへ遷移する。
 */
export default function PrivacyScreen({ onClose }: { onClose?: () => void } = {}) {
  const insets = useSafeAreaInsets();
  function backToApp() {
    // アプリ内モーダルで表示中なら、閉じるだけで元の画面に戻る。
    if (onClose) {
      onClose();
      return;
    }
    if (Platform.OS === "web") {
      // ストア審査やURLを直接開いた場合など、アプリ内の遷移履歴を
      // 持たずに開かれることもあるため、履歴に頼らず
      // アプリのトップへ同じタブで直接遷移する。
      window.location.href = `${WEB_BASE_URL}/`;
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
              {onClose ? "← 戻る" : "← Ball Filmsを開く"}
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
            本アプリは、氏名・メールアドレス・位置情報などを、本アプリの機能として取得することはありません。位置情報の利用許可を求めることもありません。
            {"\n\n"}
            例外はお問い合わせのときだけです。お問い合わせは、本文を入力した状態で端末のメールアプリを開く方式です。送信を行うのはご利用のメールアプリであり、本アプリではありません。このとき本文の末尾に、お問い合わせの種別・アプリのバージョン・端末のOS種別（iOS／Android／Web）が自動で添えられます。不具合の状況を把握するためのもので、これ以外の情報は含めていません。
            {"\n\n"}
            なお、メールとして送られる以上、ご利用のメールアドレスと差出人名は開発者に届きます。これは本アプリが取得するものではありませんが、結果として開発者が知ることになる情報です。お知らせしたくない場合は、お問い合わせをお控えいただくか、別のアドレスからご連絡ください。
          </Body>
        </Section>

        <Section title="写真ライブラリへのアクセス">
          <Body>
            本アプリは、次の目的でのみ端末の写真ライブラリへアクセスします。
            {"\n"}・観戦写真を選択し、日付やスコアなどを重ねて加工するため
            {"\n"}・加工後の画像を写真ライブラリへ保存するため
            {"\n\n"}
            選択・生成された画像が本アプリの外部（サーバー等）へ送信されることはありません。ただし、一部の画像は端末内の本アプリ専用の領域に保管されます。詳しくは「端末内に保存される情報」をご覧ください。
          </Body>
        </Section>

        <Section title="端末内に保存される情報">
          <Body>
            本アプリは、次のものを端末の中にのみ保存します。いずれも外部へ送信されません。
            {"\n\n"}
            ■ 文字の情報
            {"\n"}観戦履歴（試合日・球場・対戦カード・スコア・メモ）、マイチーム、お気に入りチーム（配色設定）、最後に使った球場、画像の調整設定など。端末内のストレージ（AsyncStorage／ブラウザのlocalStorage）に保存されます。
            {"\n\n"}
            ■ 画像
            {"\n"}本アプリは、次の2種類の画像を本アプリ専用の保管領域に保存します。写真アプリ側の写真が減ることはありません。
            {"\n"}・フィルムシート（その年の観戦を一枚に並べる機能）のための縮小画像を、記録ごとに1枚。長辺320ピクセルに縮小したものです。初期設定では有効ですが、設定画面で無効にでき、無効にすると保存済みのものも削除されます。
            {"\n"}・作り直しのための元写真を、直近20件分。書き出したあとにスタイルやスコアを直せるようにするためのもので、縮小せずそのまま保管します。設定画面からいつでも削除できます（Web版では保存しません）。
            {"\n\n"}
            観戦記録を削除すると、その記録に対応する画像も一緒に削除されます。アプリを削除する（またはブラウザのデータを消去する）と、上記はすべて失われます。
            {"\n\n"}
            ■ バックアップファイルについて
            {"\n"}設定画面の「観戦履歴を書き出す」で作成されるファイル（.json）には、観戦履歴・各種設定に加えて、フィルムシート用の縮小画像が含まれます。作り直し用の元写真は含まれません。書き出したファイルの保管・共有は利用者ご自身の管理となりますので、第三者と共有される際はご注意ください。
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
  title: { fontSize: 22, lineHeight: 28, marginTop: 10, marginBottom: 2, fontWeight: "700" },
  // 節は上罫線で仕切る。長い規約文が余白だけで並ぶと、どこで話題が
  // 変わったのか分からず、一続きの壁に見える。
  section: {
    paddingTop: Space.row,
    paddingBottom: Space.section,
    borderTopWidth: Rule.hairline,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  body: { lineHeight: 21 },
  footer: { textAlign: "center", marginTop: Spacing.four },
});
