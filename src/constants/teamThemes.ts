import { TeamCode } from "@/constants/teams";
import { DEFAULT_PALETTE, Palette } from "@/constants/theme";

/**
 * 12球団の公式カラー（メイン / セカンド）。
 *
 * ロゴ・企業名は使わない方針のままだが、色そのものは球団から公表されている
 * 値をそのまま使う。ここが唯一の出典となるよう、UI配色もテロップも
 * すべてこのテーブルから導出する。
 */
export interface TeamBrandColors {
  nickname: string;
  mainName: string;
  main: string;
  secondName: string;
  second: string;
}

export const TEAM_BRAND_COLORS: Record<TeamCode, TeamBrandColors> = {
  T: {
    nickname: 'タイガース',
    mainName: 'タイガースイエロー',
    main: '#FFE200',
    secondName: 'ブラック',
    second: '#000000',
  },
  DB: {
    nickname: 'ベイスターズ',
    mainName: '横浜ブルー',
    main: '#00468B',
    secondName: '横浜ブルー(淡)',
    second: '#009BE3',
  },
  G: {
    nickname: 'ジャイアンツ',
    mainName: 'ジャイアンツオレンジ',
    main: '#F36E21',
    secondName: 'ブラック',
    second: '#000000',
  },
  D: {
    nickname: 'ドラゴンズ',
    mainName: 'ドラゴンズブルー',
    main: '#002D62',
    secondName: 'ホワイト',
    second: '#FFFFFF',
  },
  C: {
    nickname: 'カープ',
    mainName: 'カープフェニックスレッド',
    main: '#C41230',
    secondName: 'ホワイト',
    second: '#FFFFFF',
  },
  S: {
    nickname: 'スワローズ',
    mainName: 'スワローズグリーン',
    main: '#001C41',
    secondName: 'スワローズ黄緑',
    second: '#83C35C',
  },
  H: {
    nickname: 'ホークス',
    mainName: 'レモンイエロー',
    main: '#FFF100',
    secondName: 'ホワイト',
    second: '#FFFFFF',
  },
  F: {
    nickname: 'ファイターズ',
    mainName: 'ファイターズブルー',
    main: '#00549E',
    secondName: 'ゴールド',
    second: '#EAE0A4',
  },
  B: {
    nickname: 'バファローズ',
    mainName: 'バファローズネイビー',
    main: '#00143F',
    secondName: 'ゴールド',
    second: '#B19452',
  },
  E: {
    nickname: 'ゴールデンイーグルス',
    mainName: 'クリムゾンレッド',
    main: '#860018',
    secondName: 'ゴールド',
    second: '#E2C481',
  },
  L: {
    nickname: 'ライオンズ',
    mainName: 'レジェンドブルー',
    main: '#03224C',
    secondName: 'ホワイト',
    second: '#FFFFFF',
  },
  M: {
    nickname: 'マリーンズ',
    mainName: 'マリーンズブラック',
    main: '#000000',
    secondName: 'マリーンズホワイト',
    second: '#FFFFFF',
  },
};

/**
 * 球団ごとのUIパレット。
 *
 * タイガースとライオンズのみ、TEAM_BRAND_COLORS の公式カラーから導出した
 * 配色を使う。残る10球団は、公式カラーをそのまま画面全体に敷くと視認性が
 * 落ちたため、以前の独自調整カラーに戻している。
 * (テロップの色は全球団とも公式カラーを使う。面で使う配色と、写真の上に
 *  細く載せる色とでは、成立する条件が違うため揃える必要はない)
 */
export const TEAM_THEMES: Record<TeamCode, Palette> = {
  // タイガース: 公式カラー / 土台=セカンド(#000000) / 差し色=メイン(#FFE200)
  T: {
    text: '#F0F0F0',
    background: '#000000',
    backgroundElement: '#171717',
    backgroundSelected: '#2E2E2E',
    textSecondary: '#8B8B8B',
    accent: '#FFE200',
    accentDim: '#736600',
    onAccent: '#0A0A0A',
    border: '#FFE200',
    danger: '#FF6B6B',
  },
  // ライオンズ: 公式カラー / 土台=メイン(#03224C) / 差し色=セカンド(#FFFFFF)
  L: {
    text: '#F0F2F4',
    background: '#03224C',
    backgroundElement: '#1A365C',
    backgroundSelected: '#304A6C',
    textSecondary: '#8C9BAD',
    accent: '#FFFFFF',
    accentDim: '#74859D',
    onAccent: '#0A0A0A',
    border: '#FFFFFF',
    danger: '#FF6B6B',
  },
  // ジャイアンツ: 黒ベース + オレンジアクセント
  G: {
    text: "#F5F2EC",
    background: "#0C0C0E",
    backgroundElement: "#1C1C20",
    backgroundSelected: "#2E2E34",
    textSecondary: "#A3A3A8",
    accent: "#FF7A14",
    accentDim: "#B35410",
    onAccent: "#1F0D02",
    border: "#FF7A14",
    danger: "#FF7A6E",
  },
  // カープ: 赤ベース + 白アクセント
  C: {
    text: "#FFF0F1",
    background: "#330309",
    backgroundElement: "#7E0A1B",
    backgroundSelected: "#AC1226",
    textSecondary: "#D69CA4",
    accent: "#FFF2F2",
    accentDim: "#C09098",
    onAccent: "#3A0A10",
    border: "#FFF2F2",
    danger: "#FFB0A6",
  },
  // ドラゴンズ: 青ベース + 白アクセント
  D: {
    text: "#EFF4FF",
    background: "#04102E",
    backgroundElement: "#0B255E",
    backgroundSelected: "#143A89",
    textSecondary: "#97A8CC",
    accent: "#F2F6FF",
    accentDim: "#8FA3C4",
    onAccent: "#0A1B3A",
    border: "#F2F6FF",
    danger: "#FF8A80",
  },
  // ベイスターズ: 青ベース + ゴールドアクセント
  DB: {
    text: "#EFF6FC",
    background: "#031B40",
    backgroundElement: "#0A3F82",
    backgroundSelected: "#0F5DBB",
    textSecondary: "#93BCE4",
    accent: "#F5C542",
    accentDim: "#A8842E",
    onAccent: "#1A1204",
    border: "#F5C542",
    danger: "#FF8A80",
  },
  // スワローズ: 紺ベース + 緑アクセント
  S: {
    text: "#EFF4FA",
    background: "#051124",
    backgroundElement: "#0C284B",
    backgroundSelected: "#153E6E",
    textSecondary: "#97A9C4",
    accent: "#35D687",
    accentDim: "#1F8A55",
    onAccent: "#04170D",
    border: "#35D687",
    danger: "#FF8A80",
  },
  // ホークス: 黒ベース + 黄色アクセント
  H: {
    text: "#F7F4E4",
    background: "#0B0B08",
    backgroundElement: "#1D1D16",
    backgroundSelected: "#31311F",
    textSecondary: "#A6A48F",
    accent: "#FFE83D",
    accentDim: "#ABA020",
    onAccent: "#1D1B03",
    border: "#FFE83D",
    danger: "#FF7A6E",
  },
  // バファローズ: 紺ベース + ゴールドアクセント
  B: {
    text: "#EFF0FA",
    background: "#050B26",
    backgroundElement: "#0E1B52",
    backgroundSelected: "#172A78",
    textSecondary: "#9AA0C9",
    accent: "#F0C25E",
    accentDim: "#A8842E",
    onAccent: "#1A1204",
    border: "#F0C25E",
    danger: "#FF8A80",
  },
  // ファイターズ: 水色ベース + 白アクセント
  F: {
    text: "#EFF8FC",
    background: "#041B26",
    backgroundElement: "#0A3C52",
    backgroundSelected: "#125877",
    textSecondary: "#90BCCC",
    accent: "#F3FBFF",
    accentDim: "#9CC4D4",
    onAccent: "#0A2530",
    border: "#F3FBFF",
    danger: "#FF8A80",
  },
  // マリーンズ: 黒ベース + 白アクセント
  M: {
    text: "#F4F5F7",
    background: "#0B0C0E",
    backgroundElement: "#26282C",
    backgroundSelected: "#3F434A",
    textSecondary: "#A9ACB2",
    accent: "#F2F3F5",
    accentDim: "#85888E",
    onAccent: "#0A0B0C",
    border: "#F2F3F5",
    danger: "#FF8A80",
  },
  // ゴールデンイーグルス: エンジベース + ゴールドアクセント
  E: {
    text: "#FCEFF2",
    background: "#240610",
    backgroundElement: "#4F1122",
    backgroundSelected: "#721E33",
    textSecondary: "#C795A2",
    accent: "#E9BA2E",
    accentDim: "#A5821E",
    onAccent: "#191002",
    border: "#E9BA2E",
    danger: "#FFB0A6",
  },
};

/**
 * お気に入りチームのコードから実際に使うパレットを解決する。
 * 未選択(「特になし」)の場合は既定のパレットを返す。
 */
export function resolveTheme(favoriteTeam: string): Palette {
  return TEAM_THEMES[favoriteTeam as TeamCode] ?? DEFAULT_PALETTE;
}

/**
 * テロップの日付・区切り線に使う球団カラーを返す。未選択や該当なしは null。
 *
 * 明るさによる振り替えはせず、公式のメインカラーをそのまま使う。
 * 濃紺や黒のメインカラーは写真の上で沈みやすいが、球団の色として
 * 正しいことを優先する。
 */
export function resolveTelopTeamColor(favoriteTeam: string): string | null {
  const brand = TEAM_BRAND_COLORS[favoriteTeam as TeamCode];
  return brand ? brand.main : null;
}
