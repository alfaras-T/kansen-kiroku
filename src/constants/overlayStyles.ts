import { Platform } from 'react-native';

export type OverlayStyleKey = 'classic' | 'minimal' | 'film';
export type OverlayPosition = 'br' | 'bl' | 'tr' | 'tl';
export type OutputRatio = 'original' | 'square' | 'portrait' | 'story';

export interface PhotoOffset {
  x: number;
  y: number;
}

export const DEFAULT_PHOTO_OFFSET: PhotoOffset = { x: 0, y: 0 };
export const MIN_PHOTO_SCALE = 1.0;
export const MAX_PHOTO_SCALE = 3.0;
// 写真追加時のデフォルトは最小サイズ(フレームにちょうど収まる状態)にする
export const DEFAULT_PHOTO_SCALE = MIN_PHOTO_SCALE;

export const MIN_TELOP_SCALE = 0.7;
export const MAX_TELOP_SCALE = 1.6;
// テロップ(日付・スコア・球場等のテキストブロック)のデフォルトは等倍(=今のサイズ)のまま挿入する
export const DEFAULT_TELOP_SCALE = 1.0;

/**
 * テロップ各要素の大きさの倍率。省略時は 1(既定の階層)。
 *
 * 既定のテロップはスコアが最大(34pt)で視線を独占するが、写真を見返した
 * ときに記憶を呼び起こすのはスコアではなく「その日であったこと」の方が
 * 多い。倍率を差し替えられるようにして、日付を主役にした構成も選べるようにする。
 */
export interface OverlayTelopSizes {
  date?: number;
  code?: number;
  score?: number;
  stadium?: number;
  memo?: number;
}

export interface OverlayPalette {
  label: string;
  /** チームコードなど本文の色 */
  body: string;
  /** 日付・勝者スコアなど差し色 */
  accent: string;
  /** 敗者スコアなど沈ませる色 */
  dim: string;
  /** 球場・メモなど小さめテキストの色 */
  caption: string;
  /** 区切り線の色 */
  divider: string;
  /** 写真とテキストの間に敷くグラデーション(スクリム)の濃い側の色 */
  scrim: string;
  gradientFrom: string;
  gradientTo: string;
  /** テロップの大きさの階層。省略時はスコアを主役にした既定の階層 */
  sizes?: OverlayTelopSizes;
  /** 日付を「26 6 14」というフィルムカメラ風の表記にする */
  dateStamp?: boolean;
  /** 日付を自身の色で発光させる(焼き込みの滲みを再現する) */
  dateGlow?: boolean;
  /**
   * テロップを積み上げず、一列に並べる。
   * フィルムカメラの焼き込みは、日付も何もかもが同じ大きさ・同じ色で
   * 一列に並ぶ。要素ごとに大小や色を付けると、途端に「デザインされた
   * テロップ」に見えてしまうため、構造ごと変える。
   */
  inline?: boolean;
}

export const OVERLAY_STYLES: Record<OverlayStyleKey, OverlayPalette> = {
  // 王道。純白 + シャンパンゴールドの差し色。スタジアムの照明に映える
  classic: {
    label: 'クラシック',
    body: '#FFFFFF',
    accent: '#E8C177',
    dim: 'rgba(255,255,255,0.38)',
    caption: 'rgba(255,255,255,0.92)',
    divider: 'rgba(255,255,255,0.5)',
    scrim: 'rgba(10,10,14,0.45)',
    gradientFrom: '#14120d',
    gradientTo: '#2a2417',
  },
  // 徹底的に引き算したオールホワイト。どんな写真も邪魔しない
  minimal: {
    label: 'ミニマル',
    body: '#FFFFFF',
    accent: '#FFFFFF',
    dim: 'rgba(255,255,255,0.35)',
    caption: 'rgba(255,255,255,0.85)',
    divider: 'rgba(255,255,255,0.4)',
    scrim: 'rgba(0,0,0,0.35)',
    gradientFrom: '#161616',
    gradientTo: '#2b2b2b',
  },
  // 写ルンです的な、フィルムカメラの日付焼き込み。
  //
  // 当時のコンパクトカメラは、日付を橙色の発光で写真に焼き込んでいた。
  // 色を暖色にするだけでは「暖色系のテロップ」にしかならないので、
  // あの見た目を成り立たせている2つの特徴を再現する。
  //   1. 日付そのものが光っているような滲み(dateGlow)
  //   2. 「26 6 14」という独特の日付表記(dateStamp)
  film: {
    label: 'フィルム',
    body: '#F7EEDF',
    // 当時の焼き込みに近い、彩度の高い橙。
    accent: '#FF8A2B',
    dim: 'rgba(247,238,223,0.4)',
    caption: 'rgba(247,238,223,0.9)',
    divider: 'rgba(247,238,223,0.45)',
    scrim: 'rgba(24,14,6,0.45)',
    gradientFrom: '#1a120a',
    gradientTo: '#33210f',
    dateStamp: true,
    dateGlow: true,
    inline: true,
  },
};

export const OUTPUT_RATIOS: { key: OutputRatio; label: string; aspect: number | null }[] = [
  { key: 'original', label: '元のサイズ', aspect: null },
  { key: 'square', label: 'スクエア（1:1）', aspect: 1 },
  { key: 'portrait', label: 'ポートレート（4:5）', aspect: 4 / 5 },
  { key: 'story', label: 'ストーリー（9:16）', aspect: 9 / 16 },
];

/**
 * 実際に描画に使う縦横比（幅÷高さ）を解決する。
 * 「元の写真のまま」の場合は写真自体の縦横比、写真が無ければ1:1にフォールバックする。
 */
export function resolveOverlayAspect(ratio: OutputRatio, photoAspectRatio?: number | null): number {
  const cfg = OUTPUT_RATIOS.find((r) => r.key === ratio) ?? OUTPUT_RATIOS[0];
  return cfg.aspect ?? photoAspectRatio ?? 1;
}

/**
 * 書き出し(保存/共有)用の画像サイズを解決する。
 * 画面上のプレビュー枠(調整しやすいよう画面に収まる小さいサイズ)とは切り離し、
 * 常にこの解像度で書き出すことで、プレビューがどれだけ小さく表示されていても
 * 出力画質が劣化しないようにする。
 */

/**
 * 書き出しの長辺(px)。
 * ネイティブ(iOS/Android)はcaptureRefで直接ネイティブ解像度で書き出せるため、
 * より高い解像度にする。Web版はhtml-to-imageのpixelRatioオプションを1に固定して
 * 呼び出しており、この定数がそのまま出力の物理ピクセルサイズになる
 * (devicePixelRatioによる自動拡大は行われない)ため、素直に1600pxでよい。
 */
export const EXPORT_LONG_EDGE = Platform.OS === 'web' ? 1600 : 3000;

export function resolveExportSize(
  ratio: OutputRatio,
  photoAspectRatio?: number | null,
): { width: number; height: number } {
  const aspect = resolveOverlayAspect(ratio, photoAspectRatio);
  if (aspect >= 1) {
    return { width: EXPORT_LONG_EDGE, height: Math.round(EXPORT_LONG_EDGE / aspect) };
  }
  return { width: Math.round(EXPORT_LONG_EDGE * aspect), height: EXPORT_LONG_EDGE };
}

export const POSITIONS: { key: OverlayPosition; label: string }[] = [
  { key: 'br', label: '右下' },
  { key: 'bl', label: '左下' },
  { key: 'tr', label: '右上' },
  { key: 'tl', label: '左上' },
];
