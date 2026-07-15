// 球団名(正式名称・企業名)は使わず、一般的な愛称と略称のみを扱う。
// ロゴ・ユニフォーム等のビジュアル商標もアプリ内では一切使用しない。

export type TeamCode = 'G' | 'T' | 'D' | 'C' | 'S' | 'DB' | 'L' | 'M' | 'B' | 'F' | 'H' | 'E';

export interface TeamOption {
  code: TeamCode;
  nickname: string;
}

export const TEAMS: TeamOption[] = [
  { code: 'G', nickname: 'ジャイアンツ' },
  { code: 'T', nickname: 'タイガース' },
  { code: 'D', nickname: 'ドラゴンズ' },
  { code: 'C', nickname: 'カープ' },
  { code: 'S', nickname: 'スワローズ' },
  { code: 'DB', nickname: 'ベイスターズ' },
  { code: 'L', nickname: 'ライオンズ' },
  { code: 'M', nickname: 'マリーンズ' },
  { code: 'B', nickname: 'バファローズ' },
  { code: 'F', nickname: 'ファイターズ' },
  { code: 'H', nickname: 'ホークス' },
  { code: 'E', nickname: 'イーグルス' },
];

/** チーム一覧にない場合に選ぶ、自由入力用のセンチネル値 */
export const OTHER_TEAM = '__other__';

export function teamLabel(code: string): string {
  const t = TEAMS.find((x) => x.code === code);
  return t ? `${t.nickname}（${t.code}）` : code;
}
