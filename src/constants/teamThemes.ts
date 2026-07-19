import { TeamCode } from "@/constants/teams";
import { DEFAULT_PALETTE, Palette } from "@/constants/theme";

/**
 * 球団ごとのイメージカラーを反映したパレット。
 *
 * 方針:
 * - 球団のロゴを使わない方針に合わせ、公式ブランドカラーの色値をそのまま
 *   持ち込まず、一般に知られたイメージカラーの印象に合わせて独自調整した色を定義する。
 * - 各球団は「ベース色(背景の土台)+アクセント色」の2色指定:
 *   タイガース(黄+黒)/ベイスターズ(青+ゴールド)/ジャイアンツ(黒+オレンジ)/
 *   ドラゴンズ(青+白)/カープ(赤+白)/スワローズ(紺+緑)/ホークス(黒+黄)/
 *   ファイターズ(水色+白)/バファローズ(紺+ゴールド)/
 *   ゴールデンイーグルス(エンジ+ゴールド)/ライオンズ(青+赤)/マリーンズ(黒+白)
 * - accent はスコア数字・選択中タブ・ボタンに使うため、背景の上で十分読める
 *   明度を確保する。タイガースのみ黒アクセントを成立させるため明るい黄色の
 *   土台(ライト基調)とし、他球団はダーク基調のまま。
 * - text は背景に対して WCAG AA 相当の可読性を保つ。
 */
export const TEAM_THEMES: Record<TeamCode, Palette> = {
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
    border: "#4A4A50",
    danger: "#FF7A6E",
  },
  // タイガース: 黄色ベース + 黒アクセント(黒を読ませるため明るい黄の土台)
  T: {
    text: "#171207",
    background: "#E4B400",
    backgroundElement: "#F2CB1F",
    backgroundSelected: "#FADD55",
    textSecondary: "#5C4A0A",
    accent: "#151515",
    accentDim: "#4A4A4A",
    onAccent: "#FFD400",
    border: "#9A7E0C",
    danger: "#A61B1B",
  },
  // カープ: 赤ベース + 白アクセント
  C: {
    text: "#FFF0F1",
    background: "#270409",
    backgroundElement: "#5C0D18",
    backgroundSelected: "#821724",
    textSecondary: "#C79AA0",
    accent: "#FFF2F2",
    accentDim: "#C09098",
    onAccent: "#3A0A10",
    border: "#AC2432",
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
    border: "#2153AE",
    danger: "#FF8A80",
  },
  // ベイスターズ: 青ベース + ゴールドアクセント
  DB: {
    text: "#EFF6FC",
    background: "#03142B",
    backgroundElement: "#093157",
    backgroundSelected: "#104B80",
    textSecondary: "#92B2CC",
    accent: "#F5C542",
    accentDim: "#A8842E",
    onAccent: "#1A1204",
    border: "#1B6CA9",
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
    border: "#2E9B63",
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
    border: "#4C4A32",
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
    border: "#A8893A",
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
    border: "#1D80A6",
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
    border: "#61666E",
    danger: "#FF8A80",
  },
  // ライオンズ: 青ベース + 赤アクセント
  L: {
    text: "#EFF0FA",
    background: "#030723",
    backgroundElement: "#0B124E",
    backgroundSelected: "#131F74",
    textSecondary: "#979CCB",
    accent: "#FF5062",
    accentDim: "#B03040",
    onAccent: "#2A040A",
    border: "#95404E",
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
    border: "#A9872F",
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
