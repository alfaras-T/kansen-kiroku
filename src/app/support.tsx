import { Ionicons } from "@expo/vector-icons";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CONTACT_EMAIL, WEB_BASE_URL } from "@/constants/contact";
import { MaxContentWidth, Spacing, Radius } from "@/constants/theme";
import { Rule, Space } from "@/constants/typography";
import { useTheme } from "@/hooks/use-theme";

function QA({ q, children }: { q: string; children: React.ReactNode }) {
  const colors = useTheme();
  return (
    <View style={[styles.qa, { borderBottomColor: colors.border }]}>
      <ThemedText type="smallBold" style={styles.q}>
        {q}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.a}>
        {children}
      </ThemedText>
    </View>
  );
}

/**
 * onClose を渡した場合は「アプリ内モーダルとして開かれている」とみなし、
 * 戻るボタンで画面遷移せずモーダルを閉じるだけにする。
 * 渡さない場合（_layout.tsx の RootGate から /privacy · /support を
 * 直接開いた場合。ストア審査担当者はこちらを通る）は従来どおり
 * アプリのトップへ遷移する。
 */
export default function SupportScreen({ onClose }: { onClose?: () => void } = {}) {
  const colors = useTheme();
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
            サポート
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Ball Filmsのヘルプ・お問い合わせ
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
          この端末の中にのみ保存されます。サーバーには送信されません。機種変更やアプリのデータ消去で失われるため、設定タブの「観戦履歴を書き出す」で定期的にバックアップを取ることをおすすめします。
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
        <View style={[styles.contactRow, { borderTopColor: colors.border }]}>
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
  title: { fontSize: 22, lineHeight: 28, marginTop: 10, marginBottom: 2, fontWeight: "700" },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: Space.section,
    marginBottom: 8,
  },
  lead: { lineHeight: 21, marginBottom: 4 },
  // 質問と答えを枠で囲うと、全ての問いが同じ重さの箱として並ぶ。
  // 罫線で区切れば、問いの見出しが縦に並んで拾い読みしやすい。
  qa: { paddingVertical: 14, borderBottomWidth: Rule.hairline },
  q: { marginBottom: 5, fontSize: 14.5 },
  a: { lineHeight: 21 },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: Rule.hairline,
    paddingTop: 14,
    marginTop: 12,
  },
  footer: { textAlign: "center", marginTop: Spacing.four },
});
