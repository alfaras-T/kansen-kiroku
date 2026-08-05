import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DateField } from "@/components/form/date-field";
import { AppMenu } from "@/components/app-menu";
import { ToggleSwitch } from "@/components/form/toggle-switch";
import { formatDateOverlay } from "@/components/form/date-field";
import { LabeledField } from "@/components/form/labeled-field";
import { Rule, Space, Type } from "@/constants/typography";
import { SelectModal, SelectOption } from "@/components/form/select-modal";
import { OverlayCard } from "@/components/overlay-card";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { resolveOverlayAspect } from "@/constants/overlayStyles";
import { OTHER_STADIUM, STADIUMS } from "@/constants/stadiums";
import { OTHER_TEAM, TEAMS } from "@/constants/teams";
import { BottomTabInset, MaxContentWidth, Spacing , Radius } from "@/constants/theme";
import { useCreateForm } from "@/contexts/create-form";
import { useTheme } from "@/hooks/use-theme";
import {
  loadHistory,
  loadLastStadium,
  loadMyTeam,
  saveLastStadium,
} from "@/storage/history";
import { confirmAsync } from "@/utils/dialogs";
import { sanitizeScoreInput } from "@/utils/score";

const BASE_TEAM_OPTIONS: SelectOption[] = [
  ...TEAMS.map((t) => ({ label: `${t.nickname}（${t.code}）`, value: t.code })),
  { label: "その他（自由入力）", value: OTHER_TEAM },
];
const BASE_STADIUM_OPTIONS: SelectOption[] = [
  ...STADIUMS.map((s) => ({ label: s, value: s })),
  { label: "その他（直接入力）", value: OTHER_STADIUM },
];

/**
 * 指定した値を一覧の先頭へ移動し、理由を示すバッジを付ける。
 * 該当が無ければ元の並びをそのまま返す(マイチーム未設定・初回起動など)。
 *
 * 「初期値として選択済みにする」のではなく「一覧の先頭に出す」に留めている。
 * 勝手に選択されていると、入力し忘れなのか自分で選んだのかが分からなくなるため。
 */
function withPinnedOption(
  options: SelectOption[],
  pinnedValue: string,
  badge: string,
): SelectOption[] {
  if (!pinnedValue) return options;
  const index = options.findIndex((o) => o.value === pinnedValue);
  if (index < 0) return options;
  return [
    { ...options[index], badge },
    ...options.slice(0, index),
    ...options.slice(index + 1),
  ];
}

export default function CreateScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const form = useCreateForm();

  // マイチームと前回の球場は設定画面や前回の記録から来るため、
  // 画面に戻るたびに読み直す(履歴画面と同じ useFocusEffect の使い方)。
  const [myTeam, setMyTeam] = useState("");
  const [lastStadium, setLastStadium] = useState("");
  // その年の何枚目になるか。ヘッダーのフレーム番号に使う。
  const thisYear = String(new Date().getFullYear());
  const [yearCount, setYearCount] = useState(0);
  const frameNumber = yearCount + 1;
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [mt, ls, history] = await Promise.all([
          loadMyTeam(),
          loadLastStadium(),
          loadHistory(),
        ]);
        if (!alive) return;
        setMyTeam(mt);
        setLastStadium(ls);
        setYearCount(
          history.filter((e) => e.date?.slice(0, 4) === thisYear).length,
        );
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  const teamOptions = useMemo(
    () => withPinnedOption(BASE_TEAM_OPTIONS, myTeam, "マイチーム"),
    [myTeam],
  );
  const stadiumOptions = useMemo(
    () => withPinnedOption(BASE_STADIUM_OPTIONS, lastStadium, "前回"),
    [lastStadium],
  );

  /** 球場を選んだら次回のために覚えておく(「その他」は対象外) */
  function handleStadiumChange(value: string) {
    setStadium(value);
    if (value && value !== OTHER_STADIUM) {
      setLastStadium(value);
      saveLastStadium(value);
    }
  }
  const {
    photoUri,
    recordOnly,
    setRecordOnly,
    date,
    setDate,
    stadium,
    setStadium,
    stadiumOther,
    setStadiumOther,
    visitorCode,
    setVisitorCode,
    homeCode,
    setHomeCode,
    visitorTeamOther,
    setVisitorTeamOther,
    homeTeamOther,
    setHomeTeamOther,
    visitorScore,
    setVisitorScore,
    homeScore,
    setHomeScore,
    memo,
    setMemo,
    savedFlash,
    pickPhoto,
    clearPhoto,
    handleSaveRecord,
    visitorTeamName,
    homeTeamName,
    stadiumName,
    photoAspectRatio,
    ratio,
    position,
    styleKey,
    winHighlight,
    useTeamColor,
    photoOffset,
    photoScale,
    telopScale,
  } = form;

  // 入力しながら仕上がりを確認できるよう、記録画面にもプレビューを置く。
  // 幅は実測しないと比率から高さを出せないため onLayout で取る。
  const [previewWidth, setPreviewWidth] = useState(0);
  const previewAspect = resolveOverlayAspect(ratio, photoAspectRatio);

  async function handleSaveRecordWithChecks() {
    // 「同じチーム同士」は入力ミスの可能性が高いため、保存前に一声かける。
    // 参考記録として意図的に残したい場合もあるため、あくまで確認であって
    // 禁止はしない。
    // (試合日は DateField 側が未来日を選択不可にしているため、ここでの
    // 未来日チェックは不要)
    if (
      visitorTeamName &&
      homeTeamName &&
      visitorTeamName === homeTeamName
    ) {
      const ok = await confirmAsync(
        "先攻と後攻が同じチームです",
        "このまま保存しますか？",
        "保存する",
      );
      if (!ok) return;
    }
    await handleSaveRecord();
  }

  return (
    <ThemedView style={[styles.screen, { paddingTop: insets.top }]}>
      {/*
        内容が画面に収まっている間はスクロールしているように見せない。
        alwaysBounceVertical={false} でiOSのラバーバンドを止め、
        overScrollMode="never" でAndroidの端の光を止める。
        ScrollView自体は残す。小さい端末・文字サイズを大きくしている場合・
        キーボードが出て入力欄が隠れる場合には、実際にスクロールが必要になるため。
      */}
      <ScrollView
        style={[styles.scroll, { flex: 1 }]}
        contentContainerStyle={styles.scrollContent}
        alwaysBounceVertical={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Ball Films
          </ThemedText>
          <AppMenu />
        </View>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <ThemedText type="default">観戦記録のみ保存（写真なし）</ThemedText>
            <ToggleSwitch value={recordOnly} onValueChange={setRecordOnly} />
          </View>
        </View>

        {/*
          写真を先頭に置く。以前は入力欄を全部埋めた先に写真ボタンがあり、
          手を動かしている間ずっと何も得られない導線だった。
          先に写真を選んでもらい、入力するそばからプレビューが変わることで
          「フォームを埋める作業」ではなく「仕上げていく作業」にする。
        */}
        {!recordOnly && (
          <View style={styles.card}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              写真
            </ThemedText>

            {photoUri ? (
              <>
                {/*
                  プレビューは見るだけ。pointerEvents="none" で
                  OverlayCard 内のドラッグ/ピンチ操作を無効にしておく。
                  有効なままだと画面のスクロールを奪ってしまう。
                  写真の位置や拡大は「写真を調整する」で行う。
                */}
                <View
                  pointerEvents="none"
                  style={styles.previewStage}
                  onLayout={(e) =>
                    setPreviewWidth(e.nativeEvent.layout.width)
                  }
                >
                  {previewWidth > 0 && (
                    <OverlayCard
                      photoUri={photoUri}
                      photoAspectRatio={photoAspectRatio}
                      ratio={ratio}
                      position={position}
                      styleKey={styleKey}
                      visitorCode={visitorTeamName}
                      homeCode={homeTeamName}
                      visitorScore={visitorScore || "0"}
                      homeScore={homeScore || "0"}
                      dateLabel={formatDateOverlay(date)}
                      dateIso={date}
                      stadium={stadiumName}
                      memo={memo}
                      winHighlight={winHighlight}
                      useTeamColor={useTeamColor}
                      photoOffset={photoOffset}
                      photoScale={photoScale}
                      telopScale={telopScale}
                      style={{
                        width: previewWidth,
                        height: previewWidth / previewAspect,
                        aspectRatio: undefined,
                      }}
                    />
                  )}
                </View>

                <Pressable
                  onPress={() => router.push("/adjust")}
                  style={[
                    styles.adjustBtn,
                    { borderColor: colors.accent, marginTop: 12 },
                  ]}
                >
                  <Ionicons name="crop" size={17} color={colors.accent} />
                  <Text
                    style={{
                      color: colors.accent,
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    写真を調整して保存する
                  </Text>
                </Pressable>

                <View style={styles.photoActions}>
                  <Pressable onPress={pickPhoto} hitSlop={8}>
                    <ThemedText type="small" themeColor="textSecondary">
                      写真を変更
                    </ThemedText>
                  </Pressable>
                  <Pressable onPress={clearPhoto} hitSlop={8}>
                    <ThemedText type="small" themeColor="danger">
                      写真をクリア
                    </ThemedText>
                  </Pressable>
                </View>
              </>
            ) : (
              <Pressable
                onPress={pickPhoto}
                style={[
                  styles.photoPlaceholder,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.backgroundElement,
                  },
                ]}
              >
                <Ionicons name="image-outline" size={30} color={colors.accent} />
                <Text style={{ color: colors.text, fontSize: 14.5, fontWeight: "600" }}>
                  写真を選ぶ
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  選ぶとここに仕上がりが表示されます
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/*
          下半分はカメラのデータバック。ラベルを左、値を右に置いた表として
          読ませる。ラベルを値の上に積むと、どの項目も同じ重さの塊になって
          「縦に並べただけのフォーム」になる。
        */}
        <View style={styles.databack}>

          <LabeledField label="試合日">
            <DateField value={date} onChange={setDate} />
          </LabeledField>

          <LabeledField label="先攻">
            <View style={styles.teamRow}>
              <View style={{ flex: 1 }}>
                <SelectModal
                  title="先攻チームを選択"
                  options={teamOptions}
                  value={visitorCode}
                  onChange={setVisitorCode}
                />
              </View>
              <View style={styles.scoreField}>
                <TextInput
                  value={visitorScore}
                  onChangeText={(t) => setVisitorScore(sanitizeScoreInput(t))}
                  keyboardType="number-pad"
                  maxFontSizeMultiplier={1.3}
                  accessibilityLabel="先攻チームの得点"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.scoreInput,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.backgroundElement,
                      color: colors.text,
                    },
                  ]}
                />
              </View>
            </View>
            {visitorCode === OTHER_TEAM && (
              <TextInput
                value={visitorTeamOther}
                onChangeText={setVisitorTeamOther}
                placeholder="チーム名を入力"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.textInput,
                  {
                    marginTop: 8,
                    borderColor: colors.border,
                    backgroundColor: colors.backgroundElement,
                    color: colors.text,
                  },
                ]}
              />
            )}
          </LabeledField>

          <LabeledField label="後攻">
            <View style={styles.teamRow}>
              <View style={{ flex: 1 }}>
                <SelectModal
                  title="後攻チームを選択"
                  options={teamOptions}
                  value={homeCode}
                  onChange={setHomeCode}
                />
              </View>
              <View style={styles.scoreField}>
                <TextInput
                  value={homeScore}
                  onChangeText={(t) => setHomeScore(sanitizeScoreInput(t))}
                  keyboardType="number-pad"
                  maxFontSizeMultiplier={1.3}
                  accessibilityLabel="後攻チームの得点"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.scoreInput,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.backgroundElement,
                      color: colors.text,
                    },
                  ]}
                />
              </View>
            </View>
            {homeCode === OTHER_TEAM && (
              <TextInput
                value={homeTeamOther}
                onChangeText={setHomeTeamOther}
                placeholder="チーム名を入力"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.textInput,
                  {
                    marginTop: 8,
                    borderColor: colors.border,
                    backgroundColor: colors.backgroundElement,
                    color: colors.text,
                  },
                ]}
              />
            )}
          </LabeledField>

          <LabeledField label="球場">
            <SelectModal
              title="球場を選択"
              options={stadiumOptions}
              value={stadium}
              onChange={handleStadiumChange}
            />
            {stadium === OTHER_STADIUM && (
              <TextInput
                value={stadiumOther}
                onChangeText={setStadiumOther}
                placeholder="球場名を入力"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.textInput,
                  {
                    marginTop: 8,
                    borderColor: colors.border,
                    backgroundColor: colors.backgroundElement,
                    color: colors.text,
                  },
                ]}
              />
            )}
          </LabeledField>

          <LabeledField label="自由メモ（任意）" stacked>
            <TextInput
              value={memo}
              onChangeText={setMemo}
              placeholder="例：3塁側内野、記念日など"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.textInput,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.backgroundElement,
                  color: colors.text,
                },
              ]}
            />
          </LabeledField>
        </View>

        {recordOnly && (
          <Pressable
            onPress={handleSaveRecordWithChecks}
            style={[styles.recordBtn, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 13.5 }}>
              {savedFlash ? "保存しました ✓" : "この記録を保存する"}
            </Text>
          </Pressable>
        )}

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.four,
    paddingBottom: Spacing.three,
  },
  title: { fontSize: 26, lineHeight: 32 },
  card: { paddingHorizontal: Spacing.four, marginBottom: Spacing.three },
  sectionTitle: { marginBottom: 10, letterSpacing: 0.5 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewStage: { width: "100%", borderRadius: Radius.surface, overflow: "hidden" },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: Radius.surface,
    paddingVertical: 34,
  },
  photoActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 4,
  },
  adjustBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: Radius.surface,
    paddingVertical: 12,
  },
  databack: { paddingHorizontal: Spacing.four },
  scroll: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
  },
  // 左右の余白は各節(header / card / databack)が自分で持つ。
  // ここでも padding を掛けると二重になり、内容が中央に寄って見える。
  scrollContent: {
    flexGrow: 1,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  // alignItems は flex-end。得点欄の上に「得点」ラベルが乗るため、
  // 中央揃えだと入力欄だけが下にずれてチーム選択欄と揃わなくなる。
  // 下端で揃えることで、選択欄と入力欄が同じ行に並んで見える。
  teamRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  scoreField: { width: 64 },
  scoreInput: {
    width: "100%",
    borderWidth: 1,
    borderRadius: Radius.surface,
    paddingVertical: 9,
    paddingHorizontal: 10,
    fontSize: 15,
    textAlign: "center",
  },
  textInput: {
    borderWidth: 1,
    borderRadius: Radius.surface,
    paddingVertical: 9,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  recordBtn: {
    borderWidth: 1,
    borderRadius: Radius.surface,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: Spacing.three,
  },
});
