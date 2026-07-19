import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { useRef, useState } from "react";
import {
  Alert,
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

  if (!summary) return null;

  function handleClose() {
    setBackgroundUri(null);
    onClose();
  }

  async function pickBackground() {
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
    setBackgroundUri(uri);
  }

  async function capture(): Promise<string | null> {
    try {
      if (Platform.OS === "web") {
        // Web版はhtml-to-image(ブラウザ自身の描画エンジン経由)を使う。
        // 理由はcreate-form.tsxのコメント参照(captureRefのWeb実装は再現度が低い)。
        const { toPng } = await import("html-to-image");
        return await toPng(exportRef.current as unknown as HTMLElement, {
          pixelRatio: 1,
        });
      }
      return await captureRef(exportRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
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
              { borderColor: colors.border, backgroundColor: colors.backgroundElement },
            ]}
          >
            <Ionicons
              name={backgroundUri ? "image" : "image-outline"}
              size={16}
              color={colors.text}
            />
            <Text style={[styles.bgBtnText, { color: colors.text }]}>
              {backgroundUri ? "背景画像を変更" : "背景画像を選ぶ"}
            </Text>
          </Pressable>
          {backgroundUri && (
            <Pressable onPress={() => setBackgroundUri(null)} style={styles.bgClear}>
              <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>
                背景画像を外す
              </Text>
            </Pressable>
          )}

          {/* プレビュー */}
          <View style={{ alignItems: "center", marginTop: 14 }}>
            <WrapUpCard
              summary={summary}
              myTeam={myTeam}
              ratio={ratio}
              width={PREVIEW_WIDTH}
              colors={colors}
              backgroundUri={backgroundUri}
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
                ? "画像を生成中…"
                : Platform.OS === "web"
                  ? "画像を共有・保存"
                  : "写真に保存して共有"}
            </Text>
          </Pressable>
          <Text style={[styles.note, { color: colors.textSecondary }]}>
            画像はこの端末上で生成されます。サーバーへは送信されません。
          </Text>
        </ScrollView>

        {/* 書き出し専用ステージ(opacityで見た目だけ消す。理由はadjust.tsx参照) */}
        <View
          pointerEvents="none"
          style={[styles.exportStage, { width: EXPORT_WIDTH, height: exportHeight }]}
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
});
