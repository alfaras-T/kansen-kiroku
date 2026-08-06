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

function toHsl(hex: string): [number, number, number] {
  const int = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(int >> 16) & 255, (int >> 8) & 255, int & 255].map(
    (v) => v / 255,
  );
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return [0, 0, l];
  const sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r
      ? (g - b) / d + (g < b ? 6 : 0)
      : max === g
        ? (b - r) / d + 2
        : (r - g) / d + 4;
  return [h / 6, sat, l];
}

function fromHsl(h: number, sat: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = sat * Math.min(l, 1 - l);
    return l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
  };
  const to = (v: number) =>
    Math.round(Math.max(0, Math.min(255, v * 255)))
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}

// テロップは写真の上の暗いスクリム(輝度0.005相当)に載る。
// コントラスト比 4.5:1 を確保できる輝度がこの値。
// (L + 0.05) / (0.005 + 0.05) >= 4.5 を解くと L >= 0.2225。
const MIN_TELOP_LUMINANCE = 0.2225;
// 黒や灰は色相を持たないため、明度を上げても中間の灰にしかならず
// 球団色として弱い。無彩色だけは白寄りまで引き上げる。
const ACHROMATIC_TARGET = 0.62;

/**
 * テロップの日付・区切り線に使う球団カラーを返す。未選択や該当なしは null。
 *
 * 公式のメインカラーをそのまま使うのが基本。ただし濃紺や黒は写真の上で
 * 沈んで読めない。セカンドカラーで縁取る方式も試したが、細い文字では
 * 縁が効かず、にじんで見えるだけだった。
 *
 * そこで「色相と彩度は保ったまま明度だけを上げる」方式にしている。
 * ドラゴンズの濃紺なら同じ色相の明るい青になる。別の色に振り替えるのでは
 * なく同じ色の明るい版なので、球団の色として認識できる。
 *
 * マリーンズの黒だけは色相を持たず、明度を上げても灰にしかならない。
 * 無彩色は例外として白寄りまで引き上げる。
 */
function ensureTelopLegible(hex: string): string {
  if (relativeLuminance(hex) >= MIN_TELOP_LUMINANCE) return hex;
  const [h, sat, startL] = toHsl(hex);
  const goal = sat < 0.08 ? ACHROMATIC_TARGET : MIN_TELOP_LUMINANCE;
  let l = startL;
  for (let i = 0; i < 200 && l < 0.99; i += 1) {
    l += 0.005;
    if (relativeLuminance(fromHsl(h, sat, l)) >= goal) break;
  }
  return fromHsl(h, sat, l);
}

export function resolveTelopTeamColor(favoriteTeam: string): string | null {
  const brand = TEAM_BRAND_COLORS[favoriteTeam as TeamCode];
  if (!brand) return null;
  return ensureTelopLegible(brand.main);
}

/**
 * テロップの区切り線(スコアと球場名の間)に使う色。
 * 指定のない球団は null を返し、日付と同じ球団カラーを使う。
 *
 * 日付も区切り線も同じ色だと、メインカラーの近い球団どうしが見分けられない。
 * 特に濃紺は多く、ベイスターズ・ドラゴンズ・スワローズ・ファイターズ・
 * バファローズ・ライオンズの六球団が該当する。いずれも明度を上げた時点で
 * よく似た青になり、日付の色だけでは判別できない。
 *
 * 使うのは、その球団のUIで差し色になっている色(TEAM_THEMES.accent)。
 * 公式のセカンドカラーではない。この二つは十球団で食い違っている
 * (公式カラーをそのまま画面に敷くと視認性が落ちるため、UI側は独自に
 *  調整した配色を持っている。詳しくは TEAM_THEMES のコメント)。
 * 画面で見慣れている色と、書き出した画像に乗る色を揃える。
 *
 * 差し色はもともと暗い土台の上に置くために選ばれているので、そのままでも
 * テロップのスクリム上で読める。それでも暗い色が入ってきた場合に備え、
 * 日付と同じ ensureTelopLegible を通し、色相と彩度を保ったまま
 * 読める明るさまで持ち上げる(＝同系色のまま明るくする)。
 */

/** 区切り線を分けない球団。セカンドが黒か白しかなく、振り替えても手掛かりが増えない */
const DIVIDER_SAME_AS_DATE: TeamCode[] = ['T', 'G', 'H', 'M'];

/**
 * UIの差し色をそのまま使えない球団。
 * ライオンズの差し色は白で、同じく白に寄るドラゴンズ・カープ・ファイターズと
 * 重なる。公式カラーからは外れるが、どの球団とも重ならない赤を当てる。
 */
const TELOP_DIVIDER_OVERRIDES: Partial<Record<TeamCode, string>> = {
  L: '#FF3B30',
};

export function resolveTelopDividerColor(favoriteTeam: string): string | null {
  const code = favoriteTeam as TeamCode;
  if (DIVIDER_SAME_AS_DATE.includes(code)) return null;
  const override = TELOP_DIVIDER_OVERRIDES[code];
  if (override) return override;
  const theme = TEAM_THEMES[code];
  if (!theme) return null;
  return ensureTelopLegible(theme.accent);
}
