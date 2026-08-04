import { StyleSheet, Text, View } from 'react-native';

import { Space } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

/**
 * 入力行。ラベルを左、入力を右に置いた「表」として読ませる。
 *
 * ラベルを値の上に積むと、どの項目も同じ高さの塊になり、ただ縦に並べた
 * だけのフォームになる。左右に振れば、目はラベルの列を縦に、値の列を
 * 縦に別々に追える。カメラのデータバックや、伝票の読み方に近い。
 *
 * ただし入力欄が横に広いと右に寄せきれないので、幅を必要とするもの
 * (メモなど)は stacked を指定して従来どおり縦に積む。
 */
export function LabeledField({
  label,
  children,
  last = false,
  stacked = false,
}: {
  label: string;
  children: React.ReactNode;
  /** 節の最後の行。罫線を引かない */
  last?: boolean;
  /** ラベルの下に入力を置く。横幅の要る入力に使う */
  stacked?: boolean;
}) {
  const colors = useTheme();
  return (
    <View
      style={[
        styles.wrap,
        stacked ? styles.stacked : styles.row,
        !last && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: colors.textSecondary },
          stacked && styles.labelStacked,
        ]}
      >
        {label}
      </Text>
      <View style={stacked ? undefined : styles.value}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: Space.row, paddingBottom: Space.row },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stacked: {},
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 0.8,
    flexShrink: 0,
  },
  labelStacked: { marginBottom: Space.tight },
  // 値は右側の残り幅すべてを使う。ラベルの長さが揃わなくても列は揃う。
  value: { flex: 1 },
});
