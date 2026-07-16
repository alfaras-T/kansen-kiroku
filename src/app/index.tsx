import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { DateField } from '@/components/form/date-field';
import { LabeledField } from '@/components/form/labeled-field';
import { SelectModal } from '@/components/form/select-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { OTHER_STADIUM, STADIUMS } from '@/constants/stadiums';
import { OTHER_TEAM, TEAMS } from '@/constants/teams';
import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCreateForm } from '@/contexts/create-form';

const TEAM_OPTIONS = [
  ...TEAMS.map((t) => ({ label: `${t.nickname}（${t.code}）`, value: t.code })),
  { label: 'その他（自由入力）', value: OTHER_TEAM },
];
const STADIUM_OPTIONS = [
  ...STADIUMS.map((s) => ({ label: s, value: s })),
  { label: 'その他（直接入力）', value: OTHER_STADIUM },
];

export default function CreateScreen() {
  const colors = Colors.dark;
  const router = useRouter();
  const form = useCreateForm();
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
  } = form;

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: BottomTabInset + Spacing.four },
        ]}>
        <View style={styles.header}>
          <ThemedText type="small" themeColor="accent" style={styles.eyebrow}>
            KANSEN KIROKU
          </ThemedText>
          <ThemedText type="title" style={styles.title}>
            観戦きろく
          </ThemedText>
        </View>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <ThemedText type="default">観戦記録のみ保存（写真なし）</ThemedText>
            <Switch
              value={recordOnly}
              onValueChange={setRecordOnly}
              trackColor={{ true: colors.accent, false: colors.border }}
            />
          </View>
        </View>

        <View style={styles.card}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            試合情報
          </ThemedText>

          <LabeledField label="試合日">
            <DateField value={date} onChange={setDate} />
          </LabeledField>

          <LabeledField label="先攻（ビジター）">
            <View style={styles.teamRow}>
              <View style={{ flex: 1 }}>
                <SelectModal
                  title="先攻チームを選択"
                  options={TEAM_OPTIONS}
                  value={visitorCode}
                  onChange={setVisitorCode}
                />
              </View>
              <TextInput
                value={visitorScore}
                onChangeText={setVisitorScore}
                keyboardType="number-pad"
                style={[
                  styles.scoreInput,
                  { borderColor: colors.border, backgroundColor: colors.backgroundElement, color: colors.text },
                ]}
              />
            </View>
            {visitorCode === OTHER_TEAM && (
              <TextInput
                value={visitorTeamOther}
                onChangeText={setVisitorTeamOther}
                placeholder="チーム名を入力"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.textInput,
                  { marginTop: 8, borderColor: colors.border, backgroundColor: colors.backgroundElement, color: colors.text },
                ]}
              />
            )}
          </LabeledField>

          <LabeledField label="後攻（ホーム）">
            <View style={styles.teamRow}>
              <View style={{ flex: 1 }}>
                <SelectModal
                  title="後攻チームを選択"
                  options={TEAM_OPTIONS}
                  value={homeCode}
                  onChange={setHomeCode}
                />
              </View>
              <TextInput
                value={homeScore}
                onChangeText={setHomeScore}
                keyboardType="number-pad"
                style={[
                  styles.scoreInput,
                  { borderColor: colors.border, backgroundColor: colors.backgroundElement, color: colors.text },
                ]}
              />
            </View>
            {homeCode === OTHER_TEAM && (
              <TextInput
                value={homeTeamOther}
                onChangeText={setHomeTeamOther}
                placeholder="チーム名を入力"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.textInput,
                  { marginTop: 8, borderColor: colors.border, backgroundColor: colors.backgroundElement, color: colors.text },
                ]}
              />
            )}
          </LabeledField>

          <LabeledField label="📍 球場">
            <SelectModal title="球場を選択" options={STADIUM_OPTIONS} value={stadium} onChange={setStadium} />
            {stadium === OTHER_STADIUM && (
              <TextInput
                value={stadiumOther}
                onChangeText={setStadiumOther}
                placeholder="球場名を入力"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.textInput,
                  { marginTop: 8, borderColor: colors.border, backgroundColor: colors.backgroundElement, color: colors.text },
                ]}
              />
            )}
          </LabeledField>

          <LabeledField label="自由メモ（任意）">
            <TextInput
              value={memo}
              onChangeText={setMemo}
              placeholder="例：3塁側内野、記念日など"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.textInput,
                { borderColor: colors.border, backgroundColor: colors.backgroundElement, color: colors.text },
              ]}
            />
          </LabeledField>
        </View>

        {recordOnly && (
          <Pressable onPress={handleSaveRecord} style={[styles.recordBtn, { borderColor: colors.border }]}>
            <Text style={{ color: colors.textSecondary, fontSize: 13.5 }}>
              {savedFlash ? '保存しました ✓' : 'この記録を保存する'}
            </Text>
          </Pressable>
        )}

        <View
          style={recordOnly ? styles.disabledSection : undefined}
          pointerEvents={recordOnly ? 'none' : 'auto'}>
          <Pressable
            onPress={pickPhoto}
            style={[styles.photoBtn, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
            <Ionicons name="image" size={17} color={colors.accent} />
            <Text style={{ color: colors.text, fontSize: 14 }}>
              {photoUri ? '写真を変更' : '写真を選ぶ'}
            </Text>
          </Pressable>

          {photoUri && (
            <Pressable
              onPress={() => router.push('/adjust')}
              style={[styles.adjustBtn, { borderColor: colors.accent }]}>
              <Ionicons name="crop" size={17} color={colors.accent} />
              <Text style={{ color: colors.accent, fontSize: 14, fontWeight: '600' }}>写真を調整する</Text>
            </Pressable>
          )}

          {photoUri && (
            <Pressable onPress={clearPhoto} style={styles.clearPhoto}>
              <ThemedText type="small" themeColor="danger">
                写真をクリア
              </ThemedText>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: { marginBottom: Spacing.three },
  eyebrow: { letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: 26, lineHeight: 32 },
  disabledSection: { opacity: 0.35 },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 8,
  },
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 8,
  },
  clearPhoto: { alignSelf: 'center', marginBottom: Spacing.two, padding: 4 },
  card: {
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  teamRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  scoreInput: {
    width: 64,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
    fontSize: 15,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  recordBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
});
