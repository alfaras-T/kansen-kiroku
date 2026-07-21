import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatDateJP } from "@/components/form/date-field";
import { SelectModal } from "@/components/form/select-modal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TEAMS } from "@/constants/teams";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import {
  computeRecord,
  deleteHistoryEntry,
  groupHistoryByYear,
  loadHistory,
  loadMyTeam,
  saveMyTeam,
  updateHistoryEntry,
} from "@/storage/history";
import { HistoryEntry } from "@/types/history";
import { confirmAsync } from "@/utils/dialogs";
import { summarizeYear } from "@/utils/yearSummary";
import { WrapUpSheet } from "@/components/wrapup-sheet";
import { EditEntrySheet } from "@/components/edit-entry-sheet";
import { useTheme } from "@/hooks/use-theme";

const MY_TEAM_OPTIONS = [
  { label: "指定しない", value: "" },
  ...TEAMS.map((t) => ({ label: `${t.nickname}（${t.code}）`, value: t.code })),
];

export default function HistoryScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [myTeam, setMyTeam] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [selectedYear, setSelectedYear] = useState("");
  const [wrapOpen, setWrapOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<HistoryEntry | null>(null);

  const refresh = useCallback(async () => {
    const [h, mt] = await Promise.all([loadHistory(), loadMyTeam()]);
    setEntries(h);
    setMyTeam(mt);
    setLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  async function handleMyTeamChange(v: string) {
    setMyTeam(v);
    await saveMyTeam(v);
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
        data: g.entries,
      })),
    [filteredEntries],
  );

  return (
    <ThemedView style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          観戦履歴
        </ThemedText>
      </View>

      <View style={styles.selectorsRow}>
        <View style={styles.selectorCol}>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={{ marginBottom: 6 }}
          >
            マイチーム
          </ThemedText>
          <SelectModal
            title="マイチームを選択"
            options={MY_TEAM_OPTIONS}
            value={myTeam}
            onChange={handleMyTeamChange}
          />
        </View>
        <View style={styles.selectorCol}>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={{ marginBottom: 6 }}
          >
            表示する年
          </ThemedText>
          <SelectModal
            title="表示する年を選択"
            options={yearOptions}
            value={effectiveYear}
            onChange={setSelectedYear}
          />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View
          style={[
            styles.statBox,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.statNum, { color: colors.accent }]}>
            {filteredEntries.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {effectiveYear ? `${effectiveYear}年の観戦数` : "総観戦数"}
          </Text>
        </View>
        <View
          style={[
            styles.statBox,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.statNum, { color: colors.accent }]}>
            {record ? record.games : "–"}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            マイチーム観戦数
          </Text>
        </View>
        <View
          style={[
            styles.statBox,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.statNum, { color: colors.accent }]}>
            {record ? `${record.win}勝${record.lose}敗${record.draw}分` : "–"}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            マイチーム成績
          </Text>
        </View>
      </View>

      {wrapSummary && wrapSummary.games > 0 && (
        <Pressable
          onPress={() => setWrapOpen(true)}
          style={[
            styles.wrapBtn,
            {
              borderColor: colors.accent,
              backgroundColor: colors.backgroundElement,
            },
          ]}
        >
          <Ionicons name="sparkles-outline" size={16} color={colors.accent} />
          <Text style={[styles.wrapBtnText, { color: colors.accent }]}>
            {wrapYear}年の観戦まとめを作る
          </Text>
        </Pressable>
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
          keyExtractor={(item) => item.id}
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
          renderItem={({ item }) => {
            const resultTag =
              item.visitorScore === item.homeScore ? " ・引分" : "";

            return (
              <View
                style={[
                  styles.row,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => setEditingEntry(item)}
                  accessibilityRole="button"
                  accessibilityLabel="この観戦記録を編集"
                >
                  <Text
                    style={[styles.rowMeta, { color: colors.textSecondary }]}
                  >
                    {formatDateJP(item.date)} {item.stadium}
                    {resultTag}
                  </Text>
                  <Text style={[styles.rowScore, { color: colors.text }]}>
                    {item.visitorCode} {item.visitorScore}–{item.homeScore}{" "}
                    {item.homeCode}
                  </Text>
                  {!!item.memo && (
                    <Text
                      style={[styles.rowMemo, { color: colors.textSecondary }]}
                    >
                      {item.memo}
                    </Text>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => setEditingEntry(item)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="この観戦記録を編集"
                  style={styles.delBtn}
                >
                  <Ionicons
                    name="pencil-outline"
                    size={17}
                    color={colors.textSecondary}
                  />
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(item)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="この観戦記録を削除"
                  style={styles.delBtn}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={colors.danger}
                  />
                </Pressable>
              </View>
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
      <EditEntrySheet
        entry={editingEntry}
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
  header: { padding: Spacing.four, paddingBottom: Spacing.two },
  title: { fontSize: 22, lineHeight: 28, marginBottom: 0 },
  selectorsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  selectorCol: { flex: 1 },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  statNum: { fontSize: 16, fontWeight: "700" },
  wrapBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 9,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  wrapBtnText: { fontSize: 13.5, fontWeight: "700" },
  statLabel: {
    fontSize: 10.5,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 2,
  },
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  rowMeta: { fontSize: 11.5, marginBottom: 4 },
  rowScore: { fontSize: 15, fontWeight: "600" },
  rowMemo: { fontSize: 11.5, marginTop: 3 },
  delBtn: { padding: 6 },
});
