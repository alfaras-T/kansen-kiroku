import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DateField } from "@/components/form/date-field";
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
        {/*
          画面の上半分をビューファインダーにする。この画面の仕事は
          「写真を一枚のカードにすること」なので、写真が数ある節の一つに
          なっていてはいけない。端まで写真を伸ばし、番号と操作は上に重ねる。
        */}
        {!recordOnly && (
          <>
            <Pressable
              onPress={photoUri ? () => router.push("/adjust") : pickPhoto}
              style={styles.viewfinder}
              onLayout={(e) => setPreviewWidth(e.nativeEvent.layout.width)}
            >
              {photoUri && previewWidth > 0 ? (
                <View pointerEvents="none">
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
                    photoOffset={photoOffset}
                    photoScale={photoScale}
                    telopScale={telopScale}
                    style={{
                      width: previewWidth,
                      height: previewWidth / previewAspect,
                      aspectRatio: undefined,
                    }}
                  />
                </View>
              ) : (
                <View style={styles.empty}>
                  <Ionicons
                    name="add"
                    size={26}
                    color={colors.textSecondary}
                  />
                  <Text style={[styles.emptyText, { color: colors.text }]}>
                    観戦写真を選ぶ
                  </Text>
                  <Text
                    style={[styles.emptyNote, { color: colors.textSecondary }]}
                  >
                    選ぶとここに仕上がりが出ます
                  </Text>
                </View>
              )}

              {/* フレーム番号は写真の上に焼き込む。ヘッダーではなく刻印として */}
              <View style={styles.hud} pointerEvents="none">
                <Text style={styles.hudYear}>{thisYear}</Text>
                <Text style={[styles.hudNo, { color: colors.accent }]}>
                  {String(frameNumber).padStart(2, "0")}
                </Text>
              </View>
            </Pressable>

            {photoUri && (
              <View
                style={[styles.filmActions, { borderBottomColor: colors.border }]}
              >
                <Pressable
                  onPress={() => router.push("/adjust")}
                  style={styles.filmAction}
                >
                  <Ionicons name="crop" size={15} color={colors.accent} />
                  <Text style={[styles.filmActionText, { color: colors.accent }]}>
                    仕上げる
                  </Text>
                </Pressable>
                <View
                  style={[styles.filmSep, { backgroundColor: colors.border }]}
                />
                <Pressable onPress={pickPhoto} style={styles.filmAction}>
                  <Text
                    style={[
                      styles.filmActionText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    別の写真
                  </Text>
                </Pressable>
                <View
                  style={[styles.filmSep, { backgroundColor: colors.border }]}
                />
                <Pressable onPress={clearPhoto} style={styles.filmAction}>
                  <Text
                    style={[
                      styles.filmActionText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    外す
                  </Text>
                </Pressable>
              </View>
            )}
          </>
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

          <View style={styles.modeRow}>
            <Text style={[styles.modeLabel, { color: colors.textSecondary }]}>
              写真なしで記録だけ残す
            </Text>
            <Switch
              value={recordOnly}
              onValueChange={setRecordOnly}
              trackColor={{ true: colors.accent, false: colors.border }}
            />
          </View>
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
  // 端まで写真を伸ばす。画面の主役なので余白の内側に収めない。
  viewfinder: { width: "100%", minHeight: 200, justifyContent: "center" },
  empty: { alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 62 },
  emptyText: { fontSize: 15, fontWeight: "600" },
  emptyNote: { fontSize: 12 },
  // 写真に焼き込む刻印。ヘッダーではなく、フィルムの縁の番号として置く
  hud: {
    position: "absolute",
    left: Space.edge,
    bottom: 12,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  hudYear: { ...Type.display(13), color: "rgba(255,255,255,0.7)" },
  hudNo: { ...Type.display(22) },
  filmActions: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: Rule.hairline,
  },
  filmAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
  },
  filmSep: { width: Rule.hairline, height: 14 },
  filmActionText: { fontSize: 13, fontWeight: "600" },
  databack: { paddingHorizontal: Space.edge, paddingTop: Space.tight },
  scroll: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  modeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Space.edge,
    paddingTop: Space.row,
  },
  modeLabel: { fontSize: 13, letterSpacing: 0.3 },
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
