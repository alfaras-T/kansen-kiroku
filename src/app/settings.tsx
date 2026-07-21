import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SelectModal } from "@/components/form/select-modal";
import { InfoNote, InfoSheet, InfoStep } from "@/components/info-sheet";
import { ContactSheet } from "@/components/contact-sheet";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WEB_BASE_URL } from "@/constants/contact";
import { TEAMS } from "@/constants/teams";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useFavoriteTeam } from "@/contexts/favorite-team";
import { exportBackup, importBackup } from "@/storage/backup";
import { confirmAsync, notify } from "@/utils/dialogs";
import { useTheme } from "@/hooks/use-theme";

const FAVORITE_TEAM_OPTIONS = [
  { label: "既定のデザイン", value: "" },
  ...TEAMS.map((t) => ({ label: `${t.nickname}（${t.code}）`, value: t.code })),
];

export default function SettingsScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { favoriteTeam, setFavoriteTeam } = useFavoriteTeam();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  // Web: Linking.openURLは既定でwindow.open(url, '_blank')を呼ぶため、
  // 中身が届くまで真っ白な新規タブが必ず一瞬表示されてしまう。
  // 同一タブでの通常遷移(window.location.href)にすることでこれを避ける。
  // ネイティブでは引き続き外部ブラウザで開く。
  function openLegalPage(path: "/privacy" | "/support") {
    if (Platform.OS === "web") {
      window.location.href = `${WEB_BASE_URL}${path}`;
    } else {
      Linking.openURL(`${WEB_BASE_URL}${path}`);
    }
  }
  const [backupHelpOpen, setBackupHelpOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

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
    <ThemedView style={[styles.screen, { paddingTop: insets.top }]}>
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
            選んだチームのイメージカラーに合わせて、アプリの配色が変わります。
          </ThemedText>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.sectionLabel}
            >
              データのバックアップ
            </ThemedText>
            <Pressable
              onPress={() => setBackupHelpOpen(true)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="バックアップの方法を見る"
              style={styles.helpButton}
            >
              <Ionicons
                name="help-circle-outline"
                size={18}
                color={colors.accent}
              />
              <Text style={[styles.helpButtonText, { color: colors.accent }]}>
                方法を見る
              </Text>
            </Pressable>
          </View>
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
            ご要望・お問い合わせ
          </ThemedText>
          <Pressable
            onPress={() => setContactOpen(true)}
            style={[
              styles.button,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              ご要望・お問い合わせフォーム
            </Text>
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            機能のご要望や不具合の報告をお送りいただけます。フォームから端末のメールアプリが開きます。いただいた内容は改善の参考にさせていただきます。
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
          <View style={styles.linkRow}>
            <Pressable onPress={() => openLegalPage("/privacy")} hitSlop={6}>
              <ThemedText type="link" themeColor="accent">
                プライバシーポリシー
              </ThemedText>
            </Pressable>
            <Pressable onPress={() => openLegalPage("/support")} hitSlop={6}>
              <ThemedText type="link" themeColor="accent">
                サポート
              </ThemedText>
            </Pressable>
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
          ※「バックアップから読み込む」を実行すると、いまこの端末にある記録は選んだファイルの内容で上書きされます。引き継ぎ前の端末で書き出したファイルを読み込んでください。
        </InfoNote>
        <InfoNote>
          ※ ファイルはあなたが選んだ保存先にのみ置かれます。アプリからサーバーへ送信されることはありません。バックアップを取らずにアプリを削除すると記録も消えるため、定期的な書き出しをおすすめします。
        </InfoNote>
      </InfoSheet>

      <ContactSheet visible={contactOpen} onClose={() => setContactOpen(false)} />
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
  linkRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 10,
    marginBottom: 2,
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 6,
  },
  helpButtonText: { fontSize: 13, fontWeight: "600" },
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
