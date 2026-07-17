import { TeamCode } from "@/constants/teams";
import { DEFAULT_PALETTE, Palette } from "@/constants/theme";

/**
 * 球団ごとのイメージカラーを反映したパレット。
 *
 * 方針:
 * - 球団のロゴ・正式名称を使わない方針に合わせ、公式に定められたブランドカラーの
 *   色値をそのまま持ち込むことはせず、一般に知られたイメージカラー(オレンジ/黄色/
 *   ネイビー…)の印象に合わせて独自に調整した色を定義する。
 * - 「より球団色を強く」の要望に応じ、accentだけでなく background /
 *   backgroundElement / backgroundSelected / border まで彩度・明度を引き上げ、
 *   画面全体がその球団の色に染まって見えるようにしている。ほぼ黒に近かった
 *   以前の背景と違い、背景だけを見てもどの球団か分かる濃さを狙う。
 * - 2色指定のうち「濃い方の色」を背景の土台に、「映える方の色」を accent に割り当て、
 *   2色目が黒・白でないチーム(紺+緑、ネイビー+ゴールド等)は枠線にも2色目を効かせる。
 * - accent はスコアの数字・選択中のタブ・ボタン背景に使うため、暗い背景の上でも読め、
 *   かつ onAccent の文字が乗るだけの明るさを確保している。
 * - text は常に明るいままキープし、背景を濃くしても本文の可読性(WCAG AA相当)を
 *   損なわないようにしている。
 */
export const TEAM_THEMES: Record<TeamCode, Palette> = {
  // ジャイアンツ: オレンジ + 黒(黒を土台に、深いオレンジで全面を染める)
  G: {
    text: "#FFF4EC",
    background: "#2A1404",
    backgroundElement: "#56290A",
    backgroundSelected: "#7C3B10",
    textSecondary: "#C9A88C",
    accent: "#FF7A14",
    accentDim: "#B35410",
    onAccent: "#1F0D02",
    border: "#A65420",
    danger: "#FF7A6E",
  },
  // タイガース: 黄色 + 黒(ホークスと分けるため山吹寄りの濃い黄で染める)
  T: {
    text: "#FFF8E8",
    background: "#271D03",
    backgroundElement: "#544009",
    backgroundSelected: "#7A5E10",
    textSecondary: "#C6B584",
    accent: "#FFCB05",
    accentDim: "#B08A06",
    onAccent: "#1E1602",
    border: "#A17E18",
    danger: "#FF7A6E",
  },
  // カープ: 赤 + 白(白は文字色として使い、背景〜枠線まで赤で染める)
  C: {
    text: "#FFF0F1",
    background: "#270409",
    backgroundElement: "#5C0D18",
    backgroundSelected: "#821724",
    textSecondary: "#C79AA0",
    accent: "#FF4040",
    accentDim: "#B22B2B",
    onAccent: "#240707",
    border: "#AC2432",
    danger: "#FFB0A6",
  },
  // ドラゴンズ: 青 + 白(白は文字色として使い、鮮やかな青で染める)
  D: {
    text: "#EFF4FF",
    background: "#04102E",
    backgroundElement: "#0B255E",
    backgroundSelected: "#143A89",
    textSecondary: "#97A8CC",
    accent: "#4D9BFF",
    accentDim: "#2A62B0",
    onAccent: "#041027",
    border: "#2153AE",
    danger: "#FF8A80",
  },
  // ベイスターズ: 青 + 水色(マリンブルーの土台に水色を効かせる)
  DB: {
    text: "#EFF6FC",
    background: "#03142B",
    backgroundElement: "#093157",
    backgroundSelected: "#104B80",
    textSecondary: "#92B2CC",
    accent: "#45C0FF",
    accentDim: "#2478A8",
    onAccent: "#03141F",
    border: "#1B6CA9",
    danger: "#FF8A80",
  },
  // スワローズ: 紺 + 緑(紺の土台を明るめに起こし、枠線と accent へ緑を強く効かせる)
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
  // ホークス: 黄色 + 黒(タイガースと分けるためレモン寄りの黄で染める)
  H: {
    text: "#FEFBE6",
    background: "#232105",
    backgroundElement: "#4C490B",
    backgroundSelected: "#6F6B12",
    textSecondary: "#C4C084",
    accent: "#FFE83D",
    accentDim: "#ABA020",
    onAccent: "#1D1B03",
    border: "#948E1C",
    danger: "#FF7A6E",
  },
  // バファローズ: ネイビー + ゴールド(ネイビーを明るめに起こし、枠線と accent へゴールド)
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
  // ファイターズ: 水色 + 白(白は文字色として使い、深い水色で染める)
  F: {
    text: "#EFF8FC",
    background: "#041B26",
    backgroundElement: "#0A3C52",
    backgroundSelected: "#125877",
    textSecondary: "#90BCCC",
    accent: "#57D4FF",
    accentDim: "#2C88AA",
    onAccent: "#04161F",
    border: "#1D80A6",
    danger: "#FF8A80",
  },
  // マリーンズ: 黒 + 白(モノクロのままコントラストを強め、シルバーを立てる)
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
  // ライオンズ: 紺 + 水色(最も深い紺を土台に、水色をより明るく立てる)
  L: {
    text: "#EFF0FA",
    background: "#030723",
    backgroundElement: "#0B124E",
    backgroundSelected: "#131F74",
    textSecondary: "#979CCB",
    accent: "#6FD0FF",
    accentDim: "#3D85B0",
    onAccent: "#041022",
    border: "#29609F",
    danger: "#FF8A80",
  },
  // イーグルス: えんじ + ゴールド(えんじを明るめに起こし、枠線と accent へゴールド)
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
