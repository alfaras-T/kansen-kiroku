import { TeamCode } from "@/constants/teams";
import { DEFAULT_PALETTE, Palette } from "@/constants/theme";

/**
 * 球団ごとのイメージカラーを反映したパレット。
 *
 * 方針:
 * - 球団のロゴ・正式名称を使わない方針に合わせ、公式に定められたブランドカラーの
 *   色値をそのまま持ち込むことはせず、一般に知られたイメージカラー(オレンジ/黄色/
 *   ネイビー…)の印象に合わせて独自に調整した色を定義する。
 * - 夜間球場をイメージした暗さは全チームで揃えたうえで、背景・カード・枠線まで
 *   球団の色味を乗せることで、ひと目でどのチームのテーマか分かるようにしている。
 * - 2色指定のうち「濃い方の色」を背景の土台に、「映える方の色」を accent に割り当て、
 *   2色目が黒・白でないチーム(紺+緑、ネイビー+ゴールド等)は枠線にも2色目を効かせる。
 * - accent はスコアの数字・選択中のタブ・ボタン背景に使うため、暗い背景の上でも読め、
 *   かつ onAccent の文字が乗るだけの明るさを確保している(全チームで WCAG AA を確認済み)。
 */
export const TEAM_THEMES: Record<TeamCode, Palette> = {
  // ジャイアンツ: オレンジ + 黒(黒を土台にオレンジを効かせる)
  G: {
    text: "#F4F0EE",
    background: "#190D05",
    backgroundElement: "#3D220F",
    backgroundSelected: "#5B361D",
    textSecondary: "#B4A69C",
    accent: "#FF7A1A",
    accentDim: "#A34D0F",
    onAccent: "#1A0C02",
    border: "#74492D",
    danger: "#F0655A",
  },
  // タイガース: 黄色 + 黒(ホークスと分けるため暖色寄りの黄)
  T: {
    text: "#F4F2EE",
    background: "#191305",
    backgroundElement: "#3D2F0F",
    backgroundSelected: "#5B481D",
    textSecondary: "#B4AD9C",
    accent: "#FFC61A",
    accentDim: "#A37B0C",
    onAccent: "#1A1302",
    border: "#745E2D",
    danger: "#F0655A",
  },
  // カープ: 赤 + 白(白は文字色として使う)
  C: {
    text: "#F4EEEF",
    background: "#190507",
    backgroundElement: "#3D0F13",
    backgroundSelected: "#5B1D22",
    textSecondary: "#B49C9E",
    accent: "#FF4D4D",
    accentDim: "#A32626",
    onAccent: "#1F0606",
    border: "#742D33",
    danger: "#FF9E9E",
  },
  // ドラゴンズ: 青 + 白(白は文字色として使う)
  D: {
    text: "#EEF0F4",
    background: "#050C19",
    backgroundElement: "#0F203D",
    backgroundSelected: "#1D345B",
    textSecondary: "#9CA5B4",
    accent: "#3E8FFF",
    accentDim: "#1F4A87",
    onAccent: "#04101F",
    border: "#2D4774",
    danger: "#F0655A",
  },
  // ベイスターズ: 青 + 水色(枠線に水色を効かせる)
  DB: {
    text: "#EEF2F4",
    background: "#04111A",
    backgroundElement: "#0D2C3F",
    backgroundSelected: "#1A445E",
    textSecondary: "#9CABB4",
    accent: "#4FB3FF",
    accentDim: "#256A99",
    onAccent: "#03131F",
    border: "#296477",
    danger: "#F0655A",
  },
  // スワローズ: 紺 + 緑(紺を土台に、枠線と accent へ緑を効かせる)
  S: {
    text: "#EEF1F4",
    background: "#060E18",
    backgroundElement: "#10233C",
    backgroundSelected: "#1E385A",
    textSecondary: "#9CA7B4",
    accent: "#4FC98A",
    accentDim: "#2A6B49",
    onAccent: "#04140C",
    border: "#2F7250",
    danger: "#F0655A",
  },
  // ホークス: 黄色 + 黒(タイガースと分けるためレモン寄りの黄)
  H: {
    text: "#F4F3EE",
    background: "#191705",
    backgroundElement: "#3D3A0F",
    backgroundSelected: "#5B571D",
    textSecondary: "#B4B39C",
    accent: "#FFE14D",
    accentDim: "#A38A1F",
    onAccent: "#1A1702",
    border: "#746F2D",
    danger: "#F0655A",
  },
  // バファローズ: ネイビー + ゴールド(枠線と accent へゴールドを効かせる)
  B: {
    text: "#EEEFF4",
    background: "#060918",
    backgroundElement: "#10183C",
    backgroundSelected: "#1E285A",
    textSecondary: "#9CA0B4",
    accent: "#E0B75E",
    accentDim: "#8A6E2E",
    onAccent: "#160F03",
    border: "#72612F",
    danger: "#F0655A",
  },
  // ファイターズ: 水色 + 白(白は文字色として使う)
  F: {
    text: "#EEF2F4",
    background: "#051319",
    backgroundElement: "#0F313D",
    backgroundSelected: "#1D4A5B",
    textSecondary: "#9CAEB4",
    accent: "#6FD3F5",
    accentDim: "#35798E",
    onAccent: "#04131A",
    border: "#2D6174",
    danger: "#F0655A",
  },
  // マリーンズ: 黒 + 白(指定どおりモノクロ。accent は白〜シルバー)
  M: {
    text: "#F0F1F2",
    background: "#0E0F10",
    backgroundElement: "#242628",
    backgroundSelected: "#393B3E",
    textSecondary: "#A5A7AC",
    accent: "#E8E8E8",
    accentDim: "#7D7D7D",
    onAccent: "#0A0A0B",
    border: "#4D4F53",
    danger: "#F0655A",
  },
  // ライオンズ: 紺 + 水色(ベイスターズより深い紺を土台にする)
  L: {
    text: "#EEEFF4",
    background: "#04071A",
    backgroundElement: "#0D1340",
    backgroundSelected: "#19225F",
    textSecondary: "#9C9FB4",
    accent: "#7FD2F0",
    accentDim: "#3B7A8F",
    onAccent: "#040C18",
    border: "#296478",
    danger: "#F0655A",
  },
  // イーグルス: えんじ + ゴールド(えんじを土台に、枠線と accent へゴールドを効かせる)
  E: {
    text: "#F4EEEF",
    background: "#180609",
    backgroundElement: "#3B1119",
    backgroundSelected: "#591F2A",
    textSecondary: "#B49CA1",
    accent: "#D4A82B",
    accentDim: "#7A6118",
    onAccent: "#150F02",
    border: "#716130",
    danger: "#FF9E9E",
  },
};

/**
 * お気に入りチームのコードから実際に使うパレットを解決する。
 * 未選択(「特になし」)の場合は既定のパレットを返す。
 */
export function resolveTheme(favoriteTeam: string): Palette {
  return TEAM_THEMES[favoriteTeam as TeamCode] ?? DEFAULT_PALETTE;
}
