import Constants from "expo-constants";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { SelectModal } from "@/components/form/select-modal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TEAMS } from "@/constants/teams";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useFavoriteTeam } from "@/contexts/favorite-team";
import { exportBackup, importBackup } from "@/storage/backup";
import { confirmAsync, notify } from "@/utils/dialogs";
import { useTheme } from "@/hooks/use-theme";

const FAVORITE_TEAM_OPTIONS = [
  { label: "特になし", value: "" },
  ...TEAMS.map((t) => ({ label: `${t.nickname}（${t.code}）`, value: t.code })),
];

export default function SettingsScreen() {
  const colors = useTheme();
  const { favoriteTeam, setFavoriteTeam } = useFavoriteTeam();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

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
    <ThemedView style={styles.screen}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          設定
        </ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.sectionLabel}
          >
            お気に入りチーム（デザイン用）
          </ThemedText>
          <SelectModal
            title="お気に入りチームを選択"
            options={FAVORITE_TEAM_OPTIONS}
            value={favoriteTeam}
            onChange={setFavoriteTeam}
          />
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.hint}
          >
            選んだチームのイメージカラーに合わせて、アプリの配色が変わります。「特になし」を選ぶと既定のデザインになります。観戦履歴タブの「マイチーム」（成績集計用）とは別の設定です。
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.sectionLabel}
          >
            データのバックアップ
          </ThemedText>
          <Pressable
            onPress={handleExport}
            disabled={exporting}
            style={[
              styles.button,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
                opacity: exporting ? 0.6 : 1,
              },
            ]}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              {exporting ? "書き出し中…" : "観戦履歴を書き出す"}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleImport}
            disabled={importing}
            style={[
              styles.button,
              styles.buttonSpacing,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
                opacity: importing ? 0.6 : 1,
              },
            ]}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              {importing ? "読み込み中…" : "バックアップから読み込む"}
            </Text>
          </Pressable>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.hint}
          >
            観戦履歴・マイチーム・お気に入りチームをこの端末上でファイルに書き出せます。機種変更やアプリの再インストール前のバックアップ、他の端末への引き継ぎにお使いください。サーバーへは送信されません。
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.sectionLabel}
          >
            アプリについて
          </ThemedText>
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <ThemedText type="small" themeColor="textSecondary">
                バージョン
              </ThemedText>
              <ThemedText type="small">{appVersion}</ThemedText>
            </View>
          </View>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.hint}
          >
            観戦記録・写真・設定はすべてこの端末内にのみ保存され、サーバーには送信されません。球団のロゴ・正式名称は使用していません。
          </ThemedText>
        </View>
      </ScrollView>
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
  header: { padding: Spacing.four, paddingBottom: Spacing.three },
  title: { fontSize: 26, lineHeight: 32 },
  section: { paddingHorizontal: Spacing.four, marginBottom: Spacing.four },
  scrollContent: { paddingBottom: BottomTabInset + Spacing.six },
  sectionLabel: { marginBottom: 6 },
  hint: { marginTop: 10, lineHeight: 18 },
  button: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonSpacing: { marginTop: 8 },
  buttonText: { fontSize: 14, fontWeight: "600" },
  infoBox: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  infoRowLast: { borderBottomWidth: 0 },
});
