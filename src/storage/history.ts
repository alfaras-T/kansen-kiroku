import AsyncStorage from '@react-native-async-storage/async-storage';

import { HistoryEntry } from '@/types/history';

// すべての記録はこの端末内(AsyncStorage)にのみ保存する。
// サーバー送信・アカウント連携は行わない。
const HISTORY_KEY = 'kansen-kiroku:history';
const MY_TEAM_KEY = 'kansen-kiroku:myTeam';
// 前回選んだ球場。入力の手間を減らすための補助情報でしかないため、
// バックアップ(backup.ts)の対象には含めていない。消えても記録自体は失われない。
const LAST_STADIUM_KEY = 'kansen-kiroku:lastStadium';

export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // 旧フィールド名（seatMemo）で保存された過去データとの互換性を保つ
    return parsed.map((e: HistoryEntry & { seatMemo?: string }) => ({
      ...e,
      memo: e.memo ?? e.seatMemo ?? '',
    }));
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

export async function updateHistoryEntry(entry: HistoryEntry): Promise<HistoryEntry[]> {
  const current = await loadHistory();
  const next = current.map((e) => (e.id === entry.id ? entry : e));
  await saveHistory(next);
  return next;
}

export async function deleteHistoryEntry(id: string): Promise<HistoryEntry[]> {
  const current = await loadHistory();
  const next = current.filter((e) => e.id !== id);
  await saveHistory(next);
  // ベタ焼き用のサムネイルも一緒に消す。残すと参照されないファイルが
  // 端末内に溜まり続けてしまう。
  const { deleteThumbnail } = await import('@/storage/thumbnails');
  await deleteThumbnail(id);
  const { deleteSourcePhoto } = await import('@/storage/source-photos');
  await deleteSourcePhoto(id);
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

/** 1試合の、マイチームから見た結果。出場していなければ null。 */
export type GameResult = 'win' | 'lose' | 'draw' | null;

/**
 * マイチームから見た1試合の勝敗を返す。computeRecord と同じ判定を
 * 1件ずつ取り出せるようにしたもの(フィルムシートのコマに印を付けるため)。
 */
export function resolveGameResult(
  entry: HistoryEntry,
  myTeam: string,
): GameResult {
  if (!myTeam) return null;
  if (entry.visitorCode !== myTeam && entry.homeCode !== myTeam) return null;
  const v = Number(entry.visitorScore);
  const h = Number(entry.homeScore);
  if (!Number.isFinite(v) || !Number.isFinite(h)) return null;
  if (v === h) return 'draw';
  const winnerCode = v > h ? entry.visitorCode : entry.homeCode;
  return winnerCode === myTeam ? 'win' : 'lose';
}

export function computeRecord(entries: HistoryEntry[], myTeam: string) {
  if (!myTeam) return null;
  let win = 0;
  let lose = 0;
  let draw = 0;
  let games = 0;
  entries.forEach((e) => {
    if (e.visitorCode !== myTeam && e.homeCode !== myTeam) return;
    games += 1;
    const v = Number(e.visitorScore);
    const h = Number(e.homeScore);
    if (v === h) {
      draw += 1;
      return;
    }
    const winnerCode = v > h ? e.visitorCode : e.homeCode;
    if (winnerCode === myTeam) win += 1;
    else lose += 1;
  });
  return { win, lose, draw, games };
}

/**
 * 試合日(YYYY-MM-DD)の新しい順に並べる。
 * 同じ日付の場合は、後から追加した記録を先に表示する。
 * 日付が空の記録は末尾へ回す。
 */
function compareByDateDesc(a: HistoryEntry, b: HistoryEntry): number {
  const da = a.date ?? '';
  const db = b.date ?? '';
  if (da !== db) {
    if (!da) return 1;
    if (!db) return -1;
    return db.localeCompare(da);
  }
  return b.createdAt - a.createdAt;
}

/** 観戦履歴を試合日(YYYY-MM-DD)の年ごとにグループ化し、年・試合日ともに新しい順に並べる */
export function groupHistoryByYear(entries: HistoryEntry[]): { year: string; entries: HistoryEntry[] }[] {
  const map = new Map<string, HistoryEntry[]>();
  entries.forEach((e) => {
    const year = e.date?.slice(0, 4) || '不明';
    const list = map.get(year) ?? [];
    list.push(e);
    map.set(year, list);
  });
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, list]) => ({
      year,
      entries: list.sort(compareByDateDesc),
    }));
}

export async function loadLastStadium(): Promise<string> {
  try {
    const raw = await AsyncStorage.getItem(LAST_STADIUM_KEY);
    return raw ?? '';
  } catch {
    return '';
  }
}

export async function saveLastStadium(stadium: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_STADIUM_KEY, stadium);
  } catch (e) {
    console.warn('前回の球場の保存に失敗しました', e);
  }
}
