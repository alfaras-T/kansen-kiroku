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
}

export function SelectModal({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const colors = useTheme();
  const selectedOption = options.find((o) => o.value === value);
  const selectedLabel =
    (selectedOption?.compactLabel ?? selectedOption?.label) ??
    "選択してください";

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.field,
          {
            backgroundColor: colors.backgroundElement,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[styles.fieldText, { color: colors.text }]}
          numberOfLines={1}
        >
          {selectedLabel}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
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
                  <Text
                    style={[
                      styles.rowText,
                      { color: selected ? colors.accent : colors.text },
                    ]}
                  >
                    {item.label}
                  </Text>
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
  rowText: { fontSize: 14.5 },
});
