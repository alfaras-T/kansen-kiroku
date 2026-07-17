import { DEFAULT_PALETTE, Palette } from "@/constants/theme";
import { TeamCode } from "@/constants/teams";

/**
 * 球団ごとのイメージカラーを反映したパレット。
 *
 * 方針:
 * - 球団のロゴ・正式名称は使わない方針に合わせ、公式に定められたブランドカラーの
 *   色値をそのまま持ち込むことはせず、一般に知られたイメージカラー(オレンジ/黄色/
 *   ネイビー…)の印象に合わせて独自に調整した色を定義する。
 * - 夜間球場をイメージした暗いベースは全チーム共通で維持し、
 *   「濃い方の色」を背景の色味、「映える方の色」を accent に割り当てる。
 * - accent はスコアの数字・選択中のタブ・ボタン背景に使うため、
 *   暗い背景の上でも読め、かつ onAccent の文字が乗るだけの明るさを確保する。
 */
export const TEAM_THEMES: Record<TeamCode, Palette> = {
  // ジャイアンツ: オレンジ + 黒
  G: {
    text: "#F2EFEA",
    background: "#0D0D0F",
    backgroundElement: "#17171B",
    backgroundSelected: "#2A2118",
    textSecondary: "#9A9AA4",
    accent: "#FF7A1A",
    accentDim: "#8A4110",
    onAccent: "#14100A",
    border: "#2E2E36",
    danger: "#C1443A",
  },
  // タイガース: 黄色 + 黒(ホークスと差別化するため、やや暖色寄りの黄と暖かい黒)
  T: {
    text: "#F4F1E6",
    background: "#0E0D0A",
    backgroundElement: "#1A1813",
    backgroundSelected: "#2C2716",
    textSecondary: "#9C978A",
    accent: "#FFD028",
    accentDim: "#8A6F12",
    onAccent: "#14120A",
    border: "#322E22",
    danger: "#C1443A",
  },
  // カープ: 赤 + 白(白は文字色として使う)
  C: {
    text: "#F6F2F2",
    background: "#100A0B",
    backgroundElement: "#1C1315",
    backgroundSelected: "#2E1A1C",
    textSecondary: "#A39698",
    accent: "#FF4D4D",
    accentDim: "#8A1F1F",
    onAccent: "#1A0A0A",
    border: "#382427",
    danger: "#E0736B",
  },
  // ドラゴンズ: 青 + 白(白は文字色として使う)
  D: {
    text: "#EDF1F7",
    background: "#080C16",
    backgroundElement: "#121A2A",
    backgroundSelected: "#1A2740",
    textSecondary: "#8D97A8",
    accent: "#3E8FFF",
    accentDim: "#1F4A87",
    onAccent: "#08111F",
    border: "#24334D",
    danger: "#C1443A",
  },
  // ベイスターズ: 青 + 水色(ライオンズと差別化するため、明るい青寄りの accent)
  DB: {
    text: "#EAF3FB",
    background: "#061323",
    backgroundElement: "#0F2138",
    backgroundSelected: "#17314F",
    textSecondary: "#8AA0B4",
    accent: "#4FB3FF",
    accentDim: "#256A99",
    onAccent: "#04121F",
    border: "#21405F",
    danger: "#C1443A",
  },
  // スワローズ: 紺 + 緑(紺を背景の色味、緑を accent に)
  S: {
    text: "#EDF1F6",
    background: "#080E1E",
    backgroundElement: "#121C31",
    backgroundSelected: "#16323A",
    textSecondary: "#8D97A9",
    accent: "#4FC98A",
    accentDim: "#2A6B49",
    onAccent: "#04140C",
    border: "#22345A",
    danger: "#C1443A",
  },
  // ホークス: 黄色 + 黒(タイガースと差別化するため、やや涼しいレモン寄りの黄と黒)
  H: {
    text: "#F3F3F0",
    background: "#0B0B0C",
    backgroundElement: "#16171A",
    backgroundSelected: "#2A2A22",
    textSecondary: "#96979E",
    accent: "#FFE14D",
    accentDim: "#8A7A1F",
    onAccent: "#14140A",
    border: "#2F3037",
    danger: "#C1443A",
  },
  // バファローズ: ゴールド + ネイビー
  B: {
    text: "#F0EDE4",
    background: "#07101F",
    backgroundElement: "#101B2E",
    backgroundSelected: "#1A2942",
    textSecondary: "#8E97A8",
    accent: "#D9B25A",
    accentDim: "#7A6330",
    onAccent: "#120E06",
    border: "#223353",
    danger: "#C1443A",
  },
  // ファイターズ: 水色 + 白(白は文字色として使う)
  F: {
    text: "#F0F5F8",
    background: "#0A1016",
    backgroundElement: "#141D26",
    backgroundSelected: "#1D2C39",
    textSecondary: "#91A0AC",
    accent: "#6FD3F5",
    accentDim: "#35798E",
    onAccent: "#06131A",
    border: "#27384A",
    danger: "#C1443A",
  },
  // マリーンズ: 黒 + 白(モノクロ。accent は白〜シルバー)
  M: {
    text: "#F2F2F3",
    background: "#0A0A0B",
    backgroundElement: "#161618",
    backgroundSelected: "#26262A",
    textSecondary: "#94949B",
    accent: "#E8E8E8",
    accentDim: "#7D7D7D",
    onAccent: "#0A0A0B",
    border: "#303035",
    danger: "#C1443A",
  },
  // ライオンズ: 紺 + 水色(ベイスターズより深い紺をベースにする)
  L: {
    text: "#ECF1F8",
    background: "#060B1A",
    backgroundElement: "#0F1830",
    backgroundSelected: "#182548",
    textSecondary: "#8B96AC",
    accent: "#7FD2F0",
    accentDim: "#3B7A8F",
    onAccent: "#050D18",
    border: "#202F55",
    danger: "#C1443A",
  },
  // イーグルス: えんじ + ゴールド(えんじを背景の色味、ゴールドを accent に)
  E: {
    text: "#F4EFEA",
    background: "#120A0C",
    backgroundElement: "#211215",
    backgroundSelected: "#331A1F",
    textSecondary: "#A5959A",
    accent: "#C9A227",
    accentDim: "#7A6118",
    onAccent: "#130E04",
    border: "#3D2328",
    danger: "#D4635A",
  },
};

/**
 * お気に入りチームのコードから実際に使うパレットを解決する。
 * 未選択(「特になし」)の場合は既定のパレットを返す。
 */
export function resolveTheme(favoriteTeam: string): Palette {
  return TEAM_THEMES[favoriteTeam as TeamCode] ?? DEFAULT_PALETTE;
}
