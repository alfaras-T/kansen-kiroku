import { StyleSheet, Text, View } from 'react-native';

import { Space, Type } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

/**
 * 入力行。
 *
 * 以前は各行を余白だけで隔てていたため、どの項目も同じ重さに見え、
 * ただ縦に積んだだけのフォームになっていた。行の下に細い罫線を引いて
 * 「表」として読ませる。面(カード)で囲うより境界がはっきりし、かつ軽い。
 *
 * ラベルは日本語なので、字間と太さで小さく締める。英字書体は日本語の
 * グリフを持たないため、ここでは使えない。
 */
export function LabeledField({
  label,
  children,
  last = false,
}: {
  label: string;
  children: React.ReactNode;
  /** 節の最後の行。罫線を引かない */
  last?: boolean;
}) {
  const colors = useTheme();
  return (
    <View
      style={[
        styles.wrap,
        !last && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: Space.row, paddingBottom: Space.row },
  label: {
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: Space.tight,
  },
});
