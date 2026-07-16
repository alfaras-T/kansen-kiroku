import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { formatDateJP } from '@/components/form/date-field';
import { LabeledField } from '@/components/form/labeled-field';
import { SegmentedControl } from '@/components/form/segmented-control';
import { Slider } from '@/components/form/slider';
import { OverlayCard } from '@/components/overlay-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  DEFAULT_PHOTO_OFFSET,
  DEFAULT_PHOTO_SCALE,
  MAX_PHOTO_SCALE,
  MIN_PHOTO_SCALE,
  OVERLAY_STYLES,
  OverlayStyleKey,
  POSITIONS,
} from '@/constants/overlayStyles';
import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCreateForm } from '@/contexts/create-form';

export default function AdjustScreen() {
  const colors = Colors.dark;
  const router = useRouter();
  const form = useCreateForm();
  const {
    overlayRef,
    photoUri,
    photoAspectRatio,
    photoOffset,
    setPhotoOffset,
    photoScale,
    setPhotoScale,
    ratio,
    position,
    setPosition,
    styleKey,
    setStyleKey,
    winHighlight,
    setWinHighlight,
    visitorTeamName,
    homeTeamName,
    visitorScore,
    homeScore,
    date,
    stadiumName,
    isDraw,
    isExtra,
    extraInning,
    memo,
    saving,
    handleSaveToLibrary,
    handleShare,
  } = form;

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: BottomTabInset + Spacing.six },
        ]}>
        <View style={styles.header}>
          <Pressable onPress={goBack} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
            <ThemedText type="default">戻る</ThemedText>
          </Pressable>
          <ThemedText type="title" style={styles.title}>
            写真を調整
          </ThemedText>
        </View>

        {!photoUri ? (
          <View style={styles.emptyState}>
            <ThemedText type="default" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              まだ写真が選択されていません。
            </ThemedText>
            <Pressable
              onPress={goBack}
              style={[styles.recordBtn, { borderColor: colors.border, marginTop: Spacing.three }]}>
              <Text style={{ color: colors.textSecondary, fontSize: 13.5 }}>「記録する」タブに戻る</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.previewHeaderRow}>
                <ThemedText type="smallBold" style={styles.sectionTitle}>
                  プレビュー
                </ThemedText>
                {(photoOffset.x !== 0 || photoOffset.y !== 0 || photoScale !== DEFAULT_PHOTO_SCALE) && (
                  <Pressable
                    onPress={() => {
                      setPhotoOffset(DEFAULT_PHOTO_OFFSET);
                      setPhotoScale(DEFAULT_PHOTO_SCALE);
                    }}>
                    <ThemedText type="small" themeColor="accent">
                      位置をリセット
                    </ThemedText>
                  </Pressable>
                )}
              </View>
              <View style={styles.previewWrap}>
                <OverlayCard
                  ref={overlayRef}
                  photoUri={photoUri}
                  photoAspectRatio={photoAspectRatio}
                  ratio={ratio}
                  position={position}
                  styleKey={styleKey}
                  visitorCode={visitorTeamName}
                  homeCode={homeTeamName}
                  visitorScore={visitorScore || '0'}
                  homeScore={homeScore || '0'}
                  dateLabel={formatDateJP(date)}
                  stadium={stadiumName}
                  isDraw={isDraw}
                  isExtra={isExtra}
                  extraInning={extraInning}
                  memo={memo}
                  winHighlight={winHighlight}
                  photoOffset={photoOffset}
                  onPhotoOffsetChange={setPhotoOffset}
                  photoScale={photoScale}
                  onPhotoScaleChange={setPhotoScale}
                />
              </View>
              <ThemedText type="small" themeColor="textSecondary" style={styles.dragHint}>
                ドラッグで位置調整、2本指のピンチで拡大縮小、ダブルタップで最小サイズに戻せます
              </ThemedText>
              <View style={styles.zoomRow}>
                <Ionicons name="remove-circle-outline" size={18} color={colors.textSecondary} />
                <View style={styles.zoomSlider}>
                  <Slider
                    value={(photoScale - MIN_PHOTO_SCALE) / (MAX_PHOTO_SCALE - MIN_PHOTO_SCALE)}
                    onChange={(v) => setPhotoScale(MIN_PHOTO_SCALE + v * (MAX_PHOTO_SCALE - MIN_PHOTO_SCALE))}
                    trackColor={colors.border}
                    fillColor={colors.accent}
                    knobColor={colors.accent}
                  />
                </View>
                <Ionicons name="add-circle-outline" size={18} color={colors.textSecondary} />
              </View>
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
          </>
        )}
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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 10, alignSelf: 'flex-start' },
  title: { fontSize: 26, lineHeight: 32 },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.six },
  card: {
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  previewWrap: { marginBottom: Spacing.three },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dragHint: { textAlign: 'center', marginTop: 4 },
  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  zoomSlider: { flex: 1 },
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
