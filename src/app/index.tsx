import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { DateField, formatDateJP } from '@/components/form/date-field';
import { LabeledField } from '@/components/form/labeled-field';
import { SegmentedControl } from '@/components/form/segmented-control';
import { SelectModal } from '@/components/form/select-modal';
import { OverlayCard } from '@/components/overlay-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { OTHER_STADIUM, STADIUMS } from '@/constants/stadiums';
import {
  OUTPUT_RATIOS,
  OVERLAY_STYLES,
  OverlayPosition,
  OverlayStyleKey,
  OutputRatio,
  POSITIONS,
} from '@/constants/overlayStyles';
import { TEAMS, TeamCode } from '@/constants/teams';
import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { addHistoryEntry } from '@/storage/history';
import { HistoryEntry } from '@/types/history';

const TEAM_OPTIONS = TEAMS.map((t) => ({ label: `${t.nickname}（${t.code}）`, value: t.code }));
const STADIUM_OPTIONS = [
  ...STADIUMS.map((s) => ({ label: s, value: s })),
  { label: 'その他（直接入力）', value: OTHER_STADIUM },
];

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function CreateScreen() {
  const colors = Colors.dark;
  const overlayRef = useRef<View>(null);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [ratio, setRatio] = useState<OutputRatio>('original');
  const [position, setPosition] = useState<OverlayPosition>('br');
  const [styleKey, setStyleKey] = useState<OverlayStyleKey>('amber');
  const [winHighlight, setWinHighlight] = useState(false);

  const [date, setDate] = useState(todayISO());
  const [stadium, setStadium] = useState<string>(STADIUMS[0]);
  const [stadiumOther, setStadiumOther] = useState('');
  const [visitorCode, setVisitorCode] = useState<TeamCode>('T');
  const [homeCode, setHomeCode] = useState<TeamCode>('G');
  const [visitorScore, setVisitorScore] = useState('3');
  const [homeScore, setHomeScore] = useState('1');
  const [isDraw, setIsDraw] = useState(false);
  const [isExtra, setIsExtra] = useState(false);
  const [extraInning, setExtraInning] = useState('12');
  const [seatMemo, setSeatMemo] = useState('');

  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const stadiumName = stadium === OTHER_STADIUM ? stadiumOther.trim() : stadium;

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('権限が必要です', '写真ライブラリへのアクセスを許可してください');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function capture(): Promise<string | null> {
    if (!overlayRef.current) return null;
    try {
      return await captureRef(overlayRef, {
        format: 'png',
        quality: 1,
        result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile',
      });
    } catch {
      Alert.alert('エラー', '画像の生成に失敗しました');
      return null;
    }
  }

  function downloadOnWeb(dataUri: string) {
    const link = document.createElement('a');
    link.download = `kansen-kiroku_${date || 'photo'}.png`;
    link.href = dataUri;
    link.click();
  }

  async function handleSaveToLibrary() {
    setSaving(true);
    try {
      const uri = await capture();
      if (!uri) return;

      if (Platform.OS === 'web') {
        // Webではダウンロードとして保存
        downloadOnWeb(uri);
        return;
      }

      // ネイティブのみ: expo-media-libraryを動的に読み込む(Webでは読み込むだけでエラーになるため)
      const MediaLibrary = await import('expo-media-library');
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('権限が必要です', '写真アプリへの保存を許可してください');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('保存しました', '写真アプリに画像を保存しました');
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    setSaving(true);
    try {
      const uri = await capture();
      if (!uri) return;

      if (Platform.OS === 'web') {
        // Web Share API(ファイル共有)が使えれば共有、なければダウンロード
        try {
          const blob = await (await fetch(uri)).blob();
          const file = new File([blob], `kansen-kiroku_${date || 'photo'}.png`, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: '観戦きろく' });
            return;
          }
        } catch {
          // 共有キャンセルや未対応の場合はダウンロードにフォールバック
        }
        downloadOnWeb(uri);
        return;
      }

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('共有できません', 'この端末では共有機能が利用できません');
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '観戦きろくを共有' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveRecord() {
    const entry: HistoryEntry = {
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
      date,
      stadium: stadiumName,
      visitorCode,
      homeCode,
      visitorScore: visitorScore || '0',
      homeScore: homeScore || '0',
      isDraw,
      isExtra,
      extraInning,
      seatMemo: seatMemo.trim(),
    };
    await addHistoryEntry(entry);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: BottomTabInset + Spacing.six },
        ]}>
        <View style={styles.header}>
          <ThemedText type="small" themeColor="accent" style={styles.eyebrow}>
            KANSEN KIROKU
          </ThemedText>
          <ThemedText type="title" style={styles.title}>
            観戦きろく
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            写真に日付・スコア・球場を重ねて保存・共有できます。
          </ThemedText>
        </View>

        <View style={styles.previewWrap}>
          <OverlayCard
            ref={overlayRef}
            photoUri={photoUri}
            ratio={ratio}
            position={position}
            styleKey={styleKey}
            visitorCode={visitorCode}
            homeCode={homeCode}
            visitorScore={visitorScore || '0'}
            homeScore={homeScore || '0'}
            dateLabel={formatDateJP(date)}
            stadium={stadiumName}
            isDraw={isDraw}
            isExtra={isExtra}
            extraInning={extraInning}
            seatMemo={seatMemo}
            winHighlight={winHighlight}
          />
        </View>

        <Pressable
          onPress={pickPhoto}
          style={[styles.photoBtn, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
          <Ionicons name="image" size={17} color={colors.accent} />
          <Text style={{ color: colors.text, fontSize: 14 }}>
            {photoUri ? '写真を変更' : '写真を選ぶ'}
          </Text>
        </Pressable>
        {photoUri && (
          <Pressable onPress={() => setPhotoUri(null)} style={styles.clearPhoto}>
            <ThemedText type="small" themeColor="danger">
              写真をクリア（背景のみで作成）
            </ThemedText>
          </Pressable>
        )}

        <View style={styles.card}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            出力サイズ
          </ThemedText>
          <SegmentedControl
            options={OUTPUT_RATIOS.map((r) => ({ value: r.key, label: r.label }))}
            value={ratio}
            onChange={setRatio}
            wrap
          />
        </View>

        <View style={styles.card}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            試合情報
          </ThemedText>

          <LabeledField label="試合日">
            <DateField value={date} onChange={setDate} />
          </LabeledField>

          <LabeledField label="球場">
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

          <LabeledField label="先攻（ビジター）">
            <View style={styles.teamRow}>
              <View style={{ flex: 1 }}>
                <SelectModal
                  title="先攻チームを選択"
                  options={TEAM_OPTIONS}
                  value={visitorCode}
                  onChange={(v) => setVisitorCode(v as TeamCode)}
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
          </LabeledField>

          <LabeledField label="後攻（ホーム）">
            <View style={styles.teamRow}>
              <View style={{ flex: 1 }}>
                <SelectModal
                  title="後攻チームを選択"
                  options={TEAM_OPTIONS}
                  value={homeCode}
                  onChange={(v) => setHomeCode(v as TeamCode)}
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
          </LabeledField>

          <View style={styles.switchRow}>
            <ThemedText type="default">引き分け</ThemedText>
            <Switch
              value={isDraw}
              onValueChange={(v) => {
                setIsDraw(v);
                if (v) setIsExtra(false);
              }}
              trackColor={{ true: colors.accent, false: colors.border }}
            />
          </View>
          <View style={styles.switchRow}>
            <ThemedText type="default">延長</ThemedText>
            <Switch
              value={isExtra}
              onValueChange={(v) => {
                setIsExtra(v);
                if (v) setIsDraw(false);
              }}
              trackColor={{ true: colors.accent, false: colors.border }}
            />
          </View>
          {isExtra && (
            <LabeledField label="最終回">
              <TextInput
                value={extraInning}
                onChangeText={setExtraInning}
                keyboardType="number-pad"
                style={[
                  styles.scoreInput,
                  { width: 80, borderColor: colors.border, backgroundColor: colors.backgroundElement, color: colors.text },
                ]}
              />
            </LabeledField>
          )}

          <LabeledField label="座席メモ（任意）">
            <TextInput
              value={seatMemo}
              onChangeText={setSeatMemo}
              placeholder="例：3塁側内野"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.textInput,
                { borderColor: colors.border, backgroundColor: colors.backgroundElement, color: colors.text },
              ]}
            />
          </LabeledField>
        </View>

        <View style={styles.card}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            表示デザイン
          </ThemedText>

          <LabeledField label="表示位置">
            <SegmentedControl
              options={POSITIONS.map((p) => ({ value: p.key, label: p.label }))}
              value={position}
              onChange={setPosition}
              wrap
            />
          </LabeledField>

          <LabeledField label="スタイル">
            <SegmentedControl
              options={Object.entries(OVERLAY_STYLES).map(([key, v]) => ({
                value: key as OverlayStyleKey,
                label: v.label,
              }))}
              value={styleKey}
              onChange={setStyleKey}
              wrap
            />
          </LabeledField>

          <View style={styles.switchRow}>
            <ThemedText type="default">勝敗ハイライト</ThemedText>
            <Switch
              value={winHighlight}
              onValueChange={setWinHighlight}
              trackColor={{ true: colors.accent, false: colors.border }}
            />
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            disabled={saving}
            onPress={handleSaveToLibrary}
            style={[styles.primaryBtn, { backgroundColor: colors.accent, opacity: saving ? 0.6 : 1 }]}>
            <Ionicons name="download" size={17} color="#12100a" />
            <Text style={styles.primaryBtnText}>写真アプリに保存</Text>
          </Pressable>
          <Pressable
            disabled={saving}
            onPress={handleShare}
            style={[styles.secondaryBtn, { borderColor: colors.border, opacity: saving ? 0.6 : 1 }]}>
            <Ionicons name="share-outline" size={17} color={colors.text} />
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>共有する</Text>
          </Pressable>
        </View>

        <Pressable onPress={handleSaveRecord} style={[styles.recordBtn, { borderColor: colors.border }]}>
          <Text style={{ color: colors.textSecondary, fontSize: 13.5 }}>
            {savedFlash ? '保存しました ✓' : '観戦記録として保存（画像は保存しません）'}
          </Text>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: {
    padding: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: { marginBottom: Spacing.four },
  eyebrow: { letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: 30, lineHeight: 36, marginBottom: 6 },
  previewWrap: { marginBottom: Spacing.three },
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
  clearPhoto: { alignSelf: 'center', marginBottom: Spacing.three, padding: 4 },
  card: {
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  teamRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  scoreInput: {
    width: 64,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 15,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
    paddingVertical: 14,
  },
  primaryBtnText: { color: '#12100a', fontWeight: '700', fontSize: 14.5 },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
    paddingVertical: 14,
    borderWidth: 1,
  },
  secondaryBtnText: { fontWeight: '600', fontSize: 14.5 },
  recordBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
