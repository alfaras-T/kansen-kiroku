import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

import {
  ProofRatio,
  ProofSheetCard,
  ProofSheetItem,
  proofCardHeight,
} from "@/components/proof-sheet-card";
import { useTheme } from "@/hooks/use-theme";
import { Radius } from "@/constants/theme";
import { resolveGameResult } from "@/storage/history";
import { loadThumbnailUriMap } from "@/storage/thumbnails";
import { HistoryEntry } from "@/types/history";
import { ToggleSwitch } from "@/components/form/toggle-switch";
import { notify } from "@/utils/dialogs";

/** 書き出し解像度(幅) */
const EXPORT_WIDTH = 1080;
/** プレビュー表示幅 */
const PREVIEW_WIDTH = 280;

/**
 * ベタ焼きシート。その年の観戦を1枚の画像に並べて書き出す。
 *
 * 年間まとめ(wrapup-sheet)と作りを揃えている。違うのは、背景写真を
 * 選ばせる代わりに、記録ごとのサムネイルを格子に並べる点。
 */
export function ProofSheet({
  visible,
  onClose,
  year,
  entries,
  record,
  myTeam,
}: {
  visible: boolean;
  onClose: () => void;
  year: string;
  entries: HistoryEntry[];
  record: { win: number; lose: number; draw: number } | null;
  myTeam: string;
}) {
  const colors = useTheme();
  // Modal は別のネイティブ root に描かれるため、その中の SafeAreaView は
  // 自分の位置を測れず inset が 0 になる(お問い合わせ画面が上に寄っていたのと
  // 同じ原因)。context 経由の useSafeAreaInsets なら Modal 内でも値が届く。
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [busyMode, setBusyMode] = useState<"save" | "share" | null>(null);
  const [items, setItems] = useState<ProofSheetItem[] | null>(null);
  const [ratio, setRatio] = useState<ProofRatio>("auto");
  // 写真のある試合だけを並べるか。既定は全試合。
  // 枚数そのものが「その年どれだけ通ったか」を語るため。
  //
  // 絞り込み中はフッターの勝敗内訳を出さない。並んでいるコマの数と
  // ○●△の合計が食い違い、どの試合を数えているのか分からなくなるため。
  const [photoOnly, setPhotoOnly] = useState(false);
  const exportRef = useRef<View>(null);

  // 書き出し用カードの画像デコード完了を数える。
  // 枚数が多いので、1枚ずつの onLoad を数え上げて全部揃うのを待つ。
  // 揃う前に撮ると、まだ描かれていないコマが空欄のまま写る。
  const loadedRef = useRef(0);
  const waitersRef = useRef<(() => void)[]>([]);

  // 表示・書き出しの対象。写真ありのみに絞ることもできる。
  const shown = items?.filter((i) => !photoOnly || i.uri) ?? null;
  const expectedLoads = shown?.filter((i) => i.uri).length ?? 0;

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    loadedRef.current = 0;
    waitersRef.current = [];
    setItems(null);
    (async () => {
      const map = await loadThumbnailUriMap(entries.map((e) => e.id));
      if (!alive) return;
      // 古い順に並べる。ベタ焼きは時系列で読むものなので。
      const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
      setItems(
        sorted.map((entry) => ({
          entry,
          uri: map[entry.id] ?? null,
          result: resolveGameResult(entry, myTeam),
        })),
      );
    })();
    return () => {
      alive = false;
    };
  }, [visible, entries, myTeam]);

  function handleCellLoad() {
    loadedRef.current += 1;
    if (loadedRef.current >= expectedLoads) {
      waitersRef.current.forEach((r) => r());
      waitersRef.current = [];
    }
  }

  function waitForCells(): Promise<void> {
    if (expectedLoads === 0 || loadedRef.current >= expectedLoads) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      waitersRef.current.push(resolve);
      // 画像が壊れているなどで onLoad も onError も来ない場合に
      // 永久に待たないための保険。多少欠けても書き出せた方がよい。
      setTimeout(resolve, 6000);
    });
  }

  async function runExport(mode: "save" | "share") {
    if (busy || !shown || shown.length === 0) return;
    setBusy(true);
    setBusyMode(mode);
    try {
      await waitForCells();
      await new Promise((resolve) =>
        requestAnimationFrame(() => resolve(null)),
      );

      let uri: string | null = null;
      if (Platform.OS === "web") {
        const { toPng } = await import("html-to-image");
        uri = await toPng(exportRef.current as unknown as HTMLElement, {
          pixelRatio: 1,
        });
      } else {
        uri = await captureRef(exportRef, {
          format: "png",
          quality: 1,
          result: "tmpfile",
        });
        // captureRefはfile://の付かない生パスを返すことがある
        if (uri && !uri.startsWith("file://") && !uri.startsWith("data:")) {
          uri = `file://${uri}`;
        }
      }
      if (!uri) {
        notify("画像の生成に失敗しました", "もう一度お試しください。");
        return;
      }

      if (Platform.OS === "web") {
        const a = document.createElement("a");
        a.download = `ball-films_${year}_film-sheet.png`;
        a.href = uri;
        a.click();
        if (mode === "save") {
          notify("保存しました", "端末のダウンロードフォルダに保存しました。");
        }
        return;
      }

      if (mode === "save") {
        // '/legacy' から読み込む理由は create-form.tsx のコメント参照
        const MediaLibrary = await import("expo-media-library/legacy");
        let perm = await MediaLibrary.getPermissionsAsync();
        if (!perm.granted) perm = await MediaLibrary.requestPermissionsAsync();
        if (!perm.granted) {
          notify("権限が必要です", "写真アプリへの保存を許可してください");
          return;
        }
        await MediaLibrary.saveToLibraryAsync(uri);
        notify("保存しました", "写真アプリに画像を保存しました。");
        return;
      }

      if (!(await Sharing.isAvailableAsync())) {
        notify("共有できません", "この端末では共有機能を利用できませんでした。");
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: `${year}年のフィルムシート`,
      });
    } catch (e) {
      const label = mode === "save" ? "保存" : "共有";
      console.warn(`フィルムシートの${label}に失敗しました`, e);
      notify(
        `${label}に失敗しました`,
        `時間をおいてもう一度お試しください。\n\n(詳細: ${String(
          (e as any)?.message ?? e,
        )})`,
      );
    } finally {
      setBusy(false);
      setBusyMode(null);
    }
  }

  if (!visible) return null;

  const withPhoto = items?.filter((i) => i.uri).length ?? 0;
  const exportHeight = proofCardHeight(shown?.length ?? 0, EXPORT_WIDTH, ratio);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.backgroundElement,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            {year}年のフィルムシート
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="閉じる"
          >
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {!items ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <>
              {/*
                比率の選択。枠付きのチップにすると保存・共有ボタンと同じ
                「押す箱」に見えるので、文字と短い縦線で示す。
              */}
              <View style={styles.ratioRow}>
                {(
                  [
                    { key: "auto", label: "枚数に合わせる" },
                    { key: "square", label: "スクエア 1:1" },
                    { key: "story", label: "ストーリー 9:16" },
                  ] as const
                ).map((o) => {
                  const on = ratio === o.key;
                  return (
                    <Pressable
                      key={o.key}
                      onPress={() => setRatio(o.key)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      style={styles.ratioChip}
                    >
                      <View
                        style={[
                          styles.ratioMark,
                          {
                            backgroundColor: on ? colors.accent : "transparent",
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.ratioText,
                          {
                            color: on ? colors.text : colors.textSecondary,
                            fontWeight: on ? "700" : "400",
                          },
                        ]}
                      >
                        {o.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.previewWrap}>
                <ProofSheetCard
                  year={year}
                  items={shown ?? []}
                  width={PREVIEW_WIDTH}
                  colors={colors}
                  record={photoOnly ? null : record}
                  ratio={ratio}
                />
              </View>

              {withPhoto < items.length && (
                <>
                  <View
                    style={[
                      styles.filterRow,
                      { borderTopColor: colors.border },
                    ]}
                  >
                    <Text
                      style={[styles.filterLabel, { color: colors.text }]}
                    >
                      写真がある試合だけ並べる
                    </Text>
                    <ToggleSwitch
                      value={photoOnly}
                      onValueChange={setPhotoOnly}
                      accessibilityLabel="写真がある試合だけ並べる"
                    />
                  </View>
                  <Text style={[styles.note, { color: colors.textSecondary }]}>
                    {photoOnly
                      ? `写真のない${items.length - withPhoto}件を外しています。`
                      : `${items.length - withPhoto}件は写真がないため、日付とスコアのコマになります。`}
                  </Text>
                </>
              )}

              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => runExport("save")}
                  disabled={busy}
                  style={[
                    styles.btn,
                    { backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 },
                  ]}
                >
                  <Ionicons
                    name="download-outline"
                    size={18}
                    color={colors.onAccent}
                  />
                  <Text style={[styles.btnText, { color: colors.onAccent }]}>
                    {busyMode === "save" ? "処理中…" : "保存"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => runExport("share")}
                  disabled={busy}
                  style={[
                    styles.btn,
                    styles.btnOutline,
                    { borderColor: colors.accent, opacity: busy ? 0.6 : 1 },
                  ]}
                >
                  <Ionicons
                    name="share-outline"
                    size={18}
                    color={colors.accent}
                  />
                  <Text style={[styles.btnText, { color: colors.accent }]}>
                    {busyMode === "share" ? "処理中…" : "共有"}
                  </Text>
                </Pressable>
              </View>

              <Text style={[styles.note, { color: colors.textSecondary }]}>
                画像はこの端末上で生成されます。サーバーへは送信されません。
              </Text>
            </>
          )}
        </ScrollView>

        {/*
          書き出し専用の隠しステージ。プレビュー(280px)を引き伸ばすと
          文字がぼやけるため、1080pxでレイアウトしたものを直接撮る。
          観戦カード・年間まとめと同じ方式。
        */}
        {items && (
          <View
            pointerEvents="none"
            style={[
              styles.exportStage,
              { width: EXPORT_WIDTH, height: exportHeight },
            ]}
          >
            <ProofSheetCard
              ref={exportRef}
              year={year}
              items={shown ?? []}
              width={EXPORT_WIDTH}
              colors={colors}
              record={photoOnly ? null : record}
              ratio={ratio}
              onCellLoad={handleCellLoad}
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    maxHeight: "88%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: 15, fontWeight: "600", flexShrink: 1, marginRight: 8 },
  body: { padding: 18, paddingBottom: 28 },
  loading: { paddingVertical: 40, alignItems: "center" },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderTopWidth: 1,
    paddingTop: 14,
    marginTop: 16,
  },
  filterLabel: { fontSize: 14, flexShrink: 1 },
  ratioRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 16,
    marginBottom: 16,
  },
  ratioChip: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  ratioMark: { width: 2, height: 13, marginRight: 7, borderRadius: 1 },
  ratioText: { fontSize: 13 },
  previewWrap: { alignItems: "center" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: Radius.surface,
    paddingVertical: 14,
  },
  btnOutline: { borderWidth: 1.5, backgroundColor: "transparent" },
  btnText: { fontSize: 15, fontWeight: "700" },
  note: { fontSize: 12, marginTop: 10, textAlign: "center", lineHeight: 17 },
  exportStage: { position: "absolute", top: 0, left: 0, opacity: 0 },
});
