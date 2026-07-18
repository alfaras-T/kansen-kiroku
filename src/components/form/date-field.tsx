import { Ionicons } from "@expo/vector-icons";
import { useMemo, useRef, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

// 年選択グリッドの下限。NPB発足年(1936年)まで遡れれば十分実用的。
const MIN_SELECTABLE_YEAR = 1936;
const YEAR_GRID_COLUMNS = 4;
const YEAR_CELL_HEIGHT = 46;

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
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
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} (${wd})`;
}

const WEEKDAY_LABELS_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/** 画像テロップ用の日付表記（例: 2026.07.15 WED）。英語曜日の大文字で写真映えを優先する。 */
export function formatDateOverlay(isoStr: string): string {
  const d = parseISODate(isoStr);
  if (!d) return isoStr;
  const wd = WEEKDAY_LABELS_EN[d.getDay()];
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${wd}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function DateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (iso: string) => void;
}) {
  const colors = useTheme();
  const today = startOfDay(new Date());
  const selectedDate = parseISODate(value);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"calendar" | "year">("calendar");
  const [viewYear, setViewYear] = useState(
    (selectedDate ?? today).getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    (selectedDate ?? today).getMonth(),
  );
  const yearListRef = useRef<FlatList<number>>(null);

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = today.getFullYear(); y >= MIN_SELECTABLE_YEAR; y--) list.push(y);
    return list;
  }, [today]);

  function openCalendar() {
    const base = selectedDate ?? today;
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setMode("calendar");
    setOpen(true);
  }

  function openYearPicker() {
    setMode("year");
    const index = years.indexOf(viewYear);
    if (index >= 0) {
      // 一覧を開いた時点で選択中の年が見える位置までスクロールしておく
      requestAnimationFrame(() => {
        yearListRef.current?.scrollToIndex({
          index,
          viewPosition: 0.4,
          animated: false,
        });
      });
    }
  }

  function selectYear(y: number) {
    // 選んだ年で表示中の月が未来になってしまう場合は、選べる最新の月まで戻す
    if (y === today.getFullYear() && viewMonth > today.getMonth()) {
      setViewMonth(today.getMonth());
    }
    setViewYear(y);
    setMode("calendar");
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

  const isCurrentOrFutureMonth =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth >= today.getMonth());

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
          {value ? formatDateJP(value) : "日付を選択"}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={17}
          color={colors.textSecondary}
        />
      </Pressable>

      <Modal
        visible={open}
        animationType="fade"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <SafeAreaView
          edges={["bottom"]}
          style={styles.centerWrap}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                試合日を選択
              </Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={12}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.monthRow}>
              <Pressable
                onPress={() => shiftMonth(-1)}
                hitSlop={10}
                style={styles.navBtn}
              >
                <Ionicons name="chevron-back" size={18} color={colors.text} />
              </Pressable>
              <Pressable
                onPress={openYearPicker}
                hitSlop={8}
                style={styles.monthLabelBtn}
              >
                <Text style={[styles.monthLabel, { color: colors.text }]}>
                  {viewYear}年 {viewMonth + 1}月
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color={colors.textSecondary}
                />
              </Pressable>
              <Pressable
                onPress={() => !isCurrentOrFutureMonth && shiftMonth(1)}
                hitSlop={10}
                disabled={isCurrentOrFutureMonth}
                style={styles.navBtn}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={isCurrentOrFutureMonth ? colors.border : colors.text}
                />
              </Pressable>
            </View>

            {mode === "year" ? (
              <FlatList
                ref={yearListRef}
                data={years}
                keyExtractor={(y) => String(y)}
                numColumns={YEAR_GRID_COLUMNS}
                style={styles.yearList}
                getItemLayout={(_, index) => ({
                  length: YEAR_CELL_HEIGHT,
                  offset: YEAR_CELL_HEIGHT * Math.floor(index / YEAR_GRID_COLUMNS),
                  index,
                })}
                onScrollToIndexFailed={({ index }) => {
                  requestAnimationFrame(() => {
                    yearListRef.current?.scrollToIndex({ index, animated: false });
                  });
                }}
                renderItem={({ item: y }) => {
                  const isSelectedYear = y === viewYear;
                  return (
                    <Pressable
                      onPress={() => selectYear(y)}
                      style={[
                        styles.yearCell,
                        isSelectedYear && {
                          backgroundColor: colors.accent,
                          borderRadius: 8,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.yearText,
                          {
                            color: isSelectedYear ? colors.onAccent : colors.text,
                          },
                        ]}
                      >
                        {y}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            ) : (
              <>
                <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((wd, i) => (
                <Text
                  key={wd}
                  style={[
                    styles.weekdayCell,
                    {
                      color:
                        i === 0
                          ? "#E0777D"
                          : i === 6
                            ? "#6FA8DC"
                            : colors.textSecondary,
                    },
                  ]}
                >
                  {wd}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((day, idx) => {
                if (day === null)
                  return <View key={idx} style={styles.dayCell} />;
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
                      isSelected && {
                        backgroundColor: colors.accent,
                        borderRadius: 8,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        {
                          color: isFuture
                            ? colors.border
                            : isSelected
                              ? colors.onAccent
                              : colors.text,
                        },
                        isToday &&
                          !isSelected && {
                            color: colors.accent,
                            fontWeight: "700",
                          },
                      ]}
                    >
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
              style={[styles.todayBtn, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.text, fontSize: 13.5 }}>今日</Text>
            </Pressable>
              </>
            )}
          </View>
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
  centerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { fontSize: 15, fontWeight: "600" },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  navBtn: { padding: 6 },
  monthLabelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  monthLabel: { fontSize: 14.5, fontWeight: "600" },
  yearList: { maxHeight: 46 * 5 },
  yearCell: {
    width: `${100 / YEAR_GRID_COLUMNS}%`,
    height: YEAR_CELL_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  yearText: { fontSize: 15, fontWeight: "600" },
  weekdayRow: { flexDirection: "row", marginBottom: 4 },
  weekdayCell: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    paddingVertical: 6,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: { fontSize: 14 },
  todayBtn: {
    alignSelf: "center",
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
});
