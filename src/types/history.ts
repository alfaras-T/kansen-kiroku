export interface HistoryEntry {
  id: string;
  createdAt: number;
  date: string; // ISO date (YYYY-MM-DD)
  stadium: string;
  visitorCode: string;
  homeCode: string;
  visitorScore: string;
  homeScore: string;
  memo: string;
  /** 生成した画像（data URI）。写真なしの記録の場合は undefined。 */
  photo?: string;
}
