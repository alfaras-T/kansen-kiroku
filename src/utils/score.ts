/**
 * スコア入力欄のサニタイズ。数字以外を除去し、桁数を上限までに切り詰める。
 * 「3a」のような値が Number() で NaN になり、勝敗判定やまとめ集計が
 * 壊れることを防ぐ。
 */
export function sanitizeScoreInput(text: string, maxDigits = 2): string {
  return text.replace(/[^0-9]/g, "").slice(0, maxDigits);
}
