/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform } from "react-native";

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

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
