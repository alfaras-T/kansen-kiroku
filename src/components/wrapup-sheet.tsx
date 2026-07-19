import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
  WrapRatio,
  WrapUpCard,
  wrapCardHeight,
} from "@/components/wrapup-card";
import { useTheme } from "@/hooks/use-theme";
import { notify } from "@/utils/dialogs";
import { blobUrlToResizedDataUri } from "@/utils/image";
import { YearSummary } from "@/utils/yearSummary";

/** 書き出し解像度(幅)。ストーリーは1080x1920、スクエアは1080x1080になる。 */
const EXPORT_WIDTH = 1080;
/** プレビュー表示幅 */
const PREVIEW_WIDTH = 260;

export function WrapUpSheet({
  visible,
  onClose,
  summary,
  myTeam,
}: {
  visible: boolean;
  onClose: () => void;
  summary: YearSummary | null;
  myTeam: string;
}) {
  const colors = useTheme();
  const [ratio, setRatio] = useState<WrapRatio>("story");
  const [busy, setBusy] = useState(false);
  const [backgroundUri, setBackgroundUri] = useState<string | null>(null);
  const exportRef = useRef<View>(null);
  const previewRef = useRef<View>(null);

  // 背景写真のデコード完了を待つための仕組み。
  // 選んだ直後に共有をタップされても、書き出し用ステージの画像が
  // まだ読み込み終わっていないことがあるため(特に大きな写真)、
  // 読み込み完了まで待ってからキャプチャする。
  const bgReadyRef = useRef(true);
  const bgWaitersRef = useRef<(() => void)[]>([]);

  function markBackgroundLoaded() {
    bgReadyRef.current = true;
    bgWaitersRef.current.forEach((resolve) => resolve());
    bgWaitersRef.current = [];
  }

  function waitForBackground(): Promise<void> {
    if (bgReadyRef.current) return Promise.resolve();
    return new Promise<void>((resolve) => {
      bgWaitersRef.current.push(resolve);
      // 万一onLoad/onErrorが発火しない場合の保険(無限待機を防ぐ)
      setTimeout(resolve, 8000);
    });
  }

  if (!summary) return null;

  function handleClose() {
    setBackgroundUri(null);
    onClose();
  }

  async function pickBackground() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("権限が必要です", "写真ライブラリへのアクセスを許可してください");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 1,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      let uri = result.assets[0].uri;
      // Web版はblob: URLのままだとhtml-to-imageで書き出せないため、
      // data URIへ変換して保持する(create-form.tsxのpickPhotoと同じ理由)。
      if (Platform.OS === "web" && uri.startsWith("blob:")) {
        try {
          uri = await blobUrlToResizedDataUri(uri);
        } catch (e) {
          console.warn("背景画像のdata URI変換に失敗しました。blob URLのまま使用します", e);
        }
      }
      // 実際に画面へ表示する前にキャッシュへ読み込んでおく。onLoadだけに
      // 頼るより早く・確実に「読み込み済み」の状態を作れる。
      try {
        await Image.prefetch(uri);
      } catch (e) {
        console.warn("背景画像のprefetchに失敗しました(そのまま続行します)", e);
      }
      bgReadyRef.current = false;
      setBackgroundUri(uri);
    } catch (e) {
      // launchImageLibraryAsync自体が例外を投げるケースを含め、ここで必ず拾う。
      // 拾わないと「タップしても何も起きない」ように見えてしまうため。
      console.warn("背景画像の選択に失敗しました", e);
      Alert.alert("背景画像を選べませんでした", "もう一度お試しください。");
    }
  }

  async function capture(): Promise<string | null> {
    try {
      // Reactの再描画→描画反映を1フレーム待ってからキャプチャする。
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

      if (Platform.OS === "web") {
        // html-to-imageはDOMを見たまま直列化するだけで未デコードの画像を
        // 待たないため、書き出し用View内のすべての<img>のdecode()完了を待つ。
        const el = exportRef.current as unknown as HTMLElement;
        if (el?.querySelectorAll) {
          const imgs = Array.from(el.querySelectorAll("img"));
          await Promise.all(
            imgs.map((img) =>
              img.decode ? img.decode().catch(() => undefined) : Promise.resolve(),
            ),
          );
        }
        // Web版はhtml-to-image(ブラウザ自身の描画エンジン経由)を使う。
        // 理由はcreate-form.tsxのコメント参照(captureRefのWeb実装は再現度が低い)。
        const { toPng } = await import("html-to-image");
        return await toPng(el, { pixelRatio: 1 });
      }

      // ネイティブ: 隠しステージではなく「画面に見えているプレビューカード」を
      // そのままキャプチャする。プレビューには背景写真が確実に描画されている
      // (ユーザーに見えているものをそのまま撮るので、写真が抜け落ちる余地がない)。
      // width/height指定で書き出し解像度(1080x1920 / 1080x1080)へ拡大する。
      return await captureRef(previewRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
        width: EXPORT_WIDTH,
        height: wrapCardHeight(ratio, EXPORT_WIDTH),
      });
    } catch (e) {
      console.warn("まとめ画像の生成に失敗しました", e);
      return null;
    }
  }

  async function shareOnWeb(uri: string) {
    const filename = `ball-films_wrapup_${summary!.year}.png`;
    try {
      const blob = await (await fetch(uri)).blob();
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          return;
        } catch (e) {
          // ユーザーによるキャンセルは静かに終える
          if ((e as Error)?.name === "AbortError") return;
        }
      }
    } catch {
      // fall through to download
    }
    const link = document.createElement("a");
    link.download = filename;
    link.href = uri;
    link.click();
  }

  async function handleShare() {
    if (busy) return;
    setBusy(true);
    try {
      if (backgroundUri) await waitForBackground();
      const uri = await capture();
      if (!uri) {
        notify("画像の生成に失敗しました", "もう一度お試しください。");
        return;
      }
      if (Platform.OS === "web") {
        await shareOnWeb(uri);
        return;
      }
      // ネイティブ: 写真に保存してから共有シートを開く(既存の保存導線と同じ流れ)
      const MediaLibrary = await import("expo-media-library");
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (perm.granted) {
        await MediaLibrary.saveToLibraryAsync(uri);
      }
      try {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "image/png",
            dialogTitle: "観戦まとめを共有",
          });
        }
      } catch (e) {
        console.warn("共有シートの表示に失敗しました", e);
      }
      if (!perm.granted) {
        notify("写真への保存はスキップしました", "権限が無いため共有のみ行いました。");
      }
    } finally {
      setBusy(false);
    }
  }

  const exportHeight = wrapCardHeight(ratio, EXPORT_WIDTH);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <SafeAreaView
        edges={["bottom"]}
        style={[styles.sheet, { backgroundColor: colors.backgroundElement }]}
      >
        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            {summary.year}年の観戦まとめ
          </Text>
          <Pressable onPress={handleClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="閉じる">
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {/* サイズ切り替え */}
          <View style={styles.ratioRow}>
            {(
              [
                { key: "story", label: "ストーリー (9:16)" },
                { key: "square", label: "スクエア (1:1)" },
              ] as const
            ).map((o) => {
              const selected = ratio === o.key;
              return (
                <Pressable
                  key={o.key}
                  onPress={() => setRatio(o.key)}
                  style={[
                    styles.ratioChip,
                    {
                      borderColor: selected ? colors.accent : colors.border,
                      backgroundColor: selected ? colors.backgroundSelected : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: selected ? colors.accent : colors.text,
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    {o.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 背景画像 */}
          <Pressable
            onPress={pickBackground}
            style={[
              styles.bgBtn,
              {
                borderColor: backgroundUri ? colors.accent : colors.border,
                backgroundColor: colors.backgroundElement,
              },
            ]}
          >
            <Ionicons
              name={backgroundUri ? "checkmark-circle" : "image-outline"}
              size={16}
              color={backgroundUri ? colors.accent : colors.text}
            />
            <Text
              style={[
                styles.bgBtnText,
                { color: backgroundUri ? colors.accent : colors.text },
              ]}
            >
              {backgroundUri ? "背景画像を設定しました(変更する)" : "背景画像を選ぶ"}
            </Text>
          </Pressable>
          {backgroundUri && (
            <Pressable
              onPress={() => {
                bgReadyRef.current = true;
                setBackgroundUri(null);
              }}
              style={styles.bgClear}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>
                背景画像を外す
              </Text>
            </Pressable>
          )}

          {/* プレビュー */}
          <View style={{ alignItems: "center", marginTop: 14 }}>
            <WrapUpCard
              ref={previewRef}
              summary={summary}
              myTeam={myTeam}
              ratio={ratio}
              width={PREVIEW_WIDTH}
              colors={colors}
              backgroundUri={backgroundUri}
              onBackgroundLoad={markBackgroundLoaded}
            />
          </View>

          <Pressable
            onPress={handleShare}
            disabled={busy}
            style={[
              styles.shareBtn,
              { backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 },
            ]}
          >
            <Ionicons name="share-outline" size={18} color={colors.onAccent} />
            <Text style={[styles.shareBtnText, { color: colors.onAccent }]}>
              {busy
                ? "処理中…"
                : Platform.OS === "web"
                  ? "画像を共有・保存"
                  : "写真に保存して共有"}
            </Text>
          </Pressable>
          <Text style={[styles.note, { color: colors.textSecondary }]}>
            画像はこの端末上で生成されます。サーバーへは送信されません。
          </Text>
        </ScrollView>

        {/*
          書き出し専用ステージ(Web専用)。
          Webのhtml-to-imageはopacity:0のDOMも直接描画できるため、
          高解像度の隠しステージ方式が使える。
          ネイティブはこの方式だと写真が写らないため使わず、
          画面に見えているプレビューカードをwidth/height指定で
          拡大キャプチャする(capture()参照)。
        */}
        {Platform.OS === "web" && (
          <View
            pointerEvents="none"
            style={[
              styles.exportStage,
              { width: EXPORT_WIDTH, height: exportHeight },
            ]}
          >
            <WrapUpCard
              ref={exportRef}
              summary={summary}
              myTeam={myTeam}
              ratio={ratio}
              width={EXPORT_WIDTH}
              colors={colors}
              backgroundUri={backgroundUri}
            />
          </View>
        )}

        {/* 保存/共有中の表示。観戦記録作成時(adjust.tsx)と同じ見た目に揃えている */}
        {busy && (
          <View style={styles.processingOverlay} pointerEvents="auto">
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.processingText}>画像を作成しています…</Text>
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
  ratioRow: { flexDirection: "row", gap: 8 },
  ratioChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  bgBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 10,
  },
  bgBtnText: { fontSize: 13, fontWeight: "600" },
  bgClear: { alignItems: "center", marginTop: 6 },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 18,
  },
  shareBtnText: { fontSize: 15, fontWeight: "700" },
  note: { fontSize: 12, marginTop: 10, textAlign: "center" },
  exportStage: { position: "absolute", top: 0, left: 0, opacity: 0 },
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
});
