import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  wrap = false,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  wrap?: boolean;
}) {
  const colors = Colors.dark;

  return (
    <View style={[styles.row, wrap && styles.rowWrap]}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? colors.accent : colors.backgroundElement,
                borderColor: selected ? colors.accent : colors.border,
              },
            ]}>
            <Text style={[styles.chipText, { color: selected ? '#12100a' : colors.text }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  rowWrap: { flexWrap: 'wrap' },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
