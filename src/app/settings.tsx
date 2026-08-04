import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
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
import { ContactSheet } from "@/components/contact-sheet";
import {
  deleteAllThumbnails,
  loadThumbnailEnabled,
  saveThumbnailEnabled,
} from "@/storage/thumbnails";
import PrivacyScreen from "./privacy";
import SupportScreen from "./support";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WEB_BASE_URL } from "@/constants/contact";
import { TEAMS } from "@/constants/teams";
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from "@/constants/theme";
import { Rule, Space } from "@/constants/typography";
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
  const { favoriteTeam, setFavoriteTeam, reload } = useFavoriteTeam();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const [legalPage, setLegalPage] = useState<"privacy" | "support" | null>(null);
  // 閉じるアニメーションの最中も中身を描画し続けるために直前の値を覚えておく。
  // legalPage を null にした瞬間に children も消すと、スライドアウトしている
  // 間だけ空のモーダル（既定では白）が見えてしまうため。
  const lastLegalPage = useRef<"privacy" | "support">("privacy");
  if (legalPage) lastLegalPage.current = legalPage;

  // Web: Linking.openURLは既定でwindow.open(url, '_blank')を呼ぶため、
  // 中身が届くまで真っ白な新規タブが必ず一瞬表示されてしまう。
  // 同一タブでの通常遷移(window.location.href)にすることでこれを避ける。
  //
  // ネイティブ: 以前は同じURLを外部ブラウザで開いていたが、アプリから
  // Safariに飛ばされる体験になってしまうため、アプリ内のモーダルで表示する。
  // ここで router.push("/privacy") を使わないのは、この app が _layout.tsx の
  // RootGate による pathname 分岐で画面を出しており、Stack/Slot を持たないため。
  // クライアント側の遷移は当てにできないので、ルーティングを介さず
  // コンポーネントを直接モーダルに描画する。
  function openLegalPage(path: "/privacy" | "/support") {
    if (Platform.OS === "web") {
      window.location.href = `${WEB_BASE_URL}${path}`;
      return;
    }
    setLegalPage(path === "/privacy" ? "privacy" : "support");
  }
  const [backupHelpOpen, setBackupHelpOpen] = useState(false);

  // ベタ焼き用のサムネイル保存。既定は有効。
  const [thumbnailEnabled, setThumbnailEnabled] = useState(true);
  useEffect(() => {
    loadThumbnailEnabled().then(setThumbnailEnabled);
  }, []);

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
      <View style={styles.header}>
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
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.sectionLabel}
          >
            フィルムシート用の写真
          </ThemedText>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextArea}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>
                作った画像を残す
              </Text>
              <ThemedText type="small" themeColor="textSecondary">
                その年の観戦を一枚に並べる「フィルムシート」に使います。写真はこの端末の中だけに保存され、サーバーには送られません。
              </ThemedText>
            </View>
            <ToggleSwitch
              value={thumbnailEnabled}
              onValueChange={handleThumbnailToggle}
            />
          </View>
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
          <View style={styles.infoRow}>
            <ThemedText type="small" themeColor="textSecondary">
              バージョン
            </ThemedText>
            <ThemedText type="small">{appVersion}</ThemedText>
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

      {/* プライバシーポリシー / サポートをアプリ内で表示する（ネイティブのみ） */}
      <Modal
        visible={legalPage !== null}
        animationType="slide"
        onRequestClose={() => setLegalPage(null)}
      >
        {/* 背景色を明示しないと、閉じる途中でモーダル既定の白が透けて見える */}
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {lastLegalPage.current === "privacy" ? (
            <PrivacyScreen onClose={() => setLegalPage(null)} />
          ) : (
            <SupportScreen onClose={() => setLegalPage(null)} />
          )}
        </View>
      </Modal>
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
  },
  title: { fontSize: 22, fontWeight: "700", letterSpacing: 0.3 },
  // 節は上罫線で仕切る。5つの節を余白だけで並べると、どこで話題が
  // 変わったのか分からず、設定項目が一続きの塊に見える。
  section: {
    paddingHorizontal: Spacing.four,
    paddingTop: Space.row,
    paddingBottom: Space.section,
    borderTopWidth: Rule.hairline,
  },
  scrollContent: { paddingBottom: BottomTabInset + Spacing.six },
  // 節の見出し。補助色の小さな文字にして、中身より前に出ないようにする
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  toggleTextArea: { flex: 1, gap: 3 },
  toggleTitle: { fontSize: 14.5, fontWeight: "600" },
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
    borderRadius: Radius.surface,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonSpacing: { marginTop: 8 },
  buttonText: { fontSize: 14, fontWeight: "600" },
  // アプリ情報は操作ではなく参照。枠に入れず、素の行として置く。
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
