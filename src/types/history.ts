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
}
