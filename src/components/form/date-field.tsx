import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { Colors } from '@/constants/theme';

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateJP(isoStr: string): string {
  if (!isoStr) return '';
  const d = new Date(`${isoStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoStr;
  const wd = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${wd})`;
}

export function DateField({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const colors = Colors.dark;
  const dateValue = value ? new Date(`${value}T00:00:00`) : new Date();

  if (Platform.OS === 'web') {
    return (
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.webInput,
          { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
        ]}
      />
    );
  }

  if (Platform.OS === 'android') {
    return (
      <Pressable
        onPress={() =>
          DateTimePickerAndroid.open({
            value: dateValue,
            mode: 'date',
            maximumDate: new Date(),
            onChange: (_event, selected) => {
              if (selected) onChange(toISODate(selected));
            },
          })
        }
        style={[styles.field, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
        <Text style={{ color: colors.text, fontSize: 14 }}>{formatDateJP(value)}</Text>
      </Pressable>
    );
  }

  // iOS / others: compact inline picker
  return (
    <DateTimePicker
      value={dateValue}
      mode="date"
      display="compact"
      maximumDate={new Date()}
      onChange={(_event, selected) => {
        if (selected) onChange(toISODate(selected));
      }}
      style={styles.iosPicker}
      accentColor={colors.accent}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  webInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  iosPicker: {
    alignSelf: 'flex-start',
  },
});
