import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CONTACT_EMAIL } from "@/constants/contact";
import { useTheme } from "@/hooks/use-theme";
import { notify, openMailComposer } from "@/utils/dialogs";

const CATEGORIES = [
  { label: "ご要望・機能のリクエスト", value: "ご要望" },
  { label: "不具合の報告", value: "不具合" },
  { label: "その他", value: "その他" },
];

export function ContactSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useTheme();
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
    const ok = await openMailComposer({
      to: CONTACT_EMAIL,
      subject: `【Ball Films】${category}`,
      body: `${trimmed}${footer}`,
    });
    setSending(false);
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <SafeAreaView
        edges={["bottom"]}
        style={[styles.sheet, { backgroundColor: colors.backgroundElement }]}
      >
        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            ご要望・お問い合わせ
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="閉じる"
          >
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.label, { color: colors.textSecondary }]}>種別</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((c) => {
              const selected = c.value === category;
              return (
                <Pressable
                  key={c.value}
                  onPress={() => setCategory(c.value)}
                  style={[
                    styles.categoryChip,
                    {
                      borderColor: selected ? colors.accent : colors.border,
                      backgroundColor: selected
                        ? colors.backgroundSelected
                        : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: selected ? colors.accent : colors.text },
                    ]}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text
            style={[styles.label, { color: colors.textSecondary, marginTop: 18 }]}
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
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    maxHeight: "85%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: 15, fontWeight: "600", flexShrink: 1, marginRight: 8 },
  body: { paddingHorizontal: 18 },
  bodyContent: { paddingVertical: 18, paddingBottom: 28 },
  label: { fontSize: 13, marginBottom: 8 },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  categoryChipText: { fontSize: 13, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    fontSize: 14,
    lineHeight: 20,
  },
  note: { fontSize: 12.5, lineHeight: 18, marginTop: 12 },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 18,
  },
  sendButtonText: { fontSize: 15, fontWeight: "700" },
});
