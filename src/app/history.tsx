import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatDateJP } from '@/components/form/date-field';
import { SelectModal } from '@/components/form/select-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TEAMS } from '@/constants/teams';
import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { computeRecord, deleteHistoryEntry, loadHistory, loadMyTeam, saveMyTeam } from '@/storage/history';
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
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

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
    setSelectedEntry((cur) => (cur?.id === id ? null : cur));
  }

  const record = computeRecord(entries, myTeam);
  const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt);

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

      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.accent }]}>{entries.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>観戦試合</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.accent }]}>
            {record ? `${record.win}勝${record.lose}敗${record.draw}分` : '–'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>マイチーム成績</Text>
        </View>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: BottomTabInset + Spacing.six }]}
        ListEmptyComponent={
          loaded ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              まだ記録がありません。「記録する」タブから試合を保存してみましょう。
            </ThemedText>
          ) : null
        }
        renderItem={({ item }) => {
          const resultTag = item.visitorScore === item.homeScore ? ' ・引分' : '';

          return (
            <Pressable
              onPress={() => setSelectedEntry(item)}
              style={[styles.row, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              {item.photo ? (
                <Image source={{ uri: item.photo }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder, { borderColor: colors.border }]}>
                  <Ionicons name="baseball-outline" size={18} color={colors.textSecondary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
                  {formatDateJP(item.date)} {item.stadium}
                  {resultTag}
                </Text>
                <Text style={[styles.rowScore, { color: colors.text }]}>
                  {item.visitorCode} {item.visitorScore}–{item.homeScore} {item.homeCode}
                </Text>
                {!!item.memo && (
                  <Text style={[styles.rowMemo, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.memo}
                  </Text>
                )}
              </View>
              <Pressable onPress={() => handleDelete(item.id)} hitSlop={10} style={styles.delBtn}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </Pressable>
          );
        }}
      />

      <Modal
        visible={!!selectedEntry}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedEntry(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSelectedEntry(null)} />
        <SafeAreaView edges={['bottom']} style={[styles.sheet, { backgroundColor: colors.backgroundElement }]}>
          {selectedEntry && (
            <ScrollView contentContainerStyle={styles.sheetContent}>
              <View style={styles.sheetHeader}>
                <ThemedText type="smallBold">観戦記録</ThemedText>
                <Pressable onPress={() => setSelectedEntry(null)} hitSlop={10}>
                  <Ionicons name="close" size={22} color={colors.textSecondary} />
                </Pressable>
              </View>

              {selectedEntry.photo ? (
                <Image source={{ uri: selectedEntry.photo }} style={styles.detailPhoto} resizeMode="contain" />
              ) : (
                <View style={[styles.detailPhotoPlaceholder, { borderColor: colors.border }]}>
                  <ThemedText type="small" themeColor="textSecondary">
                    写真は保存されていません
                  </ThemedText>
                </View>
              )}

              <View style={styles.detailInfo}>
                <ThemedText type="default" style={styles.detailScore}>
                  {selectedEntry.visitorCode} {selectedEntry.visitorScore} – {selectedEntry.homeScore}{' '}
                  {selectedEntry.homeCode}
                  {selectedEntry.visitorScore === selectedEntry.homeScore ? '（引分）' : ''}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 4 }}>
                  {formatDateJP(selectedEntry.date)} ・ 📍 {selectedEntry.stadium}
                </ThemedText>
                {!!selectedEntry.memo && (
                  <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 8 }}>
                    {selectedEntry.memo}
                  </ThemedText>
                )}
              </View>

              <Pressable
                onPress={() => {
                  const id = selectedEntry.id;
                  setSelectedEntry(null);
                  handleDelete(id);
                }}
                style={[styles.deleteRowBtn, { borderColor: colors.border }]}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
                <Text style={{ color: colors.danger, fontSize: 13.5 }}>この記録を削除する</Text>
              </Pressable>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
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
  empty: { textAlign: 'center', marginTop: 40, lineHeight: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  thumb: { width: 44, height: 44, borderRadius: 6 },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  rowMeta: { fontSize: 11.5, marginBottom: 4 },
  rowScore: { fontSize: 15, fontWeight: '600' },
  rowMemo: { fontSize: 11.5, marginTop: 3 },
  delBtn: { padding: 6 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetContent: { padding: Spacing.four },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  detailPhoto: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    marginBottom: Spacing.three,
    backgroundColor: '#000',
  },
  detailPhotoPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailInfo: { marginBottom: Spacing.four },
  detailScore: { fontSize: 18, fontWeight: '700' },
  deleteRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
  },
});
