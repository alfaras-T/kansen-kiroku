import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { TEAMS } from '@/constants/teams';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useFavoriteTeam } from '@/contexts/favorite-team';

const NONE_VALUE = '';

const OPTIONS = [{ code: NONE_VALUE, nickname: '特になし' }, ...TEAMS];

export function OnboardingScreen() {
  const colors = Colors.dark;
  const { completeOnboarding } = useFavoriteTeam();
  const [picked, setPicked] = useState(NONE_VALUE);
  const [submitting, setSubmitting] = useState(false);

  async function handleStart() {
    if (submitting) return;
    setSubmitting(true);
    await completeOnboarding(picked);
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            観戦きろくへようこそ
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.lead}>
            お気に入りのチームは？
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
            選んだチームに合わせてアプリのデザインを変えられるようになる予定です。後ほど設定からいつでも変更できます。
          </ThemedText>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {OPTIONS.map((opt) => {
            const selected = opt.code === picked;
            return (
              <Pressable
                key={opt.code || 'none'}
                onPress={() => setPicked(opt.code)}
                style={[
                  styles.row,
                  {
                    backgroundColor: selected ? colors.backgroundSelected : colors.backgroundElement,
                    borderColor: selected ? colors.accent : colors.border,
                  },
                ]}>
                <Text style={[styles.rowText, { color: selected ? colors.accent : colors.text }]}>
                  {opt.nickname}
                  {opt.code ? `（${opt.code}）` : ''}
                </Text>
                {selected && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          onPress={handleStart}
          disabled={submitting}
          style={[styles.startBtn, { backgroundColor: colors.accent, opacity: submitting ? 0.6 : 1 }]}>
          <Text style={styles.startBtnText}>はじめる</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  inner: { flex: 1, maxWidth: MaxContentWidth, width: '100%', alignSelf: 'center', padding: Spacing.four },
  header: { marginBottom: Spacing.three },
  title: { fontSize: 24, lineHeight: 30, marginBottom: Spacing.three },
  lead: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  note: { lineHeight: 18 },
  list: { flex: 1 },
  listContent: { gap: 8, paddingBottom: Spacing.three },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowText: { fontSize: 15, fontWeight: '600' },
  startBtn: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  startBtnText: { fontSize: 15, fontWeight: '700', color: '#12100a' },
});
