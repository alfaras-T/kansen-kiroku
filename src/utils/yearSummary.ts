import { TEAMS } from "@/constants/teams";
import { HistoryEntry } from "@/types/history";

/** 年間観戦まとめの集計結果。すべて端末内の観戦履歴から計算する。 */
export interface YearSummary {
  year: string;
  /** その年の総観戦数 */
  games: number;
  /** マイチーム関与試合の成績(マイチーム未設定・関与0試合なら null) */
  record: { win: number; lose: number; draw: number; games: number } | null;
  /** 現地勝率(勝+負が0なら null)。0〜1。 */
  winRate: number | null;
  /** 一番通った球場 */
  topStadium: { name: string; count: number } | null;
  /** 初観戦・最終観戦の日付(ISO)。日付付き記録が無ければ null */
  firstDate: string | null;
  lastDate: string | null;
  /** マイチーム最大点差勝利の試合(無ければその年の最多合計得点試合) */
  bestGame: HistoryEntry | null;
  /** 1点差だった試合数 */
  oneRunGames: number;
  /** マイチームの現地最多連勝 */
  maxWinStreak: number;
  /** 最も多く対戦した相手とその成績(マイチーム設定時のみ) */
  topOpponent: { code: string; win: number; lose: number; draw: number; games: number } | null;
}

function toNum(s: string): number | null {
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** チームコードから表示用の愛称を引く(一覧に無ければコードをそのまま返す) */
export function nicknameOf(code: string): string {
  return TEAMS.find((t) => t.code === code)?.nickname ?? code;
}

/**
 * 指定年の観戦履歴を集計する。純粋関数。
 * @param entries 全観戦履歴
 * @param myTeam マイチームのコード(未設定は空文字)
 * @param year 対象年("2026" 形式)
 */
export function summarizeYear(
  entries: HistoryEntry[],
  myTeam: string,
  year: string,
): YearSummary {
  const inYear = entries.filter((e) => e.date?.slice(0, 4) === year);

  // 球場カウント
  const stadiumCount = new Map<string, number>();
  for (const e of inYear) {
    if (!e.stadium) continue;
    stadiumCount.set(e.stadium, (stadiumCount.get(e.stadium) ?? 0) + 1);
  }
  let topStadium: YearSummary["topStadium"] = null;
  for (const [name, count] of stadiumCount) {
    if (!topStadium || count > topStadium.count) topStadium = { name, count };
  }

  // 期間
  const dates = inYear.map((e) => e.date).filter(Boolean).sort();
  const firstDate = dates[0] ?? null;
  const lastDate = dates[dates.length - 1] ?? null;

  // 1点差試合
  let oneRunGames = 0;
  for (const e of inYear) {
    const v = toNum(e.visitorScore);
    const h = toNum(e.homeScore);
    if (v !== null && h !== null && Math.abs(v - h) === 1) oneRunGames += 1;
  }

  // マイチーム成績・連勝・ベストゲーム・対戦相手
  let record: YearSummary["record"] = null;
  let maxWinStreak = 0;
  let bestGame: HistoryEntry | null = null;
  let topOpponent: YearSummary["topOpponent"] = null;

  if (myTeam) {
    const myGames = inYear
      .filter((e) => e.visitorCode === myTeam || e.homeCode === myTeam)
      .sort((a, b) => (a.date === b.date ? a.createdAt - b.createdAt : a.date.localeCompare(b.date)));

    if (myGames.length > 0) {
      let win = 0;
      let lose = 0;
      let draw = 0;
      let streak = 0;
      let bestMargin = 0;
      const opp = new Map<string, { win: number; lose: number; draw: number; games: number }>();

      for (const e of myGames) {
        const v = toNum(e.visitorScore);
        const h = toNum(e.homeScore);
        if (v === null || h === null) continue;
        const isVisitor = e.visitorCode === myTeam;
        const my = isVisitor ? v : h;
        const their = isVisitor ? h : v;
        const oppCode = isVisitor ? e.homeCode : e.visitorCode;
        const o = opp.get(oppCode) ?? { win: 0, lose: 0, draw: 0, games: 0 };
        o.games += 1;

        if (my > their) {
          win += 1;
          o.win += 1;
          streak += 1;
          if (streak > maxWinStreak) maxWinStreak = streak;
          const margin = my - their;
          if (margin > bestMargin) {
            bestMargin = margin;
            bestGame = e;
          }
        } else if (my < their) {
          lose += 1;
          o.lose += 1;
          streak = 0;
        } else {
          draw += 1;
          o.draw += 1;
          streak = 0;
        }
        opp.set(oppCode, o);
      }

      record = { win, lose, draw, games: myGames.length };
      for (const [code, o] of opp) {
        if (!topOpponent || o.games > topOpponent.games) topOpponent = { code, ...o };
      }
    }
  }

  // マイチームのベストゲームが無ければ、その年の最多合計得点試合を採用
  if (!bestGame) {
    let bestTotal = -1;
    for (const e of inYear) {
      const v = toNum(e.visitorScore);
      const h = toNum(e.homeScore);
      if (v === null || h === null) continue;
      if (v + h > bestTotal) {
        bestTotal = v + h;
        bestGame = e;
      }
    }
  }

  const winRate =
    record && record.win + record.lose > 0
      ? record.win / (record.win + record.lose)
      : null;

  return {
    year,
    games: inYear.length,
    record,
    winRate,
    topStadium,
    firstDate,
    lastDate,
    bestGame,
    oneRunGames,
    maxWinStreak,
    topOpponent,
  };
}

/** "2026-03-29" → "3/29" */
export function formatShortDate(iso: string | null): string {
  if (!iso) return "";
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}
