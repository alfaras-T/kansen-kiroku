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
 * 球団ごとのUIパレット。TEAM_BRAND_COLORS から機械的に導出したもので、
 * 手で色を足していない。導出の規則は次のとおり。
 *
 * - 土台(background): メインとセカンドのうち暗い方。両方明るい球団
 *   (ホークスの黄+白)だけは中立の黒 #0A0A0A を土台にする
 * - 差し色(accent): もう一方の明るい色
 * - text / textSecondary / danger: 土台に対して WCAG AA(4.5:1)以上に
 *   なるまで白側へ寄せて決定
 * - onAccent: 差し色に対してコントラストが大きい方(黒か白)
 *
 * 全球団で contrast を実測済み。text は最低 5.68:1、textSecondary は
 * 最低 4.53:1、danger は最低 4.50:1。差し色は
 * ベイスターズのみ 3.02:1 で、これは WCAG のUI部品基準(3:1)は満たすが
 * 本文基準には届かない。文字色には使わず、枠線・選択状態の表現に留めること。
 */
export const TEAM_THEMES: Record<TeamCode, Palette> = {
  // タイガース: 土台=セカンド(#000000) / 差し色=メイン(#FFE200)
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
  // ベイスターズ: 土台=メイン(#00468B) / 差し色=セカンド(#009BE3)
  DB: {
    text: '#F7F7F8',
    background: '#00468B',
    backgroundElement: '#175795',
    backgroundSelected: '#2E67A0',
    textSecondary: '#A2BBD3',
    accent: '#009BE3',
    accentDim: '#006CB3',
    onAccent: '#0A0A0A',
    border: '#009BE3',
    danger: '#FF9999',
  },
  // ジャイアンツ: 土台=セカンド(#000000) / 差し色=メイン(#F36E21)
  G: {
    text: '#F0F0F0',
    background: '#000000',
    backgroundElement: '#171717',
    backgroundSelected: '#2E2E2E',
    textSecondary: '#8B8B8B',
    accent: '#F36E21',
    accentDim: '#6D310F',
    onAccent: '#0A0A0A',
    border: '#F36E21',
    danger: '#FF6B6B',
  },
  // ドラゴンズ: 土台=メイン(#002D62) / 差し色=セカンド(#FFFFFF)
  D: {
    text: '#F0F2F6',
    background: '#002D62',
    backgroundElement: '#174070',
    backgroundSelected: '#2E537E',
    textSecondary: '#8B9FB8',
    accent: '#FFFFFF',
    accentDim: '#738CA9',
    onAccent: '#0A0A0A',
    border: '#FFFFFF',
    danger: '#FF6B6B',
  },
  // カープ: 土台=メイン(#C41230) / 差し色=セカンド(#FFFFFF)
  C: {
    text: '#FBF7F7',
    background: '#C41230',
    backgroundElement: '#C92743',
    backgroundSelected: '#CF3D55',
    textSecondary: '#F6D9DD',
    accent: '#FFFFFF',
    accentDim: '#DF7D8D',
    onAccent: '#0A0A0A',
    border: '#FFFFFF',
    danger: '#FFD7D7',
  },
  // スワローズ: 土台=メイン(#001C41) / 差し色=セカンド(#83C35C)
  S: {
    text: '#F0F1F4',
    background: '#001C41',
    backgroundElement: '#173052',
    backgroundSelected: '#2E4563',
    textSecondary: '#8B98A9',
    accent: '#83C35C',
    accentDim: '#3B674D',
    onAccent: '#0A0A0A',
    border: '#83C35C',
    danger: '#FF6B6B',
  },
  // ホークス: 土台=中立色(#0A0A0A) / 差し色=メイン(#FFF100)
  H: {
    text: '#F0F0F0',
    background: '#0A0A0A',
    backgroundElement: '#202020',
    backgroundSelected: '#363636',
    textSecondary: '#8F8F8F',
    accent: '#FFF100',
    accentDim: '#787206',
    onAccent: '#0A0A0A',
    border: '#FFF100',
    danger: '#FF6B6B',
  },
  // ファイターズ: 土台=メイン(#00549E) / 差し色=セカンド(#EAE0A4)
  F: {
    text: '#F7F7F9',
    background: '#00549E',
    backgroundElement: '#1763A7',
    backgroundSelected: '#2E73AF',
    textSecondary: '#B2CBE0',
    accent: '#EAE0A4',
    accentDim: '#6993A1',
    onAccent: '#0A0A0A',
    border: '#EAE0A4',
    danger: '#FFB4B4',
  },
  // バファローズ: 土台=メイン(#00143F) / 差し色=セカンド(#B19452)
  B: {
    text: '#F0F1F3',
    background: '#00143F',
    backgroundElement: '#172950',
    backgroundSelected: '#2E3E62',
    textSecondary: '#8B94A7',
    accent: '#B19452',
    accentDim: '#504E48',
    onAccent: '#0A0A0A',
    border: '#B19452',
    danger: '#FF6B6B',
  },
  // ゴールデンイーグルス: 土台=メイン(#860018) / 差し色=セカンド(#E2C481)
  E: {
    text: '#F8F7F7',
    background: '#860018',
    backgroundElement: '#91172D',
    backgroundSelected: '#9C2E42',
    textSecondary: '#D1A2AA',
    accent: '#E2C481',
    accentDim: '#AF5847',
    onAccent: '#0A0A0A',
    border: '#E2C481',
    danger: '#FF8B8B',
  },
  // ライオンズ: 土台=メイン(#03224C) / 差し色=セカンド(#FFFFFF)
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
  // マリーンズ: 土台=メイン(#000000) / 差し色=セカンド(#FFFFFF)
  M: {
    text: '#F0F0F0',
    background: '#000000',
    backgroundElement: '#171717',
    backgroundSelected: '#2E2E2E',
    textSecondary: '#8B8B8B',
    accent: '#FFFFFF',
    accentDim: '#737373',
    onAccent: '#0A0A0A',
    border: '#FFFFFF',
    danger: '#FF6B6B',
  },
};

/**
 * お気に入りチームのコードから実際に使うパレットを解決する。
 * 未選択(「特になし」)の場合は既定のパレットを返す。
 */
export function resolveTheme(favoriteTeam: string): Palette {
  return TEAM_THEMES[favoriteTeam as TeamCode] ?? DEFAULT_PALETTE;
}

/** #RRGGBB から sRGB の相対輝度(0=黒, 1=白)を求める。WCAG の定義に沿う。 */
function relativeLuminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 1;
  const int = parseInt(m[1], 16);
  const channels = [(int >> 16) & 255, (int >> 8) & 255, int & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return (
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  );
}

// テロップは写真の上に暗いスクリム(おおよそ輝度0.005相当)を敷いた上に載る。
// そこでコントラスト比 3:1 ——WCAG が大きめの文字・図形に求める下限——を
// 確保できる輝度を閾値にする。(L + 0.05) / (0.005 + 0.05) >= 3 を解くと
// L >= 0.115 となる。
const MIN_TELOP_LUMINANCE = 0.115;

/**
 * テロップの日付・区切り線に使う球団カラーを返す。未選択や該当なしは null。
 *
 * まずメインカラーを試し、暗すぎて写真の上で沈む場合はセカンドカラーを使う。
 * ドラゴンズやライオンズのような濃紺は単体では読めないため、公式に
 * 対になっている白やゴールドへ自然に落ちる。
 */
export function resolveTelopTeamColor(favoriteTeam: string): string | null {
  const brand = TEAM_BRAND_COLORS[favoriteTeam as TeamCode];
  if (!brand) return null;
  for (const candidate of [brand.main, brand.second]) {
    if (relativeLuminance(candidate) >= MIN_TELOP_LUMINANCE) return candidate;
  }
  return null;
}
