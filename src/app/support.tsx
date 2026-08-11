import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
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
  const router = useRouter();
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
      // ネイティブでは外のブラウザを開かない。
      // Web版は開発・検証用で公開していないため、ここから利用者を
      // そちらへ送ってしまうと、配信の方針と食い違う。
      if (router.canGoBack()) router.back();
      else router.replace("/");
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
          Filmsは、野球観戦で撮った写真に日付・スコア・球場を重ねて保存・共有できるアプリです。観戦履歴の記録やマイチームの成績集計もでき、データも画像もすべて端末内にのみ保存されます（サーバーへの送信やアカウント登録は一切ありません）。
        </ThemedText>

        <ThemedText type="smallBold" style={styles.sectionTitle}>
          よくあるご質問
        </ThemedText>

        <QA q="記録したデータはどこに保存されますか？">
          この端末の中にのみ保存されます。サーバーには送信されません。機種変更やアプリのデータ消去で失われるため、画面右上のメニュー（≡）から「設定」を開き、「観戦履歴を書き出す」で定期的にバックアップを取ることをおすすめします。
        </QA>

        <QA q="機種変更したときはどうすればいいですか？">
          機種変更前の端末で、画面右上のメニュー（≡）から「設定」を開き、「観戦履歴を書き出す」を実行して、バックアップファイル（.json）を保存してください。新しい端末でアプリを開き、同じ場所の「バックアップから読み込む」でそのファイルを選ぶと復元されます。{"\n\n"}復元されるのは観戦履歴・設定・フィルムシート用の縮小画像です。作り直し用の元写真は容量が大きいためバックアップに含まれず、機種変更後は「作り直す」が使えなくなります。
        </QA>

        <QA q="写真は加工・保存時にどこかへ送信されますか？">
          送信されません。写真の加工・画像の生成はすべて端末内で行われ、外部のサーバーへアップロードされることはありません。
        </QA>

        <QA q="球団のロゴが使われていないのはなぜですか？">
          著作権・商標に配慮し、公式ロゴ・正式名称（企業名）は使用せず、一般に知られた愛称・略称のみを表示する方針としています。
        </QA>

        <QA q="フィルムシートとは何ですか？">
          その年の観戦を、写真の格子として一枚に並べる機能です。履歴画面の「フィルムシート」から開けます。並ぶのは、画像を書き出したときに残しておいた縮小版です。書き出さずに記録だけ保存した観戦は、日付とスコアだけのコマとして並びます。
        </QA>

        <QA q="作った画像を、あとからスタイルだけ変えられますか？">
          直近20件までは変えられます。編集画面の「この記録で画像を作り直す」から、写真を選び直さずにやり直せます。それより前の記録では、元写真を残していないため使えません。
        </QA>

        <QA q="アプリが写真を端末に保存していると聞きました。消せますか？">
          消せます。本アプリは2種類の画像を、アプリ専用の領域に保管しています。フィルムシート用の縮小画像（記録ごとに1枚）と、作り直し用の元写真（直近20件）です。前者はメニュー（≡）→「設定」の「作った画像を残す」をオフにすると、保存済みのものも含めて削除されます。後者は同じ設定画面から、いつでもまとめて削除できます。どちらも写真アプリ側の写真には影響しません。
        </QA>

        <QA q="観戦履歴の記録を間違えて保存しました。修正できますか？">
          できます。履歴画面で記録をタップすると編集画面が開きます。記録を左にスワイプすると「編集」「削除」が現れ、そこからも操作できます（削除には確認が出ます）。
        </QA>

        <ThemedText type="smallBold" style={styles.sectionTitle}>
          お問い合わせ
        </ThemedText>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={styles.lead}
        >
          上記で解決しない場合や、不具合のご報告・ご要望は、画面右上のメニュー（≡）の「ご要望・お問い合わせ」から、または下記メールアドレスまで直接ご連絡ください。
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
