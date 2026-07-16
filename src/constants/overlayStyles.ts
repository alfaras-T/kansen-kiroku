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
  body: string;
  accent: string;
  dim: string;
  caption: string;
  gradientFrom: string;
  gradientTo: string;
}

export const OVERLAY_STYLES: Record<OverlayStyleKey, OverlayPalette> = {
  amber: {
    label: 'ナイター（アンバー）',
    body: '#ECE9E1',
    accent: '#FFB627',
    dim: 'rgba(236,233,225,0.55)',
    caption: 'rgba(236,233,225,0.8)',
    gradientFrom: '#0B1220',
    gradientTo: '#1a2740',
  },
  mono: {
    label: 'デイゲーム（モノクロ）',
    body: '#F2F2F2',
    accent: '#FFFFFF',
    dim: 'rgba(255,255,255,0.5)',
    caption: 'rgba(255,255,255,0.82)',
    gradientFrom: '#161616',
    gradientTo: '#2b2b2b',
  },
  green: {
    label: 'レトロ（グリーン）',
    body: '#BFE8CC',
    accent: '#4CFF7A',
    dim: 'rgba(191,232,204,0.5)',
    caption: 'rgba(191,232,204,0.82)',
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
