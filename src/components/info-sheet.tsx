import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/use-theme";
import { Radius } from "@/constants/theme";
import { Type } from "@/constants/typography";

/**
 * 説明・ヘルプ用のボトムシート。SelectModal と同じ見た目に揃えている。
 * 表示状態は呼び出し側が制御する（visible / onClose）。
 */
export function InfoSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const colors = useTheme();
  // Modal内では SafeAreaView が0になるため context 経由で取る
  const insets = useSafeAreaInsets();

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
          <Text style={[styles.sheetTitle, { color: colors.text }]}>{title}</Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="閉じる"
          >
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
        >
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

/**
 * 手順のステップ。
 *
 * 以前は番号をアクセント色で塗った四角に入れていたが、塗りが強く、
 * 本文より番号の方が目立っていた。番号は道しるべであって主役ではない。
 * アプリ内で数字に使っている書体(Bebas Neue)をそのまま当て、色だけで
 * 示す。塗りが消えることで本文が読みやすくなる。
 */
export function InfoStep({ index, children }: { index: number; children: ReactNode }) {
  const colors = useTheme();
  return (
    <View style={styles.step}>
      <Text style={[styles.stepNo, { color: colors.accent }]}>
        {String(index).padStart(2, "0")}
      </Text>
      <Text style={[styles.stepText, { color: colors.text }]}>{children}</Text>
    </View>
  );
}

/**
 * 補足。手順の下に罫線で区切って置く。
 * 以前は「※」を文頭に付けていたが、記号に頼らなくても、区切りと色の差で
 * 「これは補足である」ことは伝わる。
 */
export function InfoNote({ children }: { children: ReactNode }) {
  const colors = useTheme();
  return (
    <View style={[styles.noteWrap, { borderTopColor: colors.border }]}>
      <Text style={[styles.note, { color: colors.textSecondary }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    maxHeight: "80%",
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
  body: { paddingHorizontal: 18 },
  bodyContent: { paddingVertical: 18, paddingBottom: 28 },
  // 手順どうしの間隔は、1行の行間(21)より広く取る。同じくらいだと
  // 手順の切れ目が段落の改行に見えて、どこまでが1手順か分からなくなる。
  step: { flexDirection: "row", alignItems: "flex-start", marginBottom: 22 },
  stepNo: { ...Type.display(17), width: 30, marginTop: 2 },
  stepText: { flex: 1, fontSize: 14, lineHeight: 22 },
  // 罫線の前後は同じ幅にする。上が4・下が14では、線が下の文章に
  // 寄って見えて、どちらに属する区切りなのか分からない。
  noteWrap: { borderTopWidth: 1, paddingTop: 18, marginTop: 18 },
  note: { fontSize: 12.5, lineHeight: 19 },
});
