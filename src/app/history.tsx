import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { formatDateJP } from '@/components/form/date-field';
import { SelectModal } from '@/components/form/select-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TEAMS } from '@/constants/teams';
import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import {
  computeRecord,
  deleteHistoryEntry,
  groupHistoryByYear,
  loadHistory,
  loadMyTeam,
  saveMyTeam,
} from '@/storage/history';
import { HistoryEntry } from '@/types/history';

const MY_TEAM_OPTIONS = [
  { label: '指定しない', value: '' },
  ...TEAMS.map((t) => ({ label: `${t.nickname}（${t.code}）`, value: t.code })),
];

export default function HistoryScreen() {
  const colors = Colors.dark;
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [myTeam, setMyTeam] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [selectedYear, setSelectedYear] = useState('');

  const refresh = useCallback(async () => {
    const [h, mt] = await Promise.all([loadHistory(), loadMyTeam()]);
    setEntries(h);
    setMyTeam(mt);
    setLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  async function handleMyTeamChange(v: string) {
    setMyTeam(v);
    await saveMyTeam(v);
  }

  async function handleDelete(id: string) {
    const next = await deleteHistoryEntry(id);
    setEntries(next);
  }

  const yearOptions = useMemo(() => {
    const years = Array.from(new Set(entries.map((e) => e.date?.slice(0, 4)).filter(Boolean))).sort((a, b) =>
      b.localeCompare(a)
    );
    return [{ label: 'すべての年', value: '' }, ...years.map((y) => ({ label: `${y}年`, value: y }))];
  }, [entries]);

  // 記録削除等でその年のデータが無くなった場合は「すべての年」に戻す
  const effectiveYear = yearOptions.some((o) => o.value === selectedYear) ? selectedYear : '';

  const filteredEntries = useMemo(
    () => (effectiveYear ? entries.filter((e) => e.date?.slice(0, 4) === effectiveYear) : entries),
    [entries, effectiveYear]
  );

  const record = computeRecord(filteredEntries, myTeam);
  const sections = useMemo(
    () =>
      groupHistoryByYear(filteredEntries).map((g) => ({
        title: `${g.year}年`,
        data: g.entries,
      })),
    [filteredEntries]
  );

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          観戦履歴
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          記録はこの端末にのみ保存されています。
        </ThemedText>
      </View>

      <View style={styles.myTeamRow}>
        <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: 6 }}>
          マイチーム
        </ThemedText>
        <SelectModal
          title="マイチームを選択"
          options={MY_TEAM_OPTIONS}
          value={myTeam}
          onChange={handleMyTeamChange}
        />
      </View>

      <View style={styles.myTeamRow}>
        <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: 6 }}>
          表示する年
        </ThemedText>
        <SelectModal
          title="表示する年を選択"
          options={yearOptions}
          value={effectiveYear}
          onChange={setSelectedYear}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.accent }]}>{filteredEntries.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {effectiveYear ? `${effectiveYear}年の観戦数` : '総観戦数'}
          </Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.accent }]}>{record ? record.games : '–'}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>マイチーム観戦数</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.accent }]}>
            {record ? `${record.win}勝${record.lose}敗${record.draw}分` : '–'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>マイチーム成績</Text>
        </View>
      </View>

      {sections.length === 0 ? (
        loaded && (
          <View style={styles.emptyWrap}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              {effectiveYear
                ? `${effectiveYear}年の記録はまだありません。`
                : 'まだ記録がありません。「記録する」タブから試合を保存してみましょう。'}
            </ThemedText>
          </View>
        )
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          style={styles.flatList}
          contentContainerStyle={[styles.list, { paddingBottom: BottomTabInset + Spacing.six }]}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
              <Text style={[styles.sectionHeaderText, { color: colors.text }]}>{section.title}</Text>
              <Text style={[styles.sectionHeaderCount, { color: colors.textSecondary }]}>
                {section.data.length}試合
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            const resultTag = item.visitorScore === item.homeScore ? ' ・引分' : '';

            return (
              <View style={[styles.row, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
                    {formatDateJP(item.date)} {item.stadium}
                    {resultTag}
                  </Text>
                  <Text style={[styles.rowScore, { color: colors.text }]}>
                    {item.visitorCode} {item.visitorScore}–{item.homeScore} {item.homeCode}
                  </Text>
                  {!!item.memo && (
                    <Text style={[styles.rowMemo, { color: colors.textSecondary }]}>{item.memo}</Text>
                  )}
                </View>
                <Pressable onPress={() => handleDelete(item.id)} hitSlop={10} style={styles.delBtn}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, maxWidth: MaxContentWidth, width: '100%', alignSelf: 'center' },
  header: { padding: Spacing.four, paddingBottom: Spacing.three },
  title: { fontSize: 26, lineHeight: 32, marginBottom: 4 },
  myTeamRow: { paddingHorizontal: Spacing.four, marginBottom: Spacing.three },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: Spacing.four, marginBottom: Spacing.three },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statNum: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 10.5, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 2 },
  list: { paddingHorizontal: Spacing.four, gap: 8 },
  flatList: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  sectionHeaderText: { fontSize: 15, fontWeight: '700' },
  sectionHeaderCount: { fontSize: 11.5 },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.six,
  },
  empty: { textAlign: 'center', lineHeight: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  rowMeta: { fontSize: 11.5, marginBottom: 4 },
  rowScore: { fontSize: 15, fontWeight: '600' },
  rowMemo: { fontSize: 11.5, marginTop: 3 },
  delBtn: { padding: 6 },
});
