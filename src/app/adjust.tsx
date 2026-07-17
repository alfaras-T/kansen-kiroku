import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatDateOverlay } from "@/components/form/date-field";
import { Slider } from "@/components/form/slider";
import { OverlayCard } from "@/components/overlay-card";
import { ThemedText } from "@/components/themed-text";
import {
  DEFAULT_PHOTO_OFFSET,
  DEFAULT_PHOTO_SCALE,
  DEFAULT_TELOP_SCALE,
  MAX_TELOP_SCALE,
  MIN_TELOP_SCALE,
  OUTPUT_RATIOS,
  OVERLAY_STYLES,
  OutputRatio,
  OverlayPosition,
  OverlayStyleKey,
  POSITIONS,
  resolveExportSize,
  resolveOverlayAspect,
} from "@/constants/overlayStyles";
import { MaxContentWidth } from "@/constants/theme";
import { useCreateForm } from "@/contexts/create-form";
import { useTheme } from "@/hooks/use-theme";

const POSITION_ORDER: OverlayPosition[] = ["br", "bl", "tr", "tl"];
const STYLE_ORDER: OverlayStyleKey[] = ["classic", "minimal", "film", "night"];
const RATIO_ORDER: OutputRatio[] = OUTPUT_RATIOS.map((r) => r.key);

function nextInList<T>(list: T[], current: T): T {
  const idx = list.indexOf(current);
  return list[(idx + 1) % list.length];
}

// テロップの拡大率(MIN_TELOP_SCALE〜MAX_TELOP_SCALE)とスライダーの0〜1の正規化値を相互変換する
function telopScaleToNorm(scale: number): number {
  return (scale - MIN_TELOP_SCALE) / (MAX_TELOP_SCALE - MIN_TELOP_SCALE);
}
function normToTelopScale(norm: number): number {
  return MIN_TELOP_SCALE + norm * (MAX_TELOP_SCALE - MIN_TELOP_SCALE);
}

export default function AdjustScreen() {
  const colors = useTheme();
  const router = useRouter();
  const form = useCreateForm();
  const {
    overlayRef,
    exportRef,
    photoUri,
    photoAspectRatio,
    photoOffset,
    setPhotoOffset,
    photoScale,
    setPhotoScale,
    telopScale,
    setTelopScale,
    ratio,
    setRatio,
    position,
    setPosition,
    styleKey,
    setStyleKey,
    winHighlight,
    setWinHighlight,
    alsoSaveToHistory,
    setAlsoSaveToHistory,
    savedFlash,
    visitorTeamName,
    homeTeamName,
    visitorScore,
    homeScore,
    date,
    stadiumName,
    memo,
    saving,
    handleSaveAndShare,
  } = form;

  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [textSizeOpen, setTextSizeOpen] = useState(false);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  function onStageLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setStageSize({ width, height });
  }

  const isAdjusted =
    photoOffset.x !== 0 ||
    photoOffset.y !== 0 ||
    photoScale !== DEFAULT_PHOTO_SCALE ||
    telopScale !== DEFAULT_TELOP_SCALE;

  // 選んだ比率を保ったまま、画面(ステージ)に収まる最大サイズを計算する（object-fit: containと同じ考え方）
  const targetAspect = resolveOverlayAspect(ratio, photoAspectRatio);
  let renderWidth = stageSize.width;
  let renderHeight = stageSize.width / targetAspect;
  if (
    stageSize.width > 0 &&
    stageSize.height > 0 &&
    renderHeight > stageSize.height
  ) {
    renderHeight = stageSize.height;
    renderWidth = stageSize.height * targetAspect;
  }
  renderWidth = Math.min(renderWidth, MaxContentWidth);

  // 保存/共有時にキャプチャする書き出し専用View用のサイズ。
  // 画面プレビュー(renderWidth/renderHeight、画面に収まる小さいサイズ)とは
  // 完全に切り離した固定解像度で、常にこのサイズで書き出す。
  const exportSize = resolveExportSize(ratio, photoAspectRatio);
  // テロップの固定pt値(フォントサイズ・余白)はカード幅に対して相対的に決まっていないため、
  // 書き出しサイズがプレビューよりずっと大きい分だけ追加でスケールし、
  // プレビューと同じ見た目の比率になるようにする。
  const exportScaleFactor =
    renderWidth > 0 ? exportSize.width / renderWidth : 1;

  return (
    <View style={[styles.screen, { backgroundColor: "#000" }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
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
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={{ textAlign: "center" }}
            >
              まだ写真が選択されていません。
            </ThemedText>
            <Pressable
              onPress={goBack}
              style={[styles.emptyBtn, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 13.5 }}>
                「記録する」タブに戻る
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.stage} onLayout={onStageLayout}>
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
                  visitorScore={visitorScore || "0"}
                  homeScore={homeScore || "0"}
                  dateLabel={formatDateOverlay(date)}
                  stadium={stadiumName}
                  memo={memo}
                  winHighlight={winHighlight}
                  photoOffset={photoOffset}
                  onPhotoOffsetChange={setPhotoOffset}
                  photoScale={photoScale}
                  onPhotoScaleChange={setPhotoScale}
                  telopScale={telopScale}
                  style={{
                    width: renderWidth,
                    height: renderHeight,
                    aspectRatio: undefined,
                  }}
                />
              )}

              {/*
                書き出し専用の非表示View。
                画面上のプレビューは操作しやすいよう小さく縮小表示しているが、
                保存/共有時はこちらを固定解像度でキャプチャすることで、
                プレビューの表示サイズに関係なく常に一定の画質で書き出す。
                画面外へ配置し、タッチも奪わないようにする。
              */}
              <View pointerEvents="none" style={styles.exportStage}>
                <OverlayCard
                  ref={exportRef}
                  photoUri={photoUri}
                  photoAspectRatio={photoAspectRatio}
                  ratio={ratio}
                  position={position}
                  styleKey={styleKey}
                  visitorCode={visitorTeamName}
                  homeCode={homeTeamName}
                  visitorScore={visitorScore || "0"}
                  homeScore={homeScore || "0"}
                  dateLabel={formatDateOverlay(date)}
                  stadium={stadiumName}
                  memo={memo}
                  winHighlight={winHighlight}
                  photoOffset={photoOffset}
                  photoScale={photoScale}
                  telopScale={telopScale}
                  scaleFactor={exportScaleFactor}
                  style={{
                    width: exportSize.width,
                    height: exportSize.height,
                    aspectRatio: undefined,
                  }}
                />
              </View>

              <View style={styles.iconColumn}>
                <View style={styles.iconGroup}>
                  <Text
                    style={styles.iconLabel}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {
                      OUTPUT_RATIOS.find((r) => r.key === ratio)?.label.split(
                        "（",
                      )[0]
                    }
                  </Text>
                  <Pressable
                    onPress={() => setRatio(nextInList(RATIO_ORDER, ratio))}
                    style={styles.iconBtn}
                  >
                    <Ionicons name="crop-outline" size={16} color="#fff" />
                  </Pressable>
                </View>

                <View style={styles.iconGroup}>
                  <Text style={styles.iconLabel}>
                    {POSITIONS.find((p) => p.key === position)?.label}
                  </Text>
                  <Pressable
                    onPress={() =>
                      setPosition(nextInList(POSITION_ORDER, position))
                    }
                    style={styles.iconBtn}
                  >
                    <Ionicons name="move-outline" size={16} color="#fff" />
                  </Pressable>
                </View>

                <View style={styles.iconGroup}>
                  <Text
                    style={styles.iconLabel}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {OVERLAY_STYLES[styleKey].label.split("（")[0]}
                  </Text>
                  <Pressable
                    onPress={() =>
                      setStyleKey(nextInList(STYLE_ORDER, styleKey))
                    }
                    style={styles.iconBtn}
                  >
                    <Ionicons
                      name="color-palette-outline"
                      size={16}
                      color="#fff"
                    />
                  </Pressable>
                </View>

                <View style={styles.iconGroup}>
                  <Text style={styles.iconLabel}>文字サイズ</Text>
                  <Pressable
                    onPress={() => setTextSizeOpen((v) => !v)}
                    style={[
                      styles.iconBtn,
                      textSizeOpen && {
                        backgroundColor: "rgba(255,255,255,0.28)",
                      },
                    ]}
                  >
                    <Ionicons name="text-outline" size={16} color="#fff" />
                  </Pressable>
                </View>

                <View style={styles.iconGroup}>
                  <Text style={styles.iconLabel}>ハイライト</Text>
                  <Pressable
                    onPress={() => setWinHighlight(!winHighlight)}
                    style={styles.iconBtn}
                  >
                    <Ionicons
                      name={winHighlight ? "flame" : "flame-outline"}
                      size={16}
                      color={winHighlight ? colors.accent : "#fff"}
                    />
                  </Pressable>
                </View>

                {isAdjusted && (
                  <View style={styles.iconGroup}>
                    <Text style={styles.iconLabel}>リセット</Text>
                    <Pressable
                      onPress={() => {
                        setPhotoOffset(DEFAULT_PHOTO_OFFSET);
                        setPhotoScale(DEFAULT_PHOTO_SCALE);
                        setTelopScale(DEFAULT_TELOP_SCALE);
                      }}
                      style={styles.iconBtn}
                    >
                      <Ionicons name="refresh-outline" size={16} color="#fff" />
                    </Pressable>
                  </View>
                )}
              </View>

              {textSizeOpen && (
                <View style={styles.textSizePopover}>
                  <View style={styles.textSizePopoverHeader}>
                    <Text style={styles.textSizePopoverLabel}>文字サイズ</Text>
                    <Text style={styles.textSizePopoverValue}>
                      {Math.round(telopScale * 100)}%
                    </Text>
                  </View>
                  <Slider
                    value={telopScaleToNorm(telopScale)}
                    onChange={(norm) => setTelopScale(normToTelopScale(norm))}
                    trackColor="rgba(255,255,255,0.25)"
                    fillColor={colors.accent}
                    knobColor="#fff"
                  />
                </View>
              )}
            </View>

            <View style={styles.historyRow}>
              <Text style={styles.historyRowLabel}>
                観戦履歴にも保存する{savedFlash ? "（保存しました ✓）" : ""}
              </Text>
              <Switch
                value={alsoSaveToHistory}
                onValueChange={setAlsoSaveToHistory}
                trackColor={{
                  true: colors.accent,
                  false: "rgba(255,255,255,0.25)",
                }}
              />
            </View>

            <View style={styles.bottomBar}>
              <Pressable
                disabled={saving}
                onPress={handleSaveAndShare}
                style={[
                  styles.saveShareBtn,
                  { backgroundColor: colors.accent, opacity: saving ? 0.6 : 1 },
                ]}
              >
                <Ionicons
                  name="share-outline"
                  size={19}
                  color={colors.onAccent}
                />
                <Text
                  style={[styles.saveShareBtnText, { color: colors.onAccent }]}
                >
                  {saving ? "処理中…" : "保存 / 共有"}
                </Text>
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
    width: "100%",
    alignSelf: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  roundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  topTitle: { color: "#fff" },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  // 書き出し専用View置き場。画面には表示しないが、レイアウト計算と
  // captureRefでのキャプチャは行えるよう画面外に実配置する
  // (display: 'none'にすると計測・キャプチャ自体ができなくなるため使わない)。
  exportStage: {
    position: "absolute",
    top: 0,
    left: -100000,
  },
  iconColumn: {
    position: "absolute",
    top: 8,
    right: 6,
    gap: 8,
    alignItems: "flex-end",
  },
  iconGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconLabel: {
    color: "#fff",
    fontSize: 10.5,
    maxWidth: 74,
    textAlign: "right",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  textSizePopover: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textSizePopoverHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  textSizePopoverLabel: { color: "#fff", fontSize: 13, fontWeight: "600" },
  textSizePopoverValue: { color: "rgba(255,255,255,0.75)", fontSize: 12.5 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
  },
  historyRowLabel: {
    color: "#fff",
    fontSize: 13.5,
    flexShrink: 1,
    marginRight: 10,
  },
  bottomBar: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  saveShareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 10,
    paddingVertical: 15,
  },
  saveShareBtnText: { fontWeight: "700", fontSize: 15.5 },
});
