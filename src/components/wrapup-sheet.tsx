import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { useEffect, useRef, useState } from "react";
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
  // 進行中キャプチャの使い回し(同じDOMを並行処理すると壊れるため。create-form.tsxと同じ)
  const captureInFlightRef = useRef<Promise<string | null> | null>(null);
  // Web用: 事前生成した書き出し画像(タップ時に即share/downloadするため)
  const preparedRef = useRef<{ key: string; uri: string } | null>(null);

  // 背景写真の読み込み状態。タイムアウトで推測せず、プレビューカードの
  // Image onLoad/onError を唯一の完了合図として確定的に管理する。
  // "loading" の間は共有ボタンを読み込み中表示にし、キャプチャも行わない。
  const [bgStatus, setBgStatus] = useState<"none" | "loading" | "ready">("none");
  const bgReadyRef = useRef(true);
  const bgWaitersRef = useRef<(() => void)[]>([]);

  function markBackgroundLoaded() {
    bgReadyRef.current = true;
    setBgStatus("ready");
    bgWaitersRef.current.forEach((resolve) => resolve());
    bgWaitersRef.current = [];
  }

  function waitForBackground(): Promise<void> {
    if (bgReadyRef.current) return Promise.resolve();
    return new Promise<void>((resolve) => {
      bgWaitersRef.current.push(resolve);
      // 完了合図が来ない場合の最終保険(15秒)。ここまで来たら読み込みは
      // 諦めて撮る(無限に固まるよりは写真なしでも書き出す)。
      setTimeout(resolve, 15000);
    });
  }

  // Web用: 書き出し画像の事前生成。
  // タップしてから変換すると (1) Safariの初回バグで写真が抜ける
  // (2) 変換に時間がかかりnavigator.shareのユーザー操作ウィンドウを外れる
  // ため、条件が揃った時点で裏で生成しておく(create-form.tsxと同じ方式)。
  useEffect(() => {
    if (Platform.OS !== "web" || !visible || !summary) return;
    if (backgroundUri && bgStatus !== "ready") return;
    const key = `${ratio}|${backgroundUri ?? ""}`;
    preparedRef.current = null; // 条件が変わったら旧画像は破棄
    const timer = setTimeout(async () => {
      const uri = await capture();
      if (uri) preparedRef.current = { key, uri };
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, summary, ratio, backgroundUri, bgStatus]);

  if (!summary) return null;

  function handleClose() {
    bgReadyRef.current = true;
    setBgStatus("none");
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
      setBgStatus("loading");
      setBackgroundUri(uri);
    } catch (e) {
      // launchImageLibraryAsync自体が例外を投げるケースを含め、ここで必ず拾う。
      // 拾わないと「タップしても何も起きない」ように見えてしまうため。
      console.warn("背景画像の選択に失敗しました", e);
      Alert.alert("背景画像を選べませんでした", "もう一度お試しください。");
    }
  }

  async function capture(): Promise<string | null> {
    if (captureInFlightRef.current) {
      return captureInFlightRef.current;
    }
    const promise = captureInner();
    captureInFlightRef.current = promise;
    try {
      return await promise;
    } finally {
      captureInFlightRef.current = null;
    }
  }

  async function captureInner(): Promise<string | null> {
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
        //
        // 重要: Safari(iOSのPWA含む)にはSVG foreignObject内の画像が
        // 「初回の変換では描画されない」既知のバグがあり、1回だけの変換だと
        // 背景写真が抜けた画像が出力される。複数回変換して最後の結果を使う
        // (2回目以降はSafari内部で画像がウォームアップ済みになり正しく写る)。
        const { toPng } = await import("html-to-image");
        let dataUrl = "";
        for (let i = 0; i < 3; i += 1) {
          dataUrl = await toPng(el, { pixelRatio: 1 });
        }
        return dataUrl;
      }

      // ネイティブ: 隠しステージではなく「画面に見えているプレビューカード」を
      // そのままキャプチャする。背景写真がある場合は、onLoad完了後さらに
      // ひと呼吸(300ms+1フレーム)おいて、描画が画面に反映しきってから撮る。
      if (backgroundUri) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      }
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
      // Webは事前生成済みの画像があればそれを使う(タップ直後に共有できる)
      const key = `${ratio}|${backgroundUri ?? ""}`;
      let uri: string | null = null;
      if (Platform.OS === "web" && preparedRef.current?.key === key) {
        uri = preparedRef.current.uri;
      }
      if (!uri) {
        uri = await capture();
      }
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
      // 権限を確認し、未許可のときだけダイアログを出す(毎回出さない)
      let perm = await MediaLibrary.getPermissionsAsync();
      let prompted = false;
      if (!perm.granted) {
        perm = await MediaLibrary.requestPermissionsAsync();
        prompted = true;
      }
      if (perm.granted) {
        await MediaLibrary.saveToLibraryAsync(uri);
      }
      // iOSでは、権限ダイアログが閉じるアニメーションの最中に共有シートを
      // 出そうとすると表示が静かに失敗する(初回タップで共有画面が開かない
      // 症状の原因)。ダイアログを出した直後は少し待ってから表示する。
      if (prompted) {
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
      try {
        if (await Sharing.isAvailableAsync()) {
          try {
            await Sharing.shareAsync(uri, {
              mimeType: "image/png",
              dialogTitle: "観戦まとめを共有",
            });
          } catch (firstError) {
            // 表示タイミングの競合で失敗した場合に備え、少し待って1回だけ再試行
            console.warn("共有シートの表示に失敗。再試行します", firstError);
            await new Promise((resolve) => setTimeout(resolve, 600));
            await Sharing.shareAsync(uri, {
              mimeType: "image/png",
              dialogTitle: "観戦まとめを共有",
            });
          }
        }
      } catch (e) {
        console.warn("共有シートの表示に失敗しました(保存は完了済み)", e);
        notify(
          "写真に保存しました",
          "共有画面を開けなかったため、保存のみ行いました。写真アプリから共有できます。",
        );
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
              name={
                bgStatus === "ready"
                  ? "checkmark-circle"
                  : bgStatus === "loading"
                    ? "hourglass-outline"
                    : "image-outline"
              }
              size={16}
              color={bgStatus === "ready" ? colors.accent : colors.text}
            />
            <Text
              style={[
                styles.bgBtnText,
                { color: bgStatus === "ready" ? colors.accent : colors.text },
              ]}
            >
              {bgStatus === "ready"
                ? "背景画像を設定しました(変更する)"
                : bgStatus === "loading"
                  ? "背景画像を読み込んでいます…"
                  : "背景画像を選ぶ"}
            </Text>
          </Pressable>
          {backgroundUri && (
            <Pressable
              onPress={() => {
                bgReadyRef.current = true;
                setBgStatus("none");
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
            disabled={busy || bgStatus === "loading"}
            style={[
              styles.shareBtn,
              {
                backgroundColor: colors.accent,
                opacity: busy || bgStatus === "loading" ? 0.6 : 1,
              },
            ]}
          >
            <Ionicons name="share-outline" size={18} color={colors.onAccent} />
            <Text style={[styles.shareBtnText, { color: colors.onAccent }]}>
              {busy
                ? "処理中…"
                : bgStatus === "loading"
                  ? "背景画像を読み込み中…"
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
