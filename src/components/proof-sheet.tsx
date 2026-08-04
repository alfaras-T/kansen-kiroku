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
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

import {
  ProofSheetCard,
  ProofSheetItem,
  proofCardHeight,
} from "@/components/proof-sheet-card";
import { useTheme } from "@/hooks/use-theme";
import { Radius } from "@/constants/theme";
import { resolveGameResult } from "@/storage/history";
import { loadThumbnailUriMap } from "@/storage/thumbnails";
import { HistoryEntry } from "@/types/history";
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
  const [busy, setBusy] = useState(false);
  const [busyMode, setBusyMode] = useState<"save" | "share" | null>(null);
  const [items, setItems] = useState<ProofSheetItem[] | null>(null);
  const exportRef = useRef<View>(null);

  // 書き出し用カードの画像デコード完了を数える。
  // 枚数が多いので、1枚ずつの onLoad を数え上げて全部揃うのを待つ。
  // 揃う前に撮ると、まだ描かれていないコマが空欄のまま写る。
  const loadedRef = useRef(0);
  const waitersRef = useRef<(() => void)[]>([]);

  const expectedLoads = items?.filter((i) => i.uri).length ?? 0;

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
    if (busy || !items || items.length === 0) return;
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
  const exportHeight = proofCardHeight(items?.length ?? 0, EXPORT_WIDTH);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <SafeAreaView
        edges={["bottom"]}
        style={[styles.sheet, { backgroundColor: colors.backgroundElement }]}
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
              <View style={styles.previewWrap}>
                <ProofSheetCard
                  year={year}
                  items={items}
                  width={PREVIEW_WIDTH}
                  colors={colors}
                  record={record}
                />
              </View>

              {withPhoto < items.length && (
                <Text style={[styles.note, { color: colors.textSecondary }]}>
                  {items.length - withPhoto}件は写真がないため、日付とスコアのコマになっています。
                  設定で「作った画像を残す」を有効にすると、これから作る分の写真が並びます。
                </Text>
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
              items={items}
              width={EXPORT_WIDTH}
              colors={colors}
              record={record}
              onCellLoad={handleCellLoad}
            />
          </View>
        )}
      </SafeAreaView>
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
