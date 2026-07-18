import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TEAMS } from "@/constants/teams";
import { resolveTheme } from "@/constants/teamThemes";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useFavoriteTeam } from "@/contexts/favorite-team";

const NONE_VALUE = "";

const OPTIONS = [{ code: NONE_VALUE, nickname: "特になし" }, ...TEAMS];

export function OnboardingScreen() {
  const { completeOnboarding } = useFavoriteTeam();
  const [picked, setPicked] = useState(NONE_VALUE);
  const [submitting, setSubmitting] = useState(false);

  // 選択中のチームの配色をその場でプレビューする(まだ保存はしない)。
  // ThemedText/ThemedView は保存済みの設定を参照するため、ここでは素の Text を使う。
  const colors = resolveTheme(picked);

  async function handleStart() {
    if (submitting) return;
    setSubmitting(true);
    await completeOnboarding(picked);
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Ball Filmsへようこそ
          </Text>
          <Text style={[styles.lead, { color: colors.text }]}>
            お気に入りのチームは？
          </Text>
          <Text style={[styles.note, { color: colors.textSecondary }]}>
            選んだチームのイメージカラーに合わせて、アプリの配色が変わります。「特になし」を選ぶと既定のデザインになります。後ほど設定からいつでも変更できます。
          </Text>
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
        >
          {OPTIONS.map((opt) => {
            const selected = opt.code === picked;
            return (
              <Pressable
                key={opt.code || "none"}
                onPress={() => setPicked(opt.code)}
                style={[
                  styles.row,
                  {
                    backgroundColor: selected
                      ? colors.backgroundSelected
                      : colors.backgroundElement,
                    borderColor: selected ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.rowText,
                    { color: selected ? colors.accent : colors.text },
                  ]}
                >
                  {opt.nickname}
                  {opt.code ? `（${opt.code}）` : ""}
                </Text>
                {selected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.accent}
                  />
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          onPress={handleStart}
          disabled={submitting}
          style={[
            styles.startBtn,
            { backgroundColor: colors.accent, opacity: submitting ? 0.6 : 1 },
          ]}
        >
          <Text style={[styles.startBtnText, { color: colors.onAccent }]}>
            はじめる
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  inner: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
    padding: Spacing.four,
  },
  header: { marginBottom: Spacing.three },
  title: {
    fontSize: 24,
    lineHeight: 30,
    marginBottom: Spacing.three,
    fontWeight: "600",
  },
  lead: { fontSize: 16, fontWeight: "700", marginBottom: 6, lineHeight: 22 },
  note: { fontSize: 14, lineHeight: 18 },
  list: { flex: 1 },
  listContent: { gap: 8, paddingBottom: Spacing.three },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowText: { fontSize: 15, fontWeight: "600" },
  startBtn: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: Spacing.two,
  },
  startBtnText: { fontSize: 15, fontWeight: "700" },
});
