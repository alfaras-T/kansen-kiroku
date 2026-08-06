import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatDateOverlay } from "@/components/form/date-field";
import { ToggleSwitch } from "@/components/form/toggle-switch";
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
  OverlayStyleKey,
  POSITIONS,
  resolveExportSize,
  resolveOverlayAspect,
} from "@/constants/overlayStyles";
import { MaxContentWidth, Radius } from "@/constants/theme";
import { THUMBNAIL_WIDTH } from "@/storage/thumbnails";
import { useCreateForm } from "@/contexts/create-form";
import { useTheme } from "@/hooks/use-theme";

const STYLE_ORDER: OverlayStyleKey[] = ["classic", "minimal", "film"];
const STYLE_OPTIONS = STYLE_ORDER.map((key) => ({
  key,
  label: OVERLAY_STYLES[key].label,
}));

/**
 * 開ける選択肢。それぞれ独立に開閉する。
 *
 * 選択肢の並びは丸ボタン(34pt)より低く、開いても行の高さは変わらない。
 * 折り返す場合も列が下へ伸びるだけで、隣の行に重なることはない。
 * 文字サイズは写真の下のバーで、そもそも別の場所に出る。
 * 干渉しない以上、一つずつしか開けない理由がない。
 */
type MenuKey = "ratio" | "position" | "style" | "textSize";

/**
 * 縦に並ぶ丸ボタンの一つ。押すと選択肢をボタンの左に開く。
 *
 * 以前は押すたびに次の候補へ送る方式だった。候補が三つ四つあると目当ての
 * ものに行き着くまで何度も押すことになり、しかも「今どれが選ばれていて、
 * 他に何があるのか」はボタンを押し続けて一周させないと分からなかった。
 * 開いて一覧から選ぶ形なら、選択肢の全体と現在地が一目で並ぶ。
 *
 * 左へ開くのは、この列が画面の右端に張り付いているため。右には場所がない。
 */
function OptionGroup<T extends string>({
  icon,
  options,
  value,
  onSelect,
  open,
  onToggle,
  accent,
  onAccent,
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  options: { key: T; label: string }[];
  value: T;
  onSelect: (key: T) => void;
  open: boolean;
  onToggle: () => void;
  accent: string;
  onAccent: string;
  accessibilityLabel: string;
}) {
  const current = options.find((o) => o.key === value);
  return (
    <View style={styles.iconGroup}>
      {open ? (
        <View style={styles.optionRow}>
          {options.map((o) => {
            const selected = o.key === value;
            return (
              <Pressable
                key={o.key}
                onPress={() => onSelect(o.key)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[
                  styles.optionChip,
                  selected && { backgroundColor: accent },
                ]}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    selected && { color: onAccent, fontWeight: "700" },
                  ]}
                >
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Text style={styles.iconLabel} numberOfLines={1} ellipsizeMode="tail">
          {current?.label}
        </Text>
      )}
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: open }}
        style={[styles.iconBtn, open && styles.iconBtnOpen]}
      >
        <Ionicons name={icon} size={16} color="#fff" />
      </Pressable>
    </View>
  );
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
    thumbnailRef,
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
    useTeamColor,
    setUseTeamColor,
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
    savingMode,
    handleSave,
    handleShare,
  } = form;

  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  // それぞれ独立に開閉する。開いたものは、同じボタンをもう一度押すまで
  // 開いたままにする。選ぶたびに閉じると、隣の候補と見比べるのに
  // 毎回開き直すことになる。仕上がりを見ながら決める画面なので、
  // 開いたまま次々に試せる方が理にかなっている。
  const [openMenus, setOpenMenus] = useState<Partial<Record<MenuKey, boolean>>>(
    {},
  );
  const toggleMenu = (menu: MenuKey) =>
    setOpenMenus((cur) => ({ ...cur, [menu]: !cur[menu] }));
  const textSizeOpen = !!openMenus.textSize;
  const anyMenuOpen = Object.values(openMenus).some(Boolean);
  const closeMenus = () => setOpenMenus({});

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

  // フィルムシート用の切り出し。升目が正方形なので、正方形の窓に収めた
  // 状態で撮る。9:16などをそのまま保存すると、貼るときに中央で切られて
  // 隅のテロップが欠ける。窓からはみ出す分は、テロップと反対側へ逃がす。
  // (右下のテロップなら左と上を切る)
  const thumbAspect = resolveOverlayAspect(ratio, photoAspectRatio);
  const thumbCardWidth =
    thumbAspect >= 1 ? THUMBNAIL_WIDTH * thumbAspect : THUMBNAIL_WIDTH;
  const thumbCardHeight =
    thumbAspect >= 1 ? THUMBNAIL_WIDTH : THUMBNAIL_WIDTH / thumbAspect;
  const thumbLeft = position.endsWith("r")
    ? -(thumbCardWidth - THUMBNAIL_WIDTH)
    : 0;
  const thumbTop = position.startsWith("b")
    ? -(thumbCardHeight - THUMBNAIL_WIDTH)
    : 0;
  const thumbScaleFactor =
    renderWidth > 0 ? thumbCardWidth / renderWidth : 1;

  return (
    <View style={[styles.screen, { backgroundColor: "#000" }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        {/*
          戻る導線は「＜ 戻る」に統一する。✕ は「破棄する」とも読めて、
          編集内容が消えるのではと不安にさせるため。実際には記録画面へ
          戻るだけなので、矢印と言葉で行き先を示す。
          右側にあった空の View は、中央揃えのための余白のつもりが
          roundBtn の背景色を継いで「押せそうな丸」に見えていたので削除。
          タイトルは絶対配置にして中央を保つ。
        */}
        <View style={styles.topBar}>
          <Pressable onPress={goBack} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
            <Text style={styles.backLabel}>戻る</Text>
          </Pressable>
          <ThemedText type="small" style={styles.topTitle}>
            写真を調整
          </ThemedText>
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
                  dateIso={date}
                  stadium={stadiumName}
                  winHighlight={winHighlight}
                  useTeamColor={useTeamColor}
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
                  dateIso={date}
                  stadium={stadiumName}
                  winHighlight={winHighlight}
                  useTeamColor={useTeamColor}
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

              {/*
                フィルムシート用の非表示ステージ。
                正方形の窓に、テロップのある角を寄せたカードを収めている。
                撮る側はこれをそのまま正方形として撮ればよい。
              */}
              <View pointerEvents="none" style={styles.exportStage}>
                <View
                  ref={thumbnailRef}
                  collapsable={false}
                  style={styles.thumbnailWindow}
                >
                  <OverlayCard
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
                    dateIso={date}
                    stadium={stadiumName}
                    winHighlight={winHighlight}
                    useTeamColor={useTeamColor}
                    photoOffset={photoOffset}
                    photoScale={photoScale}
                    telopScale={telopScale}
                    scaleFactor={thumbScaleFactor}
                    style={{
                      position: "absolute",
                      left: thumbLeft,
                      top: thumbTop,
                      width: thumbCardWidth,
                      height: thumbCardHeight,
                      aspectRatio: undefined,
                    }}
                  />
                </View>
              </View>

              {/*
                選択肢が出ている間だけ敷く、透明な受け皿。
                写真の上のどこを押しても閉じられるようにする。
                アイコンの列と文字サイズのバーはこれより後ろに書いてあるので
                上に乗り、ボタン自身の操作は妨げない。
              */}
              {anyMenuOpen && (
                <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={closeMenus}
                  accessibilityRole="button"
                  accessibilityLabel="選択肢を閉じる"
                />
              )}

              <View style={styles.iconColumn}>
                <OptionGroup
                  icon="crop-outline"
                  accessibilityLabel="出力サイズを選ぶ"
                  options={OUTPUT_RATIOS}
                  value={ratio}
                  onSelect={setRatio}
                  open={!!openMenus.ratio}
                  onToggle={() => toggleMenu("ratio")}
                  accent={colors.accent}
                  onAccent={colors.onAccent}
                />

                <OptionGroup
                  icon="move-outline"
                  accessibilityLabel="テロップの場所を選ぶ"
                  options={POSITIONS}
                  value={position}
                  onSelect={setPosition}
                  open={!!openMenus.position}
                  onToggle={() => toggleMenu("position")}
                  accent={colors.accent}
                  onAccent={colors.onAccent}
                />

                <OptionGroup
                  icon="color-palette-outline"
                  accessibilityLabel="テロップの種類を選ぶ"
                  options={STYLE_OPTIONS}
                  value={styleKey}
                  onSelect={setStyleKey}
                  open={!!openMenus.style}
                  onToggle={() => toggleMenu("style")}
                  accent={colors.accent}
                  onAccent={colors.onAccent}
                />

                <View style={styles.iconGroup}>
                  <Text style={styles.iconLabel}>文字サイズ</Text>
                  <Pressable
                    onPress={() => toggleMenu("textSize")}
                    style={[
                      styles.iconBtn,
                      textSizeOpen && styles.iconBtnOpen,
                    ]}
                  >
                    <Ionicons name="text-outline" size={16} color="#fff" />
                  </Pressable>
                </View>

                {/*
                  フィルムは一列構成で勝敗ハイライトを効かせないため、この枠を
                  球団カラーの入切に差し替える。色を足さない状態を好む人も
                  いるので、フィルムでは色の有無の方が意味のある選択になる。
                */}
                {styleKey === "film" ? (
                  <View style={styles.iconGroup}>
                    <Text style={styles.iconLabel}>
                      {useTeamColor ? "球団カラー" : "デフォルト"}
                    </Text>
                    <Pressable
                      onPress={() => setUseTeamColor(!useTeamColor)}
                      accessibilityRole="button"
                      accessibilityLabel="テロップの色を切り替える"
                      style={styles.iconBtn}
                    >
                      <Ionicons
                        name={useTeamColor ? "color-palette" : "color-palette-outline"}
                        size={16}
                        color={useTeamColor ? colors.accent : "#fff"}
                      />
                    </Pressable>
                  </View>
                ) : (
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
                )}

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
              <ToggleSwitch
                value={alsoSaveToHistory}
                onValueChange={setAlsoSaveToHistory}
              />
            </View>

            {/*
              保存と共有は別ボタンにしている。
              1つにまとめると、共有したいだけの場合でも写真フォルダに
              必ず追加されてしまうため。
            */}
            <View style={styles.bottomBar}>
              <Pressable
                disabled={saving}
                onPress={handleSave}
                style={[
                  styles.saveShareBtn,
                  { backgroundColor: colors.accent, opacity: saving ? 0.6 : 1 },
                ]}
              >
                <Ionicons
                  name="download-outline"
                  size={19}
                  color={colors.onAccent}
                />
                <Text
                  style={[styles.saveShareBtnText, { color: colors.onAccent }]}
                >
                  {savingMode === "save" ? "処理中…" : "保存"}
                </Text>
              </Pressable>

              <Pressable
                disabled={saving}
                onPress={handleShare}
                style={[
                  styles.shareBtn,
                  { borderColor: colors.accent, opacity: saving ? 0.6 : 1 },
                ]}
              >
                <Ionicons
                  name="share-outline"
                  size={19}
                  color={colors.accent}
                />
                <Text style={[styles.saveShareBtnText, { color: colors.accent }]}>
                  {savingMode === "share" ? "処理中…" : "共有"}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>

      {saving && (
        <View style={styles.processingOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.processingText}>画像を作成しています…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  processingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  processingText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  safe: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    minHeight: 44,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    paddingVertical: 4,
    paddingRight: 12,
  },
  backLabel: { color: "#fff", fontSize: 15.5 },
  // タイトルは絶対配置で中央に置く。左の戻るボタンの幅に影響されず、
  // 右側にダミーの余白を置かずに済む。
  topTitle: {
    color: "#fff",
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    zIndex: -1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: Radius.surface,
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
  // captureRefでのキャプチャは行えるよう実配置する
  // (display: 'none'にすると計測・キャプチャ自体ができなくなるため使わない)。
  // 注意: Web版のcaptureRefはhtml2canvasベースで、ドキュメント座標を基準に
  // レンダリングするため、極端に離れた位置(例: left: -100000)に置くと
  // レイアウト崩れ(テロップの重なり)やキャプチャ範囲のズレ(余白)が発生する。
  // そのため位置はそのままにopacityで見た目だけ消す。
  exportStage: {
    position: "absolute",
    top: 0,
    left: 0,
    opacity: 0,
  },
  // フィルムシートの升目と同じ正方形の窓。はみ出した分は切り落とす。
  thumbnailWindow: {
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_WIDTH,
    overflow: "hidden",
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
    borderRadius: 17, // 円形。面の角丸(Radius)とは別の意味なのでトークン化しない
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnOpen: { backgroundColor: "rgba(255,255,255,0.28)" },
  // 選択肢はボタンの左へ開く。入り切らないときは折り返して上に伸ばす
  // (右端が起点なので、折り返しても右揃えのまま列が保たれる)。
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 5,
    maxWidth: 244,
  },
  optionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.surface,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  optionChipText: { color: "#fff", fontSize: 11.5 },
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
    borderRadius: Radius.surface,
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
  bottomBar: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  saveShareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: Radius.surface,
    paddingVertical: 15,
  },
  // 共有は副次的な操作なので、塗りつぶさず枠線のみにして
  // 保存ボタンとの主従を視覚的に分ける。高さは保存側と揃える。
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: Radius.surface,
    paddingVertical: 15,
    borderWidth: 1.5,
  },
  saveShareBtnText: { fontWeight: "700", fontSize: 15.5 },
});
