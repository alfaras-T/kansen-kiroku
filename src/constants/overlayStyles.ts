import { Platform } from 'react-native';

export type OverlayStyleKey = 'classic' | 'minimal' | 'film' | 'night';
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
  // 写ルンです的な、フィルムカメラの日付焼き込み風。暖色でノスタルジックに
  film: {
    label: 'フィルム',
    body: '#F7EEDF',
    accent: '#FF9E45',
    dim: 'rgba(247,238,223,0.4)',
    caption: 'rgba(247,238,223,0.9)',
    divider: 'rgba(247,238,223,0.45)',
    scrim: 'rgba(24,14,6,0.45)',
    gradientFrom: '#1a120a',
    gradientTo: '#33210f',
  },
  // ナイトゲームの空気。氷のようなブルーで涼しく締める
  night: {
    label: 'ナイト',
    body: '#FFFFFF',
    accent: '#8FD4FF',
    dim: 'rgba(255,255,255,0.38)',
    caption: 'rgba(255,255,255,0.9)',
    divider: 'rgba(255,255,255,0.48)',
    scrim: 'rgba(5,11,24,0.48)',
    gradientFrom: '#060d1c',
    gradientTo: '#12233f',
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
 * Web版はcaptureRefがDOM/canvasベースで動作し、大きすぎる画像だと
 * ブラウザ側のラスタライズがタイル分割されて継ぎ目が出ることがあるため、
 * 安全側の1600pxに据え置く。ネイティブ(iOS/Android)はその制約が無いため、
 * より高い解像度で書き出す。
 *
 * 注意: Web版のcaptureRef(html2canvas)はscaleを明示しない場合、
 * デフォルトでwindow.devicePixelRatio倍の物理解像度でレンダリングする。
 * そのため、この定数をそのままCSSサイズとして書き出し用Viewに与えると、
 * dpr=2の端末では実際には1600pxの2倍(3200px)でレンダリングされてしまい、
 * 上記の「安全側の1600px」という前提が崩れて継ぎ目が再発する。
 * dprで割った値をCSSサイズとして使うことで、実際にレンダリングされる
 * 物理ピクセルを常に1600px程度に抑える。
 */
function computeWebExportLongEdge(): number {
  const SAFE_PHYSICAL_LONG_EDGE = 1600;
  const dpr =
    typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1;
  return Math.round(SAFE_PHYSICAL_LONG_EDGE / dpr);
}

export const EXPORT_LONG_EDGE = Platform.OS === 'web' ? computeWebExportLongEdge() : 3000;

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
