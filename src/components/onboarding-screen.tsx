import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OverlayCard } from "@/components/overlay-card";
import {
  DEFAULT_PHOTO_OFFSET,
  DEFAULT_PHOTO_SCALE,
  DEFAULT_TELOP_SCALE,
} from "@/constants/overlayStyles";
import { TEAMS } from "@/constants/teams";
import { resolveTheme } from "@/constants/teamThemes";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useFavoriteTeam } from "@/contexts/favorite-team";

const NONE_VALUE = "";

const OPTIONS = [{ code: NONE_VALUE, nickname: "既定のデザイン" }, ...TEAMS];

/** 見本カードの表示幅 */
const SAMPLE_WIDTH = 168;

/**
 * 見本の対戦相手。選んだチーム自身にならないよう、先頭から違うものを選ぶ。
 * 実在の対戦カードを装う意図はなく、テロップの見え方を示すための値。
 */
function sampleOpponent(picked: string): string {
  return TEAMS.find((t) => t.code !== picked)?.code ?? "G";
}

/** 見本用の日付。今日の日付を使うと、自分の記録らしく見える。 */
function sampleDateLabel(): string {
  const d = new Date();
  const week = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][d.getDay()];
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")} (${week})`;
}

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
            選んだチームのイメージカラーに合わせて、アプリの配色が変わります。後ほど設定からいつでも変更できます。
          </Text>
        </View>

        {/*
          このアプリで何が作れるかを、言葉ではなく現物で見せる。
          画像を同梱せず OverlayCard をその場で描いているのは、テロップの
          デザインを変えたときに見本も自動で追随するため。同梱画像はすぐ古くなる。
          写真は渡していないので、プリセットのグラデーションが背景になる。
        */}
        <View style={styles.sampleArea}>
          <OverlayCard
            photoUri={null}
            photoAspectRatio={1}
            ratio="square"
            position="br"
            styleKey="classic"
            visitorCode={sampleOpponent(picked)}
            homeCode={picked || "G"}
            visitorScore="2"
            homeScore="5"
            dateLabel={sampleDateLabel()}
            stadium="スタジアム"
            memo=""
            winHighlight
            photoOffset={DEFAULT_PHOTO_OFFSET}
            photoScale={DEFAULT_PHOTO_SCALE}
            telopScale={DEFAULT_TELOP_SCALE}
            previewMyTeam={picked}
            style={{
              width: SAMPLE_WIDTH,
              height: SAMPLE_WIDTH,
              aspectRatio: undefined,
            }}
          />
          <Text style={[styles.sampleNote, { color: colors.textSecondary }]}>
            観戦写真にこんな一枚が作れます
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
  sampleArea: { alignItems: "center", gap: 8, marginBottom: Spacing.three },
  sampleNote: { fontSize: 11.5 },
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
