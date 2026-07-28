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
 * - border(縁取り)は各球団の accent と同色にし、カードや入力欄の輪郭にも
 *   アクセント色を効かせる。
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
    border: "#FF7A14",
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
    border: "#151515",
    danger: "#A61B1B",
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
    border: "#FF5062",
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

// テロップは写真の上に暗いスクリムを敷いた上に載るため、これより暗い色は
// 沈んで読めなくなる。実測ではなく、既存12球団の色を通して決めた閾値。
const MIN_TELOP_LUMINANCE = 0.22;

/**
 * テロップの日付・区切り線に使う球団カラーを返す。未選択や該当なしは null。
 *
 * accent をそのまま使えない球団がある。タイガースは「黄色ベース+黒アクセント」
 * という構成のため accent が #151515(ほぼ黒)で、暗い写真の上では消えてしまう。
 * そこで accent が暗すぎる場合は、同じ球団テーマの中で明るい側の色
 * (onAccent → background の順)へ振り替える。タイガースなら黄色が選ばれ、
 * かえって球団らしい色になる。
 */
export function resolveTelopTeamColor(favoriteTeam: string): string | null {
  const theme = TEAM_THEMES[favoriteTeam as TeamCode];
  if (!theme) return null;
  for (const candidate of [theme.accent, theme.onAccent, theme.background]) {
    if (relativeLuminance(candidate) >= MIN_TELOP_LUMINANCE) return candidate;
  }
  return null;
}
