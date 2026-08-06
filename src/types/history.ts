import { OverlayPosition } from '@/constants/overlayStyles';

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
  /**
   * テロップを置いた隅。フィルムシートで升目に貼るとき、この隅を残して切る。
   * この項目を持たない古い記録は、既定値の 'br' として扱う。
   */
  telopPosition?: OverlayPosition;
}
