import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateField } from '@/components/form/date-field';
import { LabeledField } from '@/components/form/labeled-field';
import { SelectModal } from '@/components/form/select-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { OTHER_STADIUM, STADIUMS } from '@/constants/stadiums';
import { OTHER_TEAM, TEAMS } from '@/constants/teams';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
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
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.headerRow}>
          <ThemedText type="smallBold" style={styles.title}>
            観戦きろく
          </ThemedText>
          <View style={styles.recordOnlyRow}>
            <ThemedText type="small" themeColor="textSecondary">
              記録のみ（写真なし）
            </ThemedText>
            <Switch
              value={recordOnly}
              onValueChange={setRecordOnly}
              trackColor={{ true: colors.accent, false: colors.border }}
              style={styles.smallSwitch}
            />
          </View>
        </View>

        <View style={styles.field}>
          <DateField value={date} onChange={setDate} />
        </View>

        <View style={styles.teamsRow}>
          <View style={styles.teamCol}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.miniLabel}>
              先攻
            </ThemedText>
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
                placeholder="チーム名"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.textInput,
                  { marginTop: 6, borderColor: colors.border, backgroundColor: colors.backgroundElement, color: colors.text },
                ]}
              />
            )}
          </View>

          <View style={styles.teamCol}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.miniLabel}>
              後攻
            </ThemedText>
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
                placeholder="チーム名"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.textInput,
                  { marginTop: 6, borderColor: colors.border, backgroundColor: colors.backgroundElement, color: colors.text },
                ]}
              />
            )}
          </View>
        </View>

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
                { marginTop: 6, borderColor: colors.border, backgroundColor: colors.backgroundElement, color: colors.text },
              ]}
            />
          )}
        </LabeledField>

        <View style={styles.field}>
          <TextInput
            value={memo}
            onChangeText={setMemo}
            placeholder="自由メモ（任意）"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.textInput,
              { borderColor: colors.border, backgroundColor: colors.backgroundElement, color: colors.text },
            ]}
          />
        </View>

        {recordOnly && (
          <Pressable onPress={handleSaveRecord} style={[styles.recordBtn, { borderColor: colors.border }]}>
            <Text style={{ color: colors.textSecondary, fontSize: 13.5 }}>
              {savedFlash ? '保存しました ✓' : 'この記録を保存する'}
            </Text>
          </Pressable>
        )}

        <View
          style={[styles.photoSection, recordOnly && styles.disabledSection]}
          pointerEvents={recordOnly ? 'none' : 'auto'}>
          <Pressable
            onPress={pickPhoto}
            style={[styles.photoBtn, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
            <Ionicons name="image" size={16} color={colors.accent} />
            <Text style={{ color: colors.text, fontSize: 13.5 }}>
              {photoUri ? '写真を変更' : '写真を選ぶ'}
            </Text>
          </Pressable>

          {photoUri && (
            <Pressable
              onPress={() => router.push('/adjust')}
              style={[styles.adjustBtn, { borderColor: colors.accent }]}>
              <Ionicons name="crop" size={16} color={colors.accent} />
              <Text style={{ color: colors.accent, fontSize: 13.5, fontWeight: '600' }}>写真を調整する</Text>
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
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 16 },
  recordOnlyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  smallSwitch: { transform: [{ scale: 0.8 }] },
  disabledSection: { opacity: 0.35 },
  field: {},
  miniLabel: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  teamsRow: { flexDirection: 'row', gap: 10 },
  teamCol: { flex: 1 },
  photoSection: {},
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    marginBottom: 6,
  },
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 10,
    marginBottom: 6,
  },
  clearPhoto: { alignSelf: 'center', padding: 2 },
  teamRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  scoreInput: {
    width: 48,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 6,
    fontSize: 14,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  recordBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
});
