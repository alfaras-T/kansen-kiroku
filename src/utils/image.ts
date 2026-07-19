/**
 * Web版のexpo-image-pickerはblob: URLを返すが、html-to-imageは
 * blob: URLを画像として正しく埋め込めない上、埋め込み用にdata URI化
 * する場合もカメラ写真そのままの解像度では大きすぎて失敗する
 * (特にSafari/iOSで顕著)ことがある。失敗してもエラーにはならず、
 * その要素だけ描画されない(=書き出し画像から写真だけ消える)ため
 * 気づきにくい。書き出し長辺より十分大きい2400pxを上限に縮小し、
 * JPEGで再エンコードすることでデータ量を抑える。
 */
export async function blobUrlToResizedDataUri(blobUrl: string, maxLongEdge = 2400): Promise<string> {
  const blob = await (await fetch(blobUrl)).blob();
  const bitmap = await createImageBitmap(blob);
  const longEdge = Math.max(bitmap.width, bitmap.height);
  const scale = longEdge > maxLongEdge ? maxLongEdge / longEdge : 1;
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context を取得できませんでした');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL('image/jpeg', 0.9);
}
