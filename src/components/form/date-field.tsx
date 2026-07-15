import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISODate(isoStr: string): Date | null {
  if (!isoStr) return null;
  const d = new Date(`${isoStr}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateJP(isoStr: string): string {
  const d = parseISODate(isoStr);
  if (!d) return isoStr;
  const wd = WEEKDAY_LABELS[d.getDay()];
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${wd})`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function DateField({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const colors = Colors.dark;
  const today = startOfDay(new Date());
  const selectedDate = parseISODate(value);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState((selectedDate ?? today).getFullYear());
  const [viewMonth, setViewMonth] = useState((selectedDate ?? today).getMonth());

  function openCalendar() {
    const base = selectedDate ?? today;
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setOpen(true);
  }

  function shiftMonth(delta: number) {
    let y = viewYear;
    let m = viewMonth + delta;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewYear(y);
    setViewMonth(m);
  }

  const isCurrentOrFutureMonth = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth >= today.getMonth());

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <>
      <Pressable
        onPress={openCalendar}
        style={[styles.field, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
        <Text style={[styles.fieldText, { color: colors.text }]} numberOfLines={1}>
          {value ? formatDateJP(value) : '日付を選択'}
        </Text>
        <Ionicons name="calendar-outline" size={17} color={colors.textSecondary} />
      </Pressable>

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <SafeAreaView edges={['bottom']} style={styles.centerWrap} pointerEvents="box-none">
          <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>試合日を選択</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={12}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.monthRow}>
              <Pressable onPress={() => shiftMonth(-1)} hitSlop={10} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={18} color={colors.text} />
              </Pressable>
              <Text style={[styles.monthLabel, { color: colors.text }]}>
                {viewYear}年 {viewMonth + 1}月
              </Text>
              <Pressable
                onPress={() => !isCurrentOrFutureMonth && shiftMonth(1)}
                hitSlop={10}
                disabled={isCurrentOrFutureMonth}
                style={styles.navBtn}>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={isCurrentOrFutureMonth ? colors.border : colors.text}
                />
              </Pressable>
            </View>

            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((wd, i) => (
                <Text
                  key={wd}
                  style={[
                    styles.weekdayCell,
                    { color: i === 0 ? '#E0777D' : i === 6 ? '#6FA8DC' : colors.textSecondary },
                  ]}>
                  {wd}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((day, idx) => {
                if (day === null) return <View key={idx} style={styles.dayCell} />;
                const cellDate = new Date(viewYear, viewMonth, day);
                const isFuture = cellDate.getTime() > today.getTime();
                const isSelected =
                  !!selectedDate &&
                  selectedDate.getFullYear() === viewYear &&
                  selectedDate.getMonth() === viewMonth &&
                  selectedDate.getDate() === day;
                const isToday = cellDate.getTime() === today.getTime();
                return (
                  <Pressable
                    key={idx}
                    disabled={isFuture}
                    onPress={() => {
                      onChange(toISODate(cellDate));
                      setOpen(false);
                    }}
                    style={[
                      styles.dayCell,
                      isSelected && { backgroundColor: colors.accent, borderRadius: 8 },
                    ]}>
                    <Text
                      style={[
                        styles.dayText,
                        { color: isFuture ? colors.border : isSelected ? '#12100a' : colors.text },
                        isToday && !isSelected && { color: colors.accent, fontWeight: '700' },
                      ]}>
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => {
                onChange(toISODate(today));
                setOpen(false);
              }}
              style={[styles.todayBtn, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontSize: 13.5 }}>今日</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  fieldText: { fontSize: 14, flexShrink: 1, marginRight: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  centerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { fontSize: 15, fontWeight: '600' },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navBtn: { padding: 6 },
  monthLabel: { fontSize: 14.5, fontWeight: '600' },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekdayCell: { flex: 1, textAlign: 'center', fontSize: 12, paddingVertical: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { fontSize: 14 },
  todayBtn: {
    alignSelf: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
});
