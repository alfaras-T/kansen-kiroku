import AsyncStorage from '@react-native-async-storage/async-storage';

import { HistoryEntry } from '@/types/history';

// すべての記録はこの端末内(AsyncStorage)にのみ保存する。
// サーバー送信・アカウント連携は行わない。
const HISTORY_KEY = 'kansen-kiroku:history';
const MY_TEAM_KEY = 'kansen-kiroku:myTeam';

export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('観戦記録の読み込みに失敗しました', e);
    return [];
  }
}

export async function saveHistory(entries: HistoryEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    console.warn('観戦記録の保存に失敗しました');
  }
}

export async function addHistoryEntry(entry: HistoryEntry): Promise<HistoryEntry[]> {
  const current = await loadHistory();
  const next = [...current, entry];
  await saveHistory(next);
  return next;
}

export async function deleteHistoryEntry(id: string): Promise<HistoryEntry[]> {
  const current = await loadHistory();
  const next = current.filter((e) => e.id !== id);
  await saveHistory(next);
  return next;
}

export async function loadMyTeam(): Promise<string> {
  try {
    const raw = await AsyncStorage.getItem(MY_TEAM_KEY);
    return raw ?? '';
  } catch {
    return '';
  }
}

export async function saveMyTeam(code: string): Promise<void> {
  try {
    await AsyncStorage.setItem(MY_TEAM_KEY, code);
  } catch (e) {
    console.warn('マイチームの保存に失敗しました', e);
  }
}

export function computeRecord(entries: HistoryEntry[], myTeam: string) {
  if (!myTeam) return null;
  let win = 0;
  let lose = 0;
  let draw = 0;
  entries.forEach((e) => {
    if (e.visitorCode !== myTeam && e.homeCode !== myTeam) return;
    if (e.isDraw) {
      draw += 1;
      return;
    }
    const v = Number(e.visitorScore);
    const h = Number(e.homeScore);
    if (v === h) return;
    const winnerCode = v > h ? e.visitorCode : e.homeCode;
    if (winnerCode === myTeam) win += 1;
    else lose += 1;
  });
  return { win, lose, draw };
}
