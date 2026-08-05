import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CONTACT_EMAIL } from "@/constants/contact";
import { useTheme } from "@/hooks/use-theme";
import { Radius } from "@/constants/theme";
import { notify, openMailComposer } from "@/utils/dialogs";

const CATEGORIES = [
  { label: "ご要望・機能のリクエスト", value: "ご要望" },
  { label: "不具合の報告", value: "不具合" },
  { label: "その他", value: "その他" },
];

/**
 * お問い合わせ。プライバシーポリシー・サポートと同じく独立した画面として
 * 扱う。メニューに並ぶ4つが、どれも同じ深さ・同じ開き方になる。
 *
 * onClose は閉じる操作。ネイティブではモーダルを閉じ、Webでは前の画面に
 * 戻る。呼び出し側が渡す。
 */
export function ContactSheet({ onClose }: { onClose: () => void }) {
  const colors = useTheme();
  // Modal内では SafeAreaView(ネイティブ計測)が効かず0になる。
  // context経由の useSafeAreaInsets は正しい値が届くのでこちらを使う。
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  function reset() {
    setCategory(CATEGORIES[0].value);
    setMessage("");
  }

  async function handleSend() {
    if (sending) return;
    const trimmed = message.trim();
    if (!trimmed) {
      notify("内容が空です", "ご要望・お問い合わせの内容を入力してください。");
      return;
    }
    setSending(true);
    // メール本文の末尾に環境情報を添える（不具合調査の手がかり用。個人データは含めない）。
    const footer = `\n\n----------------\n種別: ${category}\nアプリ: Ball Films v${appVersion}\n端末: ${Platform.OS}`;
    // ここで投げると誰も受け取らず、アプリごと落ちる。
    // 送信は「失敗しても案内に落ちる」だけで済ませる。
    let ok = false;
    try {
      ok = await openMailComposer({
        to: CONTACT_EMAIL,
        subject: `【Ball Films】${category}`,
        body: `${trimmed}${footer}`,
      });
    } catch (e) {
      console.warn("お問い合わせの送信に失敗しました", e);
      ok = false;
    } finally {
      setSending(false);
    }
    if (ok) {
      reset();
      onClose();
    } else {
      notify(
        "メールアプリを開けませんでした",
        `お手数ですが、${CONTACT_EMAIL} 宛に直接メールをお送りください。`,
      );
    }
  }

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.pageHeader}>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="戻る"
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          <Text style={[styles.backLabel, { color: colors.text }]}>戻る</Text>
        </Pressable>
        <Text style={[styles.pageTitle, { color: colors.text }]}>
          ご要望・お問い合わせ
        </Text>
      </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            種別
          </Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((c) => {
              const selected = c.value === category;
              return (
                <Pressable
                  key={c.value}
                  onPress={() => setCategory(c.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={styles.categoryChip}
                >
                  <View
                    style={[
                      styles.categoryMark,
                      {
                        backgroundColor: selected
                          ? colors.accent
                          : "transparent",
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      {
                        color: selected ? colors.text : colors.textSecondary,
                        fontWeight: selected ? "700" : "400",
                      },
                    ]}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text
            style={[styles.label, { color: colors.textSecondary, marginTop: 22 }]}
          >
            内容
          </Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="ご要望・不具合の内容などをご記入ください"
            placeholderTextColor={colors.textSecondary}
            multiline
            textAlignVertical="top"
            style={[
              styles.input,
              {
                borderColor: colors.border,
                backgroundColor: colors.background,
                color: colors.text,
              },
            ]}
          />

          <Text style={[styles.note, { color: colors.textSecondary }]}>
            「メールで送る」を押すと、宛先・件名・本文を入力した状態で端末のメールアプリが開きます。内容を確認してから送信してください。アプリがサーバーへ送信することはありません。
          </Text>

          <Pressable
            onPress={handleSend}
            disabled={sending}
            style={[
              styles.sendButton,
              {
                backgroundColor: colors.accent,
                opacity: sending ? 0.6 : 1,
              },
            ]}
          >
            <Ionicons name="mail-outline" size={18} color={colors.onAccent} />
            <Text style={[styles.sendButtonText, { color: colors.onAccent }]}>
              {sending ? "メールアプリを起動中…" : "メールで送る"}
            </Text>
          </Pressable>
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  pageHeader: { paddingHorizontal: 18, paddingTop: 8, gap: 10 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 1 },
  backLabel: { fontSize: 15.5 },
  pageTitle: { fontSize: 22, fontWeight: "700", letterSpacing: 0.3 },
  body: { paddingHorizontal: 18 },
  bodyContent: { paddingVertical: 18, paddingBottom: 28 },
  // 節のラベル。設定画面の見出しと同じ扱いにする
  label: {
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  // 種別は枠付きの丸チップをやめ、文字と短い縦線で示す。
  // オンボーディングのチーム選択と同じ語彙。選択肢が枠で囲まれていると、
  // 送信ボタンと同じ「押す箱」に見えて、何が最終操作か分からなくなる。
  categoryRow: { flexDirection: "row", flexWrap: "wrap", columnGap: 18 },
  categoryChip: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  categoryMark: { width: 2, height: 14, marginRight: 8, borderRadius: Radius.mark },
  categoryChipText: { fontSize: 14 },
  input: {
    borderWidth: 1,
    borderRadius: Radius.surface,
    padding: 12,
    minHeight: 140,
    fontSize: 14.5,
    lineHeight: 21,
  },
  note: { fontSize: 12, lineHeight: 18, marginTop: 12 },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: Radius.surface,
    paddingVertical: 14,
    marginTop: 18,
  },
  sendButtonText: { fontSize: 15, fontWeight: "700" },
});
