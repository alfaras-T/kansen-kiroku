import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SelectModal } from "@/components/form/select-modal";
import { ToggleSwitch } from "@/components/form/toggle-switch";
import { InfoNote, InfoSheet, InfoStep } from "@/components/info-sheet";
import {
  deleteAllThumbnails,
  loadThumbnailEnabled,
  saveThumbnailEnabled,
} from "@/storage/thumbnails";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TEAMS } from "@/constants/teams";
import { MaxContentWidth, Spacing, Palette } from "@/constants/theme";
import { Rule, Space } from "@/constants/typography";
import { useFavoriteTeam } from "@/contexts/favorite-team";
import { exportBackup, importBackup } from "@/storage/backup";
import {
  SOURCE_KEEP_COUNT,
  deleteAllSourcePhotos,
  sourcePhotosTotalSize,
} from "@/storage/source-photos";
import { confirmAsync, notify } from "@/utils/dialogs";
import { useTheme } from "@/hooks/use-theme";

const FAVORITE_TEAM_OPTIONS = [
  { label: "既定のデザイン", value: "" },
  ...TEAMS.map((t) => ({ label: `${t.nickname}（${t.code}）`, value: t.code })),
];

/**
 * 操作の行。ラベルを左、行き先を示す矢印を右に置く。
 * 枠付きの中央揃えボタンを縦に並べると、どれも同じ重さの塊になるので、
 * 「押せる行」として組む。
 */
function ActionRow({
  label,
  onPress,
  colors,
  icon = "chevron-forward",
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  colors: Palette;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={[
        styles.row,
        { borderBottomColor: colors.border, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      <Ionicons name={icon} size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

export default function SettingsScreen() {
  const colors = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { favoriteTeam, setFavoriteTeam, reload } = useFavoriteTeam();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);


  const [backupHelpOpen, setBackupHelpOpen] = useState(false);

  // ベタ焼き用のサムネイル保存。既定は有効。
  const [thumbnailEnabled, setThumbnailEnabled] = useState(true);
  useEffect(() => {
    loadThumbnailEnabled().then(setThumbnailEnabled);
  }, []);

  // 作り直し用に残している元写真の量。写真そのものを端末に抱えている以上、
  // どれだけ持っているかを見せ、消す手段を用意しないと利用者は確かめようがない。
  const [sourceBytes, setSourceBytes] = useState<number | null>(null);
  useEffect(() => {
    if (Platform.OS === "web") return;
    sourcePhotosTotalSize().then(setSourceBytes);
  }, []);

  async function handleClearSourcePhotos() {
    const ok = await confirmAsync(
      "元写真を削除しますか？",
      "観戦記録とフィルムシートはそのまま残ります。ただし、この端末に残っていた記録の「作り直す」は使えなくなります。",
    );
    if (!ok) return;
    await deleteAllSourcePhotos();
    setSourceBytes(0);
    notify("元写真を削除しました");
  }

  async function handleThumbnailToggle(next: boolean) {
    if (!next) {
      const ok = await confirmAsync(
        "保存済みの写真を削除しますか？",
        "オフにすると、これまでに保存したサムネイルもすべて削除されます。フィルムシートに写真が並ばなくなります。観戦記録そのものは残ります。",
      );
      if (!ok) return;
      await deleteAllThumbnails();
    }
    setThumbnailEnabled(next);
    await saveThumbnailEnabled(next);
  }

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      await exportBackup();
    } catch (e) {
      console.warn("バックアップの書き出しに失敗しました", e);
      notify("書き出しに失敗しました", "もう一度お試しください。");
    } finally {
      setExporting(false);
    }
  }

  async function handleImport() {
    if (importing) return;
    const ok = await confirmAsync(
      "バックアップを読み込みますか？",
      "現在この端末に保存されている観戦履歴・チーム設定は、選んだファイルの内容で上書きされます。",
    );
    if (!ok) return;

    setImporting(true);
    try {
      const payload = await importBackup();
      if (payload) {
        // 復元はストレージを直接書き換えるため、Provider が持っている
        // お気に入りチーム/マイチームは古いままになる。読み直して
        // アプリの配色とテロップの球団カラーを復元後の値に合わせる。
        await reload();
        notify(
          "読み込みました",
          `${payload.history.length}件の観戦記録を復元しました。`,
        );
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "もう一度お試しください。";
      notify("読み込みに失敗しました", message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <ThemedView style={[styles.screen, { paddingTop: insets.top }]}>
      {/*
        設定はタブから外して各画面の歯車から開くようにしたため、
        自力で戻る導線が要る。調整画面と同じ「＜ 戻る」に揃える。
      */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="戻る"
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          <Text style={[styles.backLabel, { color: colors.text }]}>戻る</Text>
        </Pressable>
        <ThemedText type="title" style={styles.title}>
          設定
        </ThemedText>
      </View>

      {/* スクロールを見せない理由は index.tsx のコメント参照 */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        alwaysBounceVertical={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        {/*
          設定は「押す箱の集まり」ではなく「行の一覧」として組む。
          枠付きのボタンを縦に並べると、どれも同じ重さの塊になり、
          何がどの話題に属するのかが余白でしか分からない。
          ラベルを左、操作を右に置いた行にすれば、目はラベルの列を追える。
        */}
        <View style={styles.section}>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>
              お気に入りチーム
            </Text>
            <View style={styles.rowValue}>
              <SelectModal
                title="お気に入りチームを選択"
                options={FAVORITE_TEAM_OPTIONS}
                value={favoriteTeam}
                onChange={setFavoriteTeam}
                variant="inline"
              />
            </View>
          </View>
          <Text
            style={[styles.note, { color: colors.textSecondary }]}
          >
            選んだチームの色に、アプリの配色とテロップの日付が変わります。
          </Text>
        </View>

        <View style={styles.section}>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>
              作った画像を残す
            </Text>
            <ToggleSwitch
              value={thumbnailEnabled}
              onValueChange={handleThumbnailToggle}
              accessibilityLabel="作った画像を残す"
            />
          </View>
          <Text
            style={[styles.note, { color: colors.textSecondary }]}
          >
            その年の観戦を一枚に並べるのに使います。写真はこの端末の中だけに保存され、サーバーには送られません。
          </Text>
        </View>

        {Platform.OS !== "web" && (
          <View style={styles.section}>
            <ActionRow
              label={
                sourceBytes
                  ? `作り直し用の元写真を削除（${formatSize(sourceBytes)}）`
                  : "作り直し用の元写真はありません"
              }
              icon="trash-outline"
              onPress={handleClearSourcePhotos}
              disabled={!sourceBytes}
              colors={colors}
            />
            <Text style={[styles.note, { color: colors.textSecondary }]}>
              書き出したあとにスタイルやスコアを直せるよう、直近{SOURCE_KEEP_COUNT}件分の元写真をこの端末の中に残しています。写真アプリ側の写真は減りません。ここで消しても観戦記録とフィルムシートは残ります。
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.exportHead}>
            <Text style={[styles.exportLabel, { color: colors.textSecondary }]}>
              バックアップ
            </Text>
            <Pressable
              onPress={() => setBackupHelpOpen(true)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="バックアップの方法を見る"
              style={styles.helpBtn}
            >
              <Ionicons
                name="help-circle-outline"
                size={17}
                color={colors.accent}
              />
              <Text style={[styles.helpText, { color: colors.accent }]}>
                方法を見る
              </Text>
            </Pressable>
          </View>
          <ActionRow
            label={exporting ? "書き出し中…" : "観戦履歴を書き出す"}
            onPress={handleExport}
            disabled={exporting}
            colors={colors}
          />
          <ActionRow
            label={importing ? "読み込み中…" : "バックアップから読み込む"}
            onPress={handleImport}
            disabled={importing}
            colors={colors}
          />
          <Text
            style={[styles.note, { color: colors.textSecondary }]}
          >
            観戦履歴とチーム設定をファイルに保存します。機種変更や再インストールの前にお使いください。サーバーへは送信されません。
          </Text>
        </View>

        <View style={styles.section}>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>
              バージョン
            </Text>
            <Text style={[styles.version, { color: colors.textSecondary }]}>
              {appVersion}
            </Text>
          </View>
        </View>
      </ScrollView>

      <InfoSheet
        visible={backupHelpOpen}
        title="バックアップの方法"
        onClose={() => setBackupHelpOpen(false)}
      >
        <InfoStep index={1}>
          「観戦履歴を書き出す」を押すと、観戦記録・マイチーム・お気に入りチームをまとめたバックアップファイル（.json）が作られます。
        </InfoStep>
        <InfoStep index={2}>
          表示された共有メニューから、保存先を選びます。iCloud
          Drive・Googleドライブなどのクラウド、AirDrop、自分宛てのメールやメモアプリなど、どこでも構いません。
        </InfoStep>
        <InfoStep index={3}>
          機種変更やアプリの入れ直しをしたら、新しい端末でこのアプリを開き、「バックアップから読み込む」を押します。
        </InfoStep>
        <InfoStep index={4}>
          さきほど保存したファイルを選ぶと、観戦記録が復元されます。
        </InfoStep>
        <InfoNote>
          「バックアップから読み込む」を実行すると、いまこの端末にある記録は選んだファイルの内容で上書きされます。引き継ぎ前の端末で書き出したファイルを読み込んでください。
        </InfoNote>
        <InfoNote>
          ファイルはあなたが選んだ保存先にのみ置かれます。アプリからサーバーへ送信されることはありません。バックアップを取らずにアプリを削除すると記録も消えるため、定期的な書き出しをおすすめします。
        </InfoNote>
      </InfoSheet>


    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Space.row,
    gap: 10,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 1 },
  backLabel: { fontSize: 15.5 },
  title: { fontSize: 22, fontWeight: "700", letterSpacing: 0.3 },
  // 節は上罫線で仕切る。5つの節を余白だけで並べると、どこで話題が
  // 変わったのか分からず、設定項目が一続きの塊に見える。
  // 節の見出しは置かない。設定の項目名がそのまま内容を語るので、
  // その上にさらに分類名を重ねると同じことを二度言うことになる。
  // 切れ目は上罫線と、節の下に置く説明文が担う。
  // 節そのものは余白も罫線も持たない。区切りは行が自分の下罫線で作る。
  // 節ごとに上罫線と余白を持たせていたため、説明文の下余白と重なって
  // 罫線の前後に空白の帯ができていた。
  section: { paddingHorizontal: Spacing.four },
  // タブバーを隠して開くので、その分の余白は要らない
  scrollContent: { paddingBottom: Spacing.six },
  // 「方法を見る」は書き出しの上に添える。手順の説明は書き出しに付随する
  // ものなので、独立した操作として同じ列に並べると重さが釣り合わない。
  exportHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Space.row,
    paddingBottom: 4,
  },
  exportLabel: { fontSize: 11.5, fontWeight: "700", letterSpacing: 1.2 },
  helpBtn: { flexDirection: "row", alignItems: "center", gap: 3 },
  helpText: { fontSize: 12.5, fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    paddingVertical: Space.row,
    borderBottomWidth: 1,
  },
  rowLabel: { fontSize: 15, flexShrink: 1 },
  rowValue: { flexShrink: 0 },
  version: { fontSize: 14 },
  // 節の説明。行の下に一段落として置き、行そのものは短く保つ
  // 説明は直前の行に属する。罫線は行が持つので、ここには引かない。
  //
  // 上下の間隔は行の余白(Space.row)と同じにする。行の下罫線から説明までと、
  // 説明から次の行の罫線までが同じ幅になり、間隔が揃って見える。
  // 以前は上が0で、説明が罫線に貼り付いていた。
  note: {
    fontSize: 12,
    lineHeight: 18,
    paddingTop: Space.row,
    paddingBottom: Space.row,
  },
});
