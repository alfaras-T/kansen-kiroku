import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";

export interface SelectOption {
  label: string;
  value: string;
  /** 選択欄が閉じている状態でのみ使う短縮ラベル。省略時は label を使う。 */
  compactLabel?: string;
  /**
   * 一覧の先頭に並べ替えた項目に付ける小さな見出し（「マイチーム」「前回」など）。
   * 並び順が変わった理由が分からないと戸惑うため、理由を明示するために使う。
   */
  badge?: string;
}

export function SelectModal({
  title,
  options,
  value,
  onChange,
  variant = "field",
}: {
  title: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  /**
   * field  … 入力欄として枠の中に置く（記録・編集フォーム）
   * inline … 文字のまま並べる（履歴の絞り込みのような補助操作）
   *
   * 補助的な絞り込みまで入力欄と同じ枠で囲うと、画面の上部が同じ形の
   * 箱で埋まり、何が主役か分からなくなる。役割が違えば見た目も変える。
   */
  variant?: "field" | "inline";
}) {
  const [open, setOpen] = useState(false);
  const colors = useTheme();
  const selectedOption = options.find((o) => o.value === value);
  const hasSelection = !!selectedOption;
  const selectedLabel =
    (selectedOption?.compactLabel ?? selectedOption?.label) ??
    "選択してください";

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={
          variant === "inline"
            ? styles.inline
            : [
                styles.field,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                },
              ]
        }
      >
        <Text
          style={[
            variant === "inline" ? styles.inlineText : styles.fieldText,
            // 未選択のときは入力済みの値と同じ明るさで出さない。
            // 「選択してください」が選択済みの値に見えてしまうため。
            { color: hasSelection ? colors.text : colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {selectedLabel}
        </Text>
        <Ionicons
          name="chevron-down"
          size={variant === "inline" ? 13 : 16}
          color={colors.textSecondary}
        />
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <SafeAreaView
          edges={["bottom"]}
          style={[styles.sheet, { backgroundColor: colors.backgroundElement }]}
        >
          <View
            style={[styles.sheetHeader, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {title}
            </Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            style={styles.list}
            renderItem={({ item }) => {
              const selected = item.value === value;
              return (
                <Pressable
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  style={[styles.row, { borderBottomColor: colors.border }]}
                >
                  <View style={styles.rowMain}>
                    <Text
                      style={[
                        styles.rowText,
                        { color: selected ? colors.accent : colors.text },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {!!item.badge && (
                      <View
                        style={[
                          styles.badge,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.background,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {item.badge}
                        </Text>
                      </View>
                    )}
                  </View>
                  {selected && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={colors.accent}
                    />
                  )}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  fieldText: { fontSize: 14, flexShrink: 1, marginRight: 8 },
  inline: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  inlineText: {
    fontSize: 13.5,
    fontWeight: "600",
    marginRight: 4,
    flexShrink: 1,
  },
  rowMain: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: "700" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    maxHeight: "70%",
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
  sheetTitle: { fontSize: 15, fontWeight: "600" },
  list: { paddingHorizontal: 18 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowText: { fontSize: 14.5, flexShrink: 1 },
});
