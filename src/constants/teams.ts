// 球団名(正式名称・企業名)は使わず、一般的な愛称と略称のみを扱う。
// ロゴ・ユニフォーム等のビジュアル商標もアプリ内では一切使用しない。

export type TeamCode = 'G' | 'T' | 'D' | 'C' | 'S' | 'DB' | 'L' | 'M' | 'B' | 'F' | 'H' | 'E';

export interface TeamOption {
  code: TeamCode;
  nickname: string;
  /**
   * 選択後のコンパクトな表示（選択欄の閉じた状態など、横幅に余裕がない箇所）用の短縮表記。
   * 省略時は nickname をそのまま使う。
   * 年間まとめカードなど、正式な表記が必要な箇所では使わず nickname を使うこと。
   */
  shortNickname?: string;
}

// 表示順は前年(2025年)のNPB最終順位に準拠(セ・リーグ1〜6位、続けてパ・リーグ1〜6位)。
// シーズン終了後は毎年この並びを更新する。
export const TEAMS: TeamOption[] = [
  { code: 'T', nickname: 'タイガース' }, // セ・リーグ 2025年 1位
  { code: 'DB', nickname: 'ベイスターズ' }, // セ・リーグ 2025年 2位
  { code: 'G', nickname: 'ジャイアンツ' }, // セ・リーグ 2025年 3位
  { code: 'D', nickname: 'ドラゴンズ' }, // セ・リーグ 2025年 4位
  { code: 'C', nickname: 'カープ' }, // セ・リーグ 2025年 5位
  { code: 'S', nickname: 'スワローズ' }, // セ・リーグ 2025年 6位
  { code: 'H', nickname: 'ホークス' }, // パ・リーグ 2025年 1位
  { code: 'F', nickname: 'ファイターズ' }, // パ・リーグ 2025年 2位
  { code: 'B', nickname: 'バファローズ' }, // パ・リーグ 2025年 3位
  { code: 'E', nickname: 'ゴールデンイーグルス', shortNickname: 'イーグルス' }, // パ・リーグ 2025年 4位
  { code: 'L', nickname: 'ライオンズ' }, // パ・リーグ 2025年 5位
  { code: 'M', nickname: 'マリーンズ' }, // パ・リーグ 2025年 6位
];

/** チーム一覧にない場合に選ぶ、自由入力用のセンチネル値 */
export const OTHER_TEAM = '__other__';

export function teamLabel(code: string): string {
  const t = TEAMS.find((x) => x.code === code);
  return t ? `${t.nickname}（${t.code}）` : code;
}

/** 選択欄の閉じた状態など、コンパクトな表示向けのラベル（短縮表記があればそちらを使う） */
export function teamCompactLabel(code: string): string {
  const t = TEAMS.find((x) => x.code === code);
  return t ? `${t.shortNickname ?? t.nickname}（${t.code}）` : code;
}
