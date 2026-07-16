export type OverlayStyleKey = 'amber' | 'mono' | 'green';
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
}

export const OVERLAY_STYLES: Record<OverlayStyleKey, OverlayPalette> = {
  amber: {
    label: 'ナイター（アンバー）',
    body: '#FFFFFF',
    accent: '#F2B04E',
    dim: 'rgba(255,255,255,0.38)',
    caption: 'rgba(255,255,255,0.92)',
    divider: 'rgba(255,255,255,0.5)',
    scrim: 'rgba(8,10,18,0.72)',
    gradientFrom: '#0B1220',
    gradientTo: '#1a2740',
  },
  mono: {
    label: 'デイゲーム（モノクロ）',
    body: '#FFFFFF',
    accent: '#FFFFFF',
    dim: 'rgba(255,255,255,0.38)',
    caption: 'rgba(255,255,255,0.88)',
    divider: 'rgba(255,255,255,0.5)',
    scrim: 'rgba(10,10,12,0.66)',
    gradientFrom: '#161616',
    gradientTo: '#2b2b2b',
  },
  green: {
    label: 'レトロ（グリーン）',
    body: '#F4EDDC',
    accent: '#8FE0B4',
    dim: 'rgba(244,237,220,0.4)',
    caption: 'rgba(244,237,220,0.9)',
    divider: 'rgba(244,237,220,0.45)',
    scrim: 'rgba(7,19,11,0.72)',
    gradientFrom: '#07130A',
    gradientTo: '#0f2617',
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

export const POSITIONS: { key: OverlayPosition; label: string }[] = [
  { key: 'br', label: '右下' },
  { key: 'bl', label: '左下' },
  { key: 'tr', label: '右上' },
  { key: 'tl', label: '左上' },
];
