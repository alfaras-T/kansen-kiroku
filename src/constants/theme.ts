/**
 * 配色。夜の球場を土台にした固定のダークテーマで、ライト/ダークの自動切替は
 * しない。写真が主役の画面なので、地は一貫して沈んでいる方がよい。
 * お気に入りチームが選ばれている場合は constants/teamThemes.ts が上書きする。
 */

import "@/global.css";

// Ball Films: 夜間球場をイメージした固定ダークテーマ(ライト/ダーク自動切替はしない)
// お気に入りチームが選ばれている場合は、これをベースに constants/teamThemes.ts の
// 配色で上書きしたパレットが使われる。
const night = {
  text: "#ECE9E1",
  background: "#0B1220",
  backgroundElement: "#121C30",
  backgroundSelected: "#1B2A4A",
  textSecondary: "#8f97a8",
  accent: "#FFB627",
  accentDim: "#8a6b2a",
  /** accent を背景に敷いたとき、その上に載せる文字・アイコンの色 */
  onAccent: "#12100a",
  border: "#223052",
  danger: "#C1443A",
} as const;

/** アプリ全体で使う配色一式。チームテーマもこの形に揃える。 */
export type Palette = { [K in keyof typeof night]: string };

export const DEFAULT_PALETTE: Palette = night;

export const Colors = {
  light: night,
  dark: night,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * 角丸。値は2つだけに絞る。
 *
 * 以前は 6/7/8/10 が場当たりに混在していた。均一を避けようとして無秩序に
 * するのは設計ではない。「面の角」と「小さな印の角」で意味が違うので、
 * その2つだけを持つ。写真とカードは角を落とさない(0)。
 */
export const Radius = {
  /** ボタンや入力欄などの面 */
  surface: 6,
  /** 選択の印など、ごく小さな要素 */
  mark: 2,
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;
