import { StyleSheet, View } from 'react-native';

import { SelectModal } from '@/components/form/select-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TEAMS } from '@/constants/teams';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useFavoriteTeam } from '@/contexts/favorite-team';

const FAVORITE_TEAM_OPTIONS = [
  { label: '特になし', value: '' },
  ...TEAMS.map((t) => ({ label: `${t.nickname}（${t.code}）`, value: t.code })),
];

export default function SettingsScreen() {
  const { favoriteTeam, setFavoriteTeam } = useFavoriteTeam();

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          設定
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
          お気に入りチーム（デザイン用）
        </ThemedText>
        <SelectModal
          title="お気に入りチームを選択"
          options={FAVORITE_TEAM_OPTIONS}
          value={favoriteTeam}
          onChange={setFavoriteTeam}
        />
        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          選んだチームに合わせてアプリのデザインを変えられるようになる予定です。「特になし」を選ぶと既存のデザインのままになります。観戦履歴タブの「マイチーム」（成績集計用）とは別の設定です。
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, maxWidth: MaxContentWidth, width: '100%', alignSelf: 'center' },
  header: { padding: Spacing.four, paddingBottom: Spacing.three },
  title: { fontSize: 26, lineHeight: 32 },
  section: { paddingHorizontal: Spacing.four },
  sectionLabel: { marginBottom: 6 },
  hint: { marginTop: 10, lineHeight: 18 },
});
