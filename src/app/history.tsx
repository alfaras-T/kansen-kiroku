import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";

import { useFavoriteTeam } from "@/contexts/favorite-team";
import { exportBackup } from "@/storage/backup";
import { resolveGameResult } from "@/storage/history";
import {
  loadBackupNudgeAt,
  saveBackupNudgeAt,
} from "@/storage/preferences";
import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatDateJP } from "@/components/form/date-field";
import { SettingsButton } from "@/components/settings-button";
import { SelectModal } from "@/components/form/select-modal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TEAMS } from "@/constants/teams";
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from "@/constants/theme";
import { Rule, Type } from "@/constants/typography";
import {
  computeRecord,
  deleteHistoryEntry,
  groupHistoryByYear,
  loadHistory,
  updateHistoryEntry,
} from "@/storage/history";
import { HistoryEntry } from "@/types/history";
import { confirmAsync } from "@/utils/dialogs";
import { summarizeYear } from "@/utils/yearSummary";
import { ProofSheet } from "@/components/proof-sheet";
import { WrapUpSheet } from "@/components/wrapup-sheet";
import { EditEntrySheet } from "@/components/edit-entry-sheet";
import { useTheme } from "@/hooks/use-theme";

const MY_TEAM_OPTIONS = [
  { label: "指定しない", value: "" },
  ...TEAMS.map((t) => ({ label: `${t.nickname}（${t.code}）`, value: t.code, compactLabel: `${t.shortNickname ?? t.nickname}（${t.code}）` })),
];

/** これ以下の件数では案内しない。数件のうちは失っても痛手が小さい。 */
const BACKUP_NUDGE_MIN = 20;
/** 前回の案内からこれだけ増えたら、もう一度だけ案内する。 */
const BACKUP_NUDGE_STEP = 20;

export default function HistoryScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  // マイチームは FavoriteTeamProvider が単一の保持元。ここで個別にstateを
  // 持つと、テロップの球団カラー判定など他の画面と値がずれる。
  const { myTeam, setMyTeam } = useFavoriteTeam();
  const [loaded, setLoaded] = useState(false);
  const [selectedYear, setSelectedYear] = useState("");
  const [wrapOpen, setWrapOpen] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);

  // バックアップの案内。記録は端末内にしか無いので、アプリを消すと戻らない。
  // ただし毎回促すと煩わしいので、前回案内した時点から一定数増えたときだけ出す。
  const [nudgeAt, setNudgeAt] = useState<number | null>(null);
  useEffect(() => {
    loadBackupNudgeAt().then(setNudgeAt);
  }, []);

  const showBackupNudge =
    nudgeAt !== null &&
    entries.length >= BACKUP_NUDGE_MIN &&
    entries.length >= nudgeAt + BACKUP_NUDGE_STEP;

  async function dismissBackupNudge() {
    setNudgeAt(entries.length);
    await saveBackupNudgeAt(entries.length);
  }

  async function handleBackupFromNudge() {
    // 案内から直接書き出す。設定画面まで辿らせると、そこで離脱する。
    await dismissBackupNudge();
    try {
      await exportBackup();
    } catch (e) {
      console.warn("バックアップの書き出しに失敗しました", e);
    }
  }
  const [editingEntry, setEditingEntry] = useState<HistoryEntry | null>(null);

  const refresh = useCallback(async () => {
    setEntries(await loadHistory());
    setLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  async function handleMyTeamChange(v: string) {
    await setMyTeam(v);
  }

  async function handleDelete(entry: HistoryEntry) {
    const summary = `${formatDateJP(entry.date)} ${entry.stadium}\n${entry.visitorCode} ${entry.visitorScore}–${entry.homeScore} ${entry.homeCode}`;
    const ok = await confirmAsync(
      "この観戦記録を削除しますか？",
      `${summary}\n\n削除すると元に戻せません。`,
      "削除",
    );
    if (!ok) return;
    const next = await deleteHistoryEntry(entry.id);
    setEntries(next);
  }

  const yearOptions = useMemo(() => {
    const years = Array.from(
      new Set(entries.map((e) => e.date?.slice(0, 4)).filter(Boolean)),
    ).sort((a, b) => b.localeCompare(a));
    return [
      { label: "すべての年", value: "" },
      ...years.map((y) => ({ label: `${y}年`, value: y })),
    ];
  }, [entries]);

  // 記録削除等でその年のデータが無くなった場合は「すべての年」に戻す
  const effectiveYear = yearOptions.some((o) => o.value === selectedYear)
    ? selectedYear
    : "";

  const filteredEntries = useMemo(
    () =>
      effectiveYear
        ? entries.filter((e) => e.date?.slice(0, 4) === effectiveYear)
        : entries,
    [entries, effectiveYear],
  );

  const record = computeRecord(filteredEntries, myTeam);
  // マイチームが出場した試合数。成績の母数として添える。
  const myTeamGames = myTeam
    ? filteredEntries.filter(
        (e) => e.visitorCode === myTeam || e.homeCode === myTeam,
      ).length
    : 0;

  // 観戦まとめの対象年: 「表示する年」を選んでいればその年、
  // 「すべての年」なら記録のある最新の年
  const wrapYear = effectiveYear || (yearOptions[1]?.value ?? "");
  const wrapSummary = useMemo(
    () => (wrapYear ? summarizeYear(entries, myTeam, wrapYear) : null),
    [entries, myTeam, wrapYear],
  );
  const sections = useMemo(
    () =>
      groupHistoryByYear(filteredEntries).map((g) => ({
        title: `${g.year}年`,
        data: g.entries.map((entry) => ({ entry })),
      })),
    [filteredEntries],
  );

  return (
    <ThemedView style={[styles.screen, { paddingTop: insets.top }]}>
      {/*
        見出しと絞り込みを一行にまとめる。「観戦履歴」という大見出しの下に
        ラベル付きの選択欄を2つ置くと、画面の上4分の1が操作系だけで埋まる。
        絞り込みは補助操作なので、箱に入れず文字のまま右に寄せる。
      */}
      <View style={styles.head}>
        <View style={styles.headTop}>
          <Text style={[styles.headTitle, { color: colors.text }]}>
            観戦履歴
          </Text>
          <SettingsButton />
        </View>
        {/* 年は絞り込みなので、見出しの並びに置く */}
        <View style={styles.filters}>
          <SelectModal
            title="表示する年を選択"
            options={yearOptions}
            value={effectiveYear}
            onChange={setSelectedYear}
            variant="inline"
          />
        </View>
      </View>

      {/*
        3つの数値を同じ大きさの箱に並べると、どれも同じ重さに見える。
        実際にはマイチームの成績が主役で、観戦数はその文脈でしかない。
        成績を数字の列として大きく組み、観戦数は下の一行に落とす。
      */}
      <View style={styles.stats}>
        {/*
          マイチームは絞り込みではなく「誰の成績か」を決めるもの。
          年の選択と横に並べていたため、履歴からそのチームの分だけ抜き出す
          操作に見えていた。成績の見出しとして、数字の直上に置き直す。
        */}
        <View style={styles.teamPick}>
          <Text style={[styles.teamPickLabel, { color: colors.textSecondary }]}>
            マイチーム
          </Text>
          <SelectModal
            title="マイチームを選択"
            options={MY_TEAM_OPTIONS}
            value={myTeam}
            onChange={handleMyTeamChange}
            variant="inline"
          />
        </View>

        <View style={styles.tally}>
          {[
            { n: record?.win ?? 0, label: "勝", lead: true },
            { n: record?.lose ?? 0, label: "敗", lead: false },
            { n: record?.draw ?? 0, label: "分", lead: false },
          ].map((cell) => (
            <View key={cell.label} style={styles.tallyCell}>
              <Text
                style={[
                  styles.tallyNum,
                  { color: cell.lead ? colors.accent : colors.text },
                ]}
              >
                {cell.n}
              </Text>
              <Text
                style={[styles.tallyLabel, { color: colors.textSecondary }]}
              >
                {cell.label}
              </Text>
            </View>
          ))}
        </View>
        <Text style={[styles.tallyNote, { color: colors.textSecondary }]}>
          {myTeam ? `該当 ${myTeamGames}試合　` : "チームを選ぶと成績が出ます　"}
          {effectiveYear ? `${effectiveYear}年の観戦 ` : "総観戦 "}
          {filteredEntries.length}
        </Text>
      </View>
      {/*
        作成導線。このアプリで一番作ってほしいものなので、画面で最も強く扱う。
        成績を見た直後がまとめを作りたくなる瞬間なので、成績のすぐ下に置く。

        何が出てくるかは一行の説明で伝える。
      */}
      {wrapSummary && wrapSummary.games > 0 && (
        <View style={styles.makeRow}>
          <Pressable
            onPress={() => setWrapOpen(true)}
            style={[
              styles.makeCard,
              {
                borderColor: colors.border,
                backgroundColor: colors.backgroundElement,
              },
            ]}
          >
            <View style={styles.makeHead}>
              <Ionicons name="sparkles-outline" size={17} color={colors.accent} />
              <Text style={[styles.makeTitle, { color: colors.text }]}>
                観戦まとめ
              </Text>
            </View>
            <Text style={[styles.makeNote, { color: colors.textSecondary }]}>
              一年の成績を一枚に
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setProofOpen(true)}
            style={[
              styles.makeCard,
              {
                borderColor: colors.border,
                backgroundColor: colors.backgroundElement,
              },
            ]}
          >
            <View style={styles.makeHead}>
              <Ionicons name="grid-outline" size={17} color={colors.accent} />
              <Text style={[styles.makeTitle, { color: colors.text }]}>
                フィルムシート
              </Text>
            </View>
            <Text style={[styles.makeNote, { color: colors.textSecondary }]}>
              観戦した写真を格子に
            </Text>
          </Pressable>
        </View>
      )}

      {showBackupNudge && (
        <View
          style={[
            styles.nudge,
            { borderTopColor: colors.border },
          ]}
        >
          <View style={styles.nudgeTextArea}>
            <Text style={[styles.nudgeTitle, { color: colors.text }]}>
              {entries.length}試合分の記録があります
            </Text>
            <Text style={[styles.nudgeBody, { color: colors.textSecondary }]}>
              記録はこの端末の中だけに保存されています。機種変更やアプリの削除に備えて、控えを書き出しておきませんか。
            </Text>
          </View>
          <View style={styles.nudgeActions}>
            <Pressable onPress={dismissBackupNudge} hitSlop={8}>
              <Text style={[styles.nudgeLater, { color: colors.textSecondary }]}>
                あとで
              </Text>
            </Pressable>
            <Pressable
              onPress={handleBackupFromNudge}
              style={[styles.nudgeBtn, { backgroundColor: colors.accent }]}
            >
              <Ionicons
                name="download-outline"
                size={15}
                color={colors.onAccent}
              />
              <Text style={[styles.nudgeBtnText, { color: colors.onAccent }]}>
                書き出す
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {sections.length === 0 ? (
        loaded && (
          <View style={styles.emptyWrap}>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.empty}
            >
              {effectiveYear
                ? `${effectiveYear}年の記録はまだありません。`
                : "まだ記録がありません。「記録する」タブから試合を保存してみましょう。"}
            </ThemedText>
          </View>
        )
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={({ entry }) => entry.id}
          style={styles.flatList}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: BottomTabInset + Spacing.six },
          ]}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => (
            <View
              style={[
                styles.sectionHeader,
                { backgroundColor: colors.background },
              ]}
            >
              <Text style={[styles.sectionHeaderText, { color: colors.text }]}>
                {section.title}
              </Text>
              <Text
                style={[
                  styles.sectionHeaderCount,
                  { color: colors.textSecondary },
                ]}
              >
                {section.data.length}試合
              </Text>
            </View>
          )}
          renderItem={({ item: { entry } }) => {
            const result = resolveGameResult(entry, myTeam);
            const mark =
              result === "win"
                ? "○"
                : result === "lose"
                  ? "●"
                  : result === "draw"
                    ? "△"
                    : "";
            const [, month, day] = entry.date.split("-");

            return (
              /*
                iOSの標準的な一覧に合わせ、左スワイプで編集・削除を出す。
                行の中にアイコンを常設すると、スコアの右隣に押せるものが
                並んでスコアの読みを邪魔する。操作は隠して、必要なときだけ
                引き出す方がこの一覧には合う。
              */
              <Swipeable
                friction={1.6}
                rightThreshold={36}
                overshootRight={false}
                renderRightActions={() => (
                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => setEditingEntry(entry)}
                      style={[
                        styles.action,
                        { backgroundColor: colors.backgroundSelected },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="この観戦記録を編集"
                    >
                      <Text style={[styles.actionText, { color: colors.text }]}>
                        編集
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(entry)}
                      style={[
                        styles.action,
                        { backgroundColor: colors.danger },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="この観戦記録を削除"
                    >
                      <Text style={[styles.actionText, { color: "#fff" }]}>
                        削除
                      </Text>
                    </Pressable>
                  </View>
                )}
              >
              <Pressable
                onPress={() => setEditingEntry(entry)}
                accessibilityRole="button"
                accessibilityLabel="この観戦記録を編集"
                accessibilityHint={
                  result === "win"
                    ? "勝ち"
                    : result === "lose"
                      ? "負け"
                      : result === "draw"
                        ? "引き分け"
                        : undefined
                }
                style={[
                  styles.frame,
                  {
                    borderBottomColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <View style={styles.frameBody}>
                  <Text
                    style={[styles.meta, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {month}.{day}　{entry.stadium}
                    {!!entry.memo && `　${entry.memo}`}
                  </Text>

                  {/*
                    スコアと勝敗を同じ行に置く。以前は日付の横に小さな印を
                    添えていたが、周りの文字に埋もれて読み取れなかった。
                    勝敗は「その試合をどう記憶しているか」そのものなので、
                    主役であるスコアと同じ大きさの列に置く。
                  */}
                  <View style={styles.scoreLine}>
                    <Text style={[styles.code, { color: colors.textSecondary }]}>
                      {entry.visitorCode}
                    </Text>
                    <Text style={[styles.score, { color: colors.text }]}>
                      {entry.visitorScore}
                    </Text>
                    <Text style={[styles.dash, { color: colors.textSecondary }]}>
                      –
                    </Text>
                    <Text style={[styles.score, { color: colors.text }]}>
                      {entry.homeScore}
                    </Text>
                    <Text style={[styles.code, { color: colors.textSecondary }]}>
                      {entry.homeCode}
                    </Text>
                    {!!mark && (
                      <Text
                        style={[
                          styles.mark,
                          {
                            color:
                              result === "win"
                                ? colors.accent
                                : colors.textSecondary,
                          },
                        ]}
                      >
                        {mark}
                      </Text>
                    )}
                  </View>
                </View>
              </Pressable>
              </Swipeable>
            );
          }}
        />
      )}
      <WrapUpSheet
        visible={wrapOpen}
        onClose={() => setWrapOpen(false)}
        summary={wrapSummary}
        myTeam={myTeam}
      />
      <ProofSheet
        visible={proofOpen}
        onClose={() => setProofOpen(false)}
        year={wrapYear}
        entries={entries.filter((e) => e.date?.slice(0, 4) === wrapYear)}
        record={wrapSummary?.record ?? null}
        myTeam={myTeam}
      />
      <EditEntrySheet
        entry={editingEntry}
        onDelete={handleDelete}
        onClose={() => setEditingEntry(null)}
        onSave={async (updated) => {
          const next = await updateHistoryEntry(updated);
          setEntries(next);
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
  },
  // 観戦まとめとベタ焼きを横並びにする。余白はこの行がまとめて持つ。
  // バックアップの案内は割り込み。作成導線より前に出ないよう、枠を持たず
  // 罫線で仕切った帯にして、一覧の直前に置く。
  nudge: {
    borderTopWidth: Rule.hairline,
    paddingHorizontal: Spacing.four,
    paddingVertical: 14,
    gap: 10,
    marginTop: 18,
  },
  nudgeTextArea: { gap: 4 },
  nudgeTitle: { fontSize: 14, fontWeight: "700" },
  nudgeBody: { fontSize: 12.5, lineHeight: 18 },
  nudgeActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 16,
  },
  nudgeLater: { fontSize: 13 },
  nudgeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: Radius.surface,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  nudgeBtnText: { fontSize: 13, fontWeight: "700" },
  list: { paddingHorizontal: Spacing.four, gap: 8 },
  flatList: { flex: 1 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  sectionHeaderText: { fontSize: 15, fontWeight: "700" },
  sectionHeaderCount: { fontSize: 11.5 },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.six,
  },
  empty: { textAlign: "center", lineHeight: 20 },
  makeRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: Spacing.four,
    paddingTop: 18,
  },
  makeCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.surface,
    padding: 13,
  },
  makeHead: { flexDirection: "row", alignItems: "center", gap: 7 },
  makeTitle: { fontSize: 14, fontWeight: "700", letterSpacing: 0.2 },
  makeNote: { fontSize: 11, marginTop: 5 },
  head: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  headTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headTitle: { fontSize: 22, fontWeight: "700", letterSpacing: 0.3 },
  filters: { flexDirection: "row", gap: 20, marginTop: 10 },
  stats: { paddingHorizontal: Spacing.four, paddingTop: 20 },
  teamPick: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  teamPickLabel: { fontSize: 11.5, fontWeight: "700", letterSpacing: 1.2 },
  tally: { flexDirection: "row", alignItems: "flex-end", gap: 18 },
  tallyCell: { flexDirection: "row", alignItems: "baseline", gap: 3 },
  tallyNum: { ...Type.display(38) },
  tallyLabel: { fontSize: 13, fontWeight: "600" },
  tallyNote: { fontSize: 12, marginTop: 8, letterSpacing: 0.2 },
  // 1件を枠で囲わず、下罫線一本だけで隣と分ける
  frame: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: Rule.hairline,
    paddingLeft: Spacing.four,
  },
  frameBody: { flex: 1, paddingVertical: 13, paddingRight: Spacing.four },
  // スワイプで現れる操作。高さは行に追随させる
  actions: { flexDirection: "row" },
  action: { width: 76, alignItems: "center", justifyContent: "center" },
  actionText: { fontSize: 14, fontWeight: "700" },
  meta: { fontSize: 12, letterSpacing: 0.2 },
  scoreLine: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: 3,
  },
  code: { ...Type.display(16) },
  score: { ...Type.display(27) },
  dash: { ...Type.display(16) },
  // 勝敗はスコアと同じ行、同じ列に置く。小さく添えると埋もれる。
  mark: { fontSize: 17, fontWeight: "700", marginLeft: 6 },
});
