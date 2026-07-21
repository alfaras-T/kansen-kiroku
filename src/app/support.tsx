import { Ionicons } from "@expo/vector-icons";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CONTACT_EMAIL, WEB_BASE_URL } from "@/constants/contact";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

function QA({ q, children }: { q: string; children: React.ReactNode }) {
  const colors = useTheme();
  return (
    <View
      style={[
        styles.qa,
        { borderColor: colors.border, backgroundColor: colors.backgroundElement },
      ]}
    >
      <ThemedText type="smallBold" style={styles.q}>
        Q. {q}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.a}>
        {children}
      </ThemedText>
    </View>
  );
}

export default function SupportScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  function backToApp() {
    if (Platform.OS === "web") {
      // 新規タブで開かれている場合が多く、ブラウザの戻る履歴に頼れないため、
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
              ← Ball Filmsを開く
            </ThemedText>
          </Pressable>
          <ThemedText type="title" style={styles.title}>
            サポート
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Ball Films（観戦きろく）のヘルプ・お問い合わせ
          </ThemedText>
        </View>

        <ThemedText type="smallBold" style={styles.sectionTitle}>
          アプリについて
        </ThemedText>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={styles.lead}
        >
          Ball
          Filmsは、野球観戦で撮った写真に日付・スコア・球場を重ねて保存・共有できるアプリです。観戦履歴の記録やマイチームの成績集計もでき、データはすべて端末内にのみ保存されます（サーバーへの送信やアカウント登録は一切ありません）。
        </ThemedText>

        <ThemedText type="smallBold" style={styles.sectionTitle}>
          よくあるご質問
        </ThemedText>

        <QA q="記録したデータはどこに保存されますか？">
          この端末（アプリ／ブラウザ）の中にのみ保存されます。サーバーには送信されません。機種変更やブラウザのデータ消去で失われるため、設定タブの「観戦履歴を書き出す」で定期的にバックアップを取ることをおすすめします。
        </QA>

        <QA q="機種変更したときはどうすればいいですか？">
          機種変更前の端末で、設定タブの「観戦履歴を書き出す」を実行し、バックアップファイル（.json）を保存してください。新しい端末でアプリを開き、「バックアップから読み込む」でそのファイルを選ぶと、観戦記録が復元されます。
        </QA>

        <QA q="写真は加工・保存時にどこかへ送信されますか？">
          送信されません。写真の加工・画像の生成はすべて端末内で行われ、外部のサーバーへアップロードされることはありません。
        </QA>

        <QA q="球団のロゴが使われていないのはなぜですか？">
          著作権・商標に配慮し、公式ロゴ・正式名称（企業名）は使用せず、一般に知られた愛称・略称のみを表示する方針としています。
        </QA>

        <QA q="観戦履歴の記録を間違えて保存しました。修正できますか？">
          できます。観戦履歴タブで記録をタップする（または鉛筆アイコンをタップする）と、編集画面が開きます。削除はゴミ箱アイコンから行えます（確認ダイアログが表示されます）。
        </QA>

        <ThemedText type="smallBold" style={styles.sectionTitle}>
          お問い合わせ
        </ThemedText>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={styles.lead}
        >
          上記で解決しない場合や、不具合のご報告・ご要望は、アプリ内の設定タブ「ご要望・お問い合わせフォーム」から、または下記メールアドレスまで直接ご連絡ください。
        </ThemedText>
        <View
          style={[
            styles.contactBox,
            { borderColor: colors.accent, backgroundColor: colors.backgroundElement },
          ]}
        >
          <Ionicons name="mail-outline" size={16} color={colors.accent} />
          <ThemedText type="smallBold" themeColor="accent">
            {CONTACT_EMAIL}
          </ThemedText>
        </View>

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
  sectionTitle: { marginTop: Spacing.three, marginBottom: 8 },
  lead: { lineHeight: 21, marginBottom: 4 },
  qa: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  q: { marginBottom: 4 },
  a: { lineHeight: 20 },
  contactBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  footer: { textAlign: "center", marginTop: Spacing.four },
});
