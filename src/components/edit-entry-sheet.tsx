import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DateField } from "@/components/form/date-field";
import { LabeledField } from "@/components/form/labeled-field";
import { SelectModal } from "@/components/form/select-modal";
import { OTHER_STADIUM, STADIUMS } from "@/constants/stadiums";
import { OTHER_TEAM, TEAMS } from "@/constants/teams";
import { useTheme } from "@/hooks/use-theme";
import { HistoryEntry } from "@/types/history";
import { confirmAsync, notify } from "@/utils/dialogs";
import { sanitizeScoreInput } from "@/utils/score";

const TEAM_OPTIONS = [
  ...TEAMS.map((t) => ({ label: `${t.nickname}（${t.code}）`, value: t.code })),
  { label: "その他（自由入力）", value: OTHER_TEAM },
];
const STADIUM_OPTIONS = [
  ...STADIUMS.map((s) => ({ label: s, value: s })),
  { label: "その他（直接入力）", value: OTHER_STADIUM },
];

const TEAM_CODES = new Set<string>(TEAMS.map((t) => t.code));
const STADIUM_NAMES = new Set(STADIUMS);

export function EditEntrySheet({
  entry,
  onClose,
  onSave,
}: {
  /** 編集対象。nullなら非表示(Modal自体のvisibleもfalseにする) */
  entry: HistoryEntry | null;
  onClose: () => void;
  onSave: (entry: HistoryEntry) => Promise<void> | void;
}) {
  const colors = useTheme();

  const [date, setDate] = useState("");
  const [stadium, setStadium] = useState("");
  const [stadiumOther, setStadiumOther] = useState("");
  const [visitorCode, setVisitorCode] = useState("");
  const [visitorTeamOther, setVisitorTeamOther] = useState("");
  const [homeCode, setHomeCode] = useState("");
  const [homeTeamOther, setHomeTeamOther] = useState("");
  const [visitorScore, setVisitorScore] = useState("");
  const [homeScore, setHomeScore] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  // 編集対象が変わるたびにフォームへ反映する。
  // チーム/球場は、既存のリスト(TEAMS/STADIUMS)に一致すればそのまま選択、
  // 一致しなければ過去に「その他」で自由入力された値とみなして復元する。
  // 編集対象が切り替わるたびに、フォームの状態を新しいentryの内容へ同期する。
  /* eslint-disable react-hooks/set-state-in-effect --
     モーダルを開いたタイミングでフォームを初期化する用途であり、
     レンダー中に完結できないため意図的にuseEffect内で行っている */
  useEffect(() => {
    if (!entry) return;
    setDate(entry.date);
    setVisitorScore(entry.visitorScore);
    setHomeScore(entry.homeScore);
    setMemo(entry.memo);

    if (STADIUM_NAMES.has(entry.stadium)) {
      setStadium(entry.stadium);
      setStadiumOther("");
    } else {
      setStadium(OTHER_STADIUM);
      setStadiumOther(entry.stadium);
    }

    if (TEAM_CODES.has(entry.visitorCode)) {
      setVisitorCode(entry.visitorCode);
      setVisitorTeamOther("");
    } else {
      setVisitorCode(OTHER_TEAM);
      setVisitorTeamOther(entry.visitorCode);
    }

    if (TEAM_CODES.has(entry.homeCode)) {
      setHomeCode(entry.homeCode);
      setHomeTeamOther("");
    } else {
      setHomeCode(OTHER_TEAM);
      setHomeTeamOther(entry.homeCode);
    }
  }, [entry]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!entry) return null;
  const current = entry;

  const stadiumName = stadium === OTHER_STADIUM ? stadiumOther.trim() : stadium;
  const visitorTeamName =
    visitorCode === OTHER_TEAM ? visitorTeamOther.trim() : visitorCode;
  const homeTeamName = homeCode === OTHER_TEAM ? homeTeamOther.trim() : homeCode;

  async function handleSave() {
    if (saving) return;
    if (!date) {
      notify("試合日を入力してください");
      return;
    }
    if (!stadiumName) {
      notify("球場を入力してください");
      return;
    }
    if (!visitorTeamName || !homeTeamName) {
      notify("先攻・後攻のチームを入力してください");
      return;
    }
    if (visitorTeamName === homeTeamName) {
      const ok = await confirmAsync(
        "先攻と後攻が同じチームです",
        "このまま保存しますか？",
        "保存する",
      );
      if (!ok) return;
    }
    setSaving(true);
    try {
      await onSave({
        ...current,
        date,
        stadium: stadiumName,
        visitorCode: visitorTeamName,
        homeCode: homeTeamName,
        visitorScore: visitorScore || "0",
        homeScore: homeScore || "0",
        memo: memo.trim(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={!!entry} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <SafeAreaView
        edges={["bottom"]}
        style={[styles.sheet, { backgroundColor: colors.backgroundElement }]}
      >
        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>記録を編集</Text>
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
          keyboardShouldPersistTaps="handled"
        >
          <LabeledField label="試合日">
            <DateField value={date} onChange={setDate} />
          </LabeledField>

          <LabeledField label="先攻（ビジター）">
            <View style={styles.teamRow}>
              <View style={{ flex: 1 }}>
                <SelectModal
                  title="先攻チームを選択"
                  options={TEAM_OPTIONS}
                  value={visitorCode}
                  onChange={setVisitorCode}
                />
              </View>
              <TextInput
                value={visitorScore}
                onChangeText={(t) => setVisitorScore(sanitizeScoreInput(t))}
                keyboardType="number-pad"
                accessibilityLabel="先攻チームの得点"
                style={[
                  styles.scoreInput,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    color: colors.text,
                  },
                ]}
              />
            </View>
            {visitorCode === OTHER_TEAM && (
              <TextInput
                value={visitorTeamOther}
                onChangeText={setVisitorTeamOther}
                placeholder="チーム名を入力"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.textInput,
                  {
                    marginTop: 8,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    color: colors.text,
                  },
                ]}
              />
            )}
          </LabeledField>

          <LabeledField label="後攻（ホーム）">
            <View style={styles.teamRow}>
              <View style={{ flex: 1 }}>
                <SelectModal
                  title="後攻チームを選択"
                  options={TEAM_OPTIONS}
                  value={homeCode}
                  onChange={setHomeCode}
                />
              </View>
              <TextInput
                value={homeScore}
                onChangeText={(t) => setHomeScore(sanitizeScoreInput(t))}
                keyboardType="number-pad"
                accessibilityLabel="後攻チームの得点"
                style={[
                  styles.scoreInput,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    color: colors.text,
                  },
                ]}
              />
            </View>
            {homeCode === OTHER_TEAM && (
              <TextInput
                value={homeTeamOther}
                onChangeText={setHomeTeamOther}
                placeholder="チーム名を入力"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.textInput,
                  {
                    marginTop: 8,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    color: colors.text,
                  },
                ]}
              />
            )}
          </LabeledField>

          <LabeledField label="📍 球場">
            <SelectModal
              title="球場を選択"
              options={STADIUM_OPTIONS}
              value={stadium}
              onChange={setStadium}
            />
            {stadium === OTHER_STADIUM && (
              <TextInput
                value={stadiumOther}
                onChangeText={setStadiumOther}
                placeholder="球場名を入力"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.textInput,
                  {
                    marginTop: 8,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    color: colors.text,
                  },
                ]}
              />
            )}
          </LabeledField>

          <LabeledField label="自由メモ（任意）">
            <TextInput
              value={memo}
              onChangeText={setMemo}
              placeholder="例：3塁側内野、記念日など"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.textInput,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.text,
                },
              ]}
            />
          </LabeledField>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[
              styles.saveBtn,
              { backgroundColor: colors.accent, opacity: saving ? 0.6 : 1 },
            ]}
          >
            <Text style={[styles.saveBtnText, { color: colors.onAccent }]}>
              {saving ? "保存中…" : "保存する"}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    maxHeight: "90%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
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
  body: { paddingHorizontal: 18 },
  bodyContent: { paddingVertical: 18, paddingBottom: 28 },
  teamRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  scoreInput: {
    width: 64,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
    fontSize: 15,
    textAlign: "center",
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  saveBtn: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { fontSize: 15, fontWeight: "700" },
});
