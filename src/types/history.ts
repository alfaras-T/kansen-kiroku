import { TeamCode } from '@/constants/teams';

export interface HistoryEntry {
  id: string;
  createdAt: number;
  date: string; // ISO date (YYYY-MM-DD)
  stadium: string;
  visitorCode: TeamCode;
  homeCode: TeamCode;
  visitorScore: string;
  homeScore: string;
  isDraw: boolean;
  isExtra: boolean;
  extraInning: string;
  seatMemo: string;
}
