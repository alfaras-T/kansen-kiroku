import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ContactSheet } from "@/components/contact-sheet";
import { Radius } from "@/constants/theme";
import { Rule } from "@/constants/typography";
import { WEB_BASE_URL } from "@/constants/contact";
import { useTheme } from "@/hooks/use-theme";
import PrivacyScreen from "@/app/privacy";
import SupportScreen from "@/app/support";

/**
 * 右上のメニュー。記録・履歴の各画面に置く。
 *
 * 以前は歯車で設定へ直接飛ばしていたが、そこから先に規約・サポート・
 * 問い合わせがぶら下がっていて、設定と並列のはずのものが一段深くにあった。
 * 行き先を一枚で見せて、どれにも同じ距離で行けるようにする。
 */
export function AppMenu() {
  const router = useRouter();
  const colors = useTheme();
  // Modalは画面全体(ノッチ・ステータスバーを含む)を覆う。安全領域を足さないと
  // メニューがステータスバーの下に潜る。insetsはModalの外側で解決している。
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [legalPage, setLegalPage] = useState<"privacy" | "support" | null>(
    null,
  );
  // 閉じるアニメーション中も中身を描き続けるため、直前の値を覚えておく
  const lastLegalPage = useRef<"privacy" | "support">("privacy");
  if (legalPage) lastLegalPage.current = legalPage;

  /**
   * Web: Linking.openURL は既定で新規タブを開き、中身が届くまで真っ白な
   * タブが一瞬見える。同一タブでの通常遷移にする。
   * ネイティブ: 外部ブラウザへ飛ばさず、アプリ内のモーダルで表示する。
   */
  function openLegal(path: "/privacy" | "/support") {
    setOpen(false);
    if (Platform.OS === "web") {
      window.location.href = `${WEB_BASE_URL}${path}`;
      return;
    }
    setLegalPage(path === "/privacy" ? "privacy" : "support");
  }

  const items: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  }[] = [
    {
      label: "設定",
      icon: "settings-outline",
      onPress: () => {
        setOpen(false);
        router.push("/settings");
      },
    },
    {
      label: "プライバシーポリシー",
      icon: "shield-checkmark-outline",
      onPress: () => openLegal("/privacy"),
    },
    {
      label: "サポート",
      icon: "help-buoy-outline",
      onPress: () => openLegal("/support"),
    },
    {
      label: "お問い合わせ",
      icon: "mail-outline",
      onPress: () => {
        setOpen(false);
        setContactOpen(true);
      },
    },
  ];

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="メニューを開く"
        style={styles.trigger}
      >
        <Ionicons name="menu" size={22} color={colors.textSecondary} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        {/* 背景を押しても閉じられるようにする */}
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View
          style={[
            styles.sheet,
            {
              top: insets.top + 8,
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.head, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headTitle, { color: colors.text }]}>
              メニュー
            </Text>
            <Pressable
              onPress={() => setOpen(false)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="閉じる"
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {items.map((item, i) => (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              accessibilityRole="button"
              style={[
                styles.item,
                i < items.length - 1 && {
                  borderBottomWidth: Rule.hairline,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={colors.textSecondary}
              />
              <Text style={[styles.itemLabel, { color: colors.text }]}>
                {item.label}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSecondary}
              />
            </Pressable>
          ))}
        </View>
      </Modal>

      <Modal
        visible={contactOpen}
        animationType="slide"
        onRequestClose={() => setContactOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <ContactSheet onClose={() => setContactOpen(false)} />
        </View>
      </Modal>

      <Modal
        visible={legalPage !== null}
        animationType="slide"
        onRequestClose={() => setLegalPage(null)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {lastLegalPage.current === "privacy" ? (
            <PrivacyScreen onClose={() => setLegalPage(null)} />
          ) : (
            <SupportScreen onClose={() => setLegalPage(null)} />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { padding: 4 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  // 押した右上から下りてくる位置に置く
  sheet: {
    position: "absolute",
    right: 12,
    left: 60,
    borderWidth: 1,
    borderRadius: Radius.surface,
    overflow: "hidden",
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: Rule.hairline,
  },
  headTitle: { fontSize: 14.5, fontWeight: "700" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  itemLabel: { flex: 1, fontSize: 15 },
});
