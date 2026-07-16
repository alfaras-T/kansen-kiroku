import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatDateJP } from '@/components/form/date-field';
import { Slider } from '@/components/form/slider';
import { OverlayCard } from '@/components/overlay-card';
import { ThemedText } from '@/components/themed-text';
import {
  DEFAULT_PHOTO_OFFSET,
  DEFAULT_PHOTO_SCALE,
  MAX_PHOTO_SCALE,
  MIN_PHOTO_SCALE,
  OUTPUT_RATIOS,
  OVERLAY_STYLES,
  OutputRatio,
  OverlayPosition,
  OverlayStyleKey,
  POSITIONS,
  resolveOverlayAspect,
} from '@/constants/overlayStyles';
import { Colors, MaxContentWidth } from '@/constants/theme';
import { useCreateForm } from '@/contexts/create-form';

const POSITION_ORDER: OverlayPosition[] = ['br', 'bl', 'tr', 'tl'];
const STYLE_ORDER: OverlayStyleKey[] = ['amber', 'mono', 'green'];
const RATIO_ORDER: OutputRatio[] = OUTPUT_RATIOS.map((r) => r.key);

function nextInList<T>(list: T[], current: T): T {
  const idx = list.indexOf(current);
  return list[(idx + 1) % list.length];
}

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
    setRatio,
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

  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  function onStageLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setStageSize({ width, height });
  }

  const isAdjusted = photoOffset.x !== 0 || photoOffset.y !== 0 || photoScale !== DEFAULT_PHOTO_SCALE;

  // 「ストーリー」はインスタのストーリーのように画面(ステージ)いっぱいに表示する（サイドの余白なし）。
  // それ以外の比率は、指定した縦横比を保ったまま画面に収まる最大サイズにする（object-fit: containと同じ考え方）。
  let renderWidth: number;
  let renderHeight: number;
  if (ratio === 'story') {
    renderWidth = stageSize.width;
    renderHeight = stageSize.height;
  } else {
    const targetAspect = resolveOverlayAspect(ratio, photoAspectRatio);
    renderWidth = stageSize.width;
    renderHeight = stageSize.width / targetAspect;
    if (stageSize.width > 0 && stageSize.height > 0 && renderHeight > stageSize.height) {
      renderHeight = stageSize.height;
      renderWidth = stageSize.height * targetAspect;
    }
    renderWidth = Math.min(renderWidth, MaxContentWidth);
  }

  return (
    <View style={[styles.screen, { backgroundColor: '#000' }]}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable onPress={goBack} hitSlop={10} style={styles.roundBtn}>
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
          <ThemedText type="small" style={styles.topTitle}>
            写真を調整
          </ThemedText>
          <View style={styles.roundBtn} />
        </View>

        {!photoUri ? (
          <View style={styles.emptyState}>
            <ThemedText type="default" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              まだ写真が選択されていません。
            </ThemedText>
            <Pressable onPress={goBack} style={[styles.emptyBtn, { borderColor: colors.border }]}>
              <Text style={{ color: colors.textSecondary, fontSize: 13.5 }}>「記録する」タブに戻る</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View
              style={[styles.stage, ratio === 'story' && styles.stageFullBleed]}
              onLayout={onStageLayout}>
              {stageSize.width > 0 && (
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
                  style={{ width: renderWidth, height: renderHeight, aspectRatio: undefined }}
                />
              )}

              <View style={styles.iconColumn}>
                <View style={styles.iconGroup}>
                  <Pressable
                    onPress={() => setRatio(nextInList(RATIO_ORDER, ratio))}
                    style={styles.iconBtn}>
                    <Ionicons name="crop-outline" size={20} color="#fff" />
                  </Pressable>
                  <Text style={styles.iconBtnLabel} numberOfLines={1} ellipsizeMode="tail">
                    {OUTPUT_RATIOS.find((r) => r.key === ratio)?.label.split('（')[0]}
                  </Text>
                </View>

                <View style={styles.iconGroup}>
                  <Pressable
                    onPress={() => setPosition(nextInList(POSITION_ORDER, position))}
                    style={styles.iconBtn}>
                    <Ionicons name="move-outline" size={20} color="#fff" />
                  </Pressable>
                  <Text style={styles.iconBtnLabel}>{POSITIONS.find((p) => p.key === position)?.label}</Text>
                </View>

                <View style={styles.iconGroup}>
                  <Pressable
                    onPress={() => setStyleKey(nextInList(STYLE_ORDER, styleKey))}
                    style={styles.iconBtn}>
                    <Ionicons name="color-palette-outline" size={20} color="#fff" />
                  </Pressable>
                  <Text style={styles.iconBtnLabel} numberOfLines={1}>
                    {OVERLAY_STYLES[styleKey].label.split('（')[0]}
                  </Text>
                </View>

                <View style={styles.iconGroup}>
                  <Pressable onPress={() => setWinHighlight(!winHighlight)} style={styles.iconBtn}>
                    <Ionicons
                      name={winHighlight ? 'flame' : 'flame-outline'}
                      size={20}
                      color={winHighlight ? colors.accent : '#fff'}
                    />
                  </Pressable>
                  <Text style={styles.iconBtnLabel}>ハイライト</Text>
                </View>

                {isAdjusted && (
                  <View style={styles.iconGroup}>
                    <Pressable
                      onPress={() => {
                        setPhotoOffset(DEFAULT_PHOTO_OFFSET);
                        setPhotoScale(DEFAULT_PHOTO_SCALE);
                      }}
                      style={styles.iconBtn}>
                      <Ionicons name="refresh-outline" size={20} color="#fff" />
                    </Pressable>
                    <Text style={styles.iconBtnLabel}>リセット</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.zoomRow}>
              <Ionicons name="remove-circle-outline" size={18} color="rgba(255,255,255,0.7)" />
              <View style={styles.zoomSlider}>
                <Slider
                  value={(photoScale - MIN_PHOTO_SCALE) / (MAX_PHOTO_SCALE - MIN_PHOTO_SCALE)}
                  onChange={(v) => setPhotoScale(MIN_PHOTO_SCALE + v * (MAX_PHOTO_SCALE - MIN_PHOTO_SCALE))}
                  trackColor="rgba(255,255,255,0.25)"
                  fillColor={colors.accent}
                  knobColor={colors.accent}
                />
              </View>
              <Ionicons name="add-circle-outline" size={18} color="rgba(255,255,255,0.7)" />
            </View>

            <View style={styles.bottomBar}>
              <Pressable
                disabled={saving}
                onPress={handleSaveToLibrary}
                style={[styles.primaryBtn, { backgroundColor: colors.accent, opacity: saving ? 0.6 : 1 }]}>
                <Ionicons name="download" size={17} color="#12100a" />
                <Text style={styles.primaryBtnText}>保存</Text>
              </Pressable>
              <Pressable
                disabled={saving}
                onPress={handleShare}
                style={[styles.secondaryBtn, { opacity: saving ? 0.6 : 1 }]}>
                <Ionicons name="share-outline" size={17} color="#fff" />
                <Text style={styles.secondaryBtnText}>共有</Text>
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  roundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  topTitle: { color: '#fff' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  stageFullBleed: {
    paddingHorizontal: 0,
  },
  iconColumn: {
    position: 'absolute',
    top: 10,
    right: 6,
    gap: 16,
    alignItems: 'center',
  },
  iconGroup: { alignItems: 'center' },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnLabel: {
    marginTop: 4,
    color: '#fff',
    fontSize: 9.5,
    width: 64,
    textAlign: 'center',
  },
  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 6,
  },
  zoomSlider: { flex: 1 },
  bottomBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
    paddingVertical: 13,
  },
  primaryBtnText: { color: '#12100a', fontWeight: '700', fontSize: 14.5 },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  secondaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14.5 },
});
