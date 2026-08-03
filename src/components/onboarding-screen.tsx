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
import { MaxContentWidth, Radius } from "@/constants/theme";
import { Rule, Space, Type } from "@/constants/typography";
import { useFavoriteTeam } from "@/contexts/favorite-team";

const NONE_VALUE = "";

const OPTIONS = [{ code: NONE_VALUE, nickname: "既定のデザイン" }, ...TEAMS];

/** 見本カードの表示幅。画面の主役なので大きく取る。 */
const SAMPLE_WIDTH = 226;

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
  const pickedTeam = TEAMS.find((t) => t.code === picked);

  async function handleStart() {
    if (submitting) return;
    setSubmitting(true);
    await completeOnboarding(picked);
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        showsVerticalScrollIndicator={false}
      >
        {/*
          見本を画面の主役に据える。このアプリが何をするものかは、
          言葉より一枚見せた方が早い。選択肢の列より上に、大きく置く。
        */}
        <View style={styles.stage}>
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
            scaleFactor={SAMPLE_WIDTH / 350}
            style={{
              width: SAMPLE_WIDTH,
              height: SAMPLE_WIDTH,
              aspectRatio: undefined,
            }}
          />
        </View>

        <Text style={[styles.eyebrow, { color: colors.accent }]}>
          BALL FILMS
        </Text>
        <Text style={[styles.heading, { color: colors.text }]}>
          観戦写真が、一枚のフィルムになります
        </Text>

        {/*
          区切りは面(カード)ではなく線で作る。選択肢を一つずつ箱に入れると、
          12球団すべてが同じ重さに見えて、選ぶ手がかりが消える。
        */}
        <View style={[styles.rule, { backgroundColor: colors.border }]} />

        <View style={styles.pickHeader}>
          <Text style={[styles.pickLabel, { color: colors.textSecondary }]}>
            応援するチーム
          </Text>
          <Text style={[styles.pickValue, { color: colors.text }]}>
            {pickedTeam ? pickedTeam.nickname : "指定なし"}
          </Text>
        </View>
        <Text style={[styles.pickNote, { color: colors.textSecondary }]}>
          アプリの配色と、テロップの日付の色が変わります。あとから設定で変えられます。
        </Text>

        {/*
          選択肢は箱に入れず、文字のまま並べる。選ばれたものだけ
          チームカラーの縦線と明るい文字で示す。選択の表現に枠線ではなく
          「印」を使うことで、12個が均一な塊に見えるのを避ける。
        */}
        <View style={styles.chips}>
          {OPTIONS.map((opt) => {
            const on = opt.code === picked;
            return (
              <Pressable
                key={opt.code || "none"}
                onPress={() => setPicked(opt.code)}
                style={styles.chip}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <View
                  style={[
                    styles.chipMark,
                    { backgroundColor: on ? colors.accent : "transparent" },
                  ]}
                />
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: on ? colors.text : colors.textSecondary,
                      fontWeight: on ? "700" : "400",
                    },
                  ]}
                >
                  {opt.code ? opt.nickname : "指定なし"}
                </Text>
                {!!opt.code && (
                  <Text
                    style={[
                      styles.chipCode,
                      { color: on ? colors.accent : colors.textSecondary },
                    ]}
                  >
                    {opt.code}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
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
          <Ionicons name="arrow-forward" size={17} color={colors.onAccent} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  inner: {
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: Space.edge,
    paddingTop: Space.section,
    paddingBottom: Space.section,
  },
  stage: { alignItems: "center", marginBottom: Space.section },
  eyebrow: { ...Type.eyebrow, marginBottom: Space.tight },
  heading: { ...Type.headingJa, marginBottom: Space.section },
  rule: { height: Rule.hairline, marginBottom: Space.row },
  pickHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  pickLabel: Type.label,
  pickValue: { ...Type.actionJa, fontSize: 16 },
  pickNote: { ...Type.captionJa, marginTop: Space.tight },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 18,
    rowGap: 2,
    marginTop: Space.row,
  },
  chip: { flexDirection: "row", alignItems: "center", paddingVertical: 7 },
  // 選択の印。枠線ではなく短い縦線で示す
  chipMark: { width: 2, height: 15, marginRight: 8, borderRadius: Radius.mark },
  chipText: { fontSize: 14.5 },
  chipCode: { ...Type.display(15), marginLeft: 6 },
  footer: {
    borderTopWidth: Rule.hairline,
    paddingHorizontal: Space.edge,
    paddingTop: Space.row,
    paddingBottom: Space.tight,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: Radius.surface,
    paddingVertical: 15,
  },
  startBtnText: { ...Type.actionJa },
});
