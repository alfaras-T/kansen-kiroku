import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * 観戦記録のサムネイル保存。
 *
 * ベタ焼き（その年の観戦を格子に並べた一枚）のために、書き出した画像の
 * 縮小版を記録ごとに1枚だけ持っておく。
 *
 * 保存先はプラットフォームで分ける。
 * - ネイティブ: 端末内のファイル(documents/thumbnails/{id}.jpg)
 * - Web: AsyncStorage に data URI として保存
 *
 * ネイティブでAsyncStorageを使わないのは、1枚あたり20KB前後のbase64文字列を
 * 何十件も抱えることになり、Androidの既定容量(6MB)を圧迫するため。
 * ファイルなら容量を気にせず持てる。
 *
 * サーバーには一切送らない。この端末の中だけで完結する。
 */

const ENABLED_KEY = 'kansen-kiroku:saveThumbnails';
const WEB_PREFIX = 'kansen-kiroku:thumb:';
const DIR_NAME = 'thumbnails';

/** ベタ焼き用に十分で、かつ容量を食わない大きさ */
export const THUMBNAIL_WIDTH = 320;

/** サムネイルを保存する設定かどうか。未設定なら有効。 */
export async function loadThumbnailEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(ENABLED_KEY);
    // 既定を有効にしているのは、無効だとベタ焼きの存在に気づかれないため。
    // 写真を端末に残したくない場合は設定画面から切れる。
    return raw !== '0';
  } catch (e) {
    console.warn('サムネイル設定の読み込みに失敗しました', e);
    return true;
  }
}

export async function saveThumbnailEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(ENABLED_KEY, enabled ? '1' : '0');
  } catch (e) {
    console.warn('サムネイル設定の保存に失敗しました', e);
  }
}

/** ネイティブの保存先ディレクトリを用意して返す */
const B64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * base64の文字列をバイト列に戻す。
 *
 * atob は環境によって用意されていないことがあり、Buffer も既定では無い。
 * 変換のためだけに依存を増やしたくないので、ここで持つ。
 */
function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array((clean.length * 3) >> 2);
  let acc = 0;
  let bits = 0;
  let out = 0;
  for (let i = 0; i < clean.length; i += 1) {
    acc = (acc << 6) | B64_CHARS.indexOf(clean[i]);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[out] = (acc >> bits) & 0xff;
      out += 1;
    }
  }
  return out === bytes.length ? bytes : bytes.subarray(0, out);
}

async function ensureDir() {
  const { Directory, Paths } = await import('expo-file-system');
  const dir = new Directory(Paths.document, DIR_NAME);
  if (!dir.exists) dir.create({ intermediates: true });
  return { dir, Directory, Paths };
}

/**
 * サムネイルを保存する。base64はデータURIの接頭辞を含まない生の文字列。
 * 設定が無効なら何もしない。
 */
export async function saveThumbnail(
  entryId: string,
  base64: string,
): Promise<void> {
  if (!base64) return;
  if (!(await loadThumbnailEnabled())) return;

  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(
        `${WEB_PREFIX}${entryId}`,
        `data:image/jpeg;base64,${base64}`,
      );
      return;
    }
    const { dir } = await ensureDir();
    const { File } = await import('expo-file-system');
    const file = new File(dir, `${entryId}.jpg`);
    if (file.exists) file.delete();
    file.create();
    // write が受け取るのは文字列かバイト列で、符号化の指定は無い。
    // base64の文字列をそのまま渡すと、画像ではなく「base64という文字列」が
    // .jpg として書き込まれ、読み込み側で画像として開けなくなる。
    // 自前でバイト列に戻してから渡す。
    file.write(base64ToBytes(base64));
  } catch (e) {
    // サムネイルは付加価値なので、失敗しても記録の保存自体は妨げない
    console.warn('サムネイルの保存に失敗しました', e);
  }
}

/** 表示用のURIを返す。無ければ null。 */
export async function loadThumbnailUri(
  entryId: string,
): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(`${WEB_PREFIX}${entryId}`);
    }
    const { File, Paths } = await import('expo-file-system');
    const file = new File(Paths.document, DIR_NAME, `${entryId}.jpg`);
    return file.exists ? file.uri : null;
  } catch (e) {
    console.warn('サムネイルの読み込みに失敗しました', e);
    return null;
  }
}

/** 複数件をまとめて解決する。ベタ焼きの格子表示用。 */
export async function loadThumbnailUriMap(
  entryIds: string[],
): Promise<Record<string, string>> {
  const pairs = await Promise.all(
    entryIds.map(async (id) => [id, await loadThumbnailUri(id)] as const),
  );
  const map: Record<string, string> = {};
  for (const [id, uri] of pairs) if (uri) map[id] = uri;
  return map;
}

/** 記録を削除したときに呼ぶ。孤児のファイルを残さないため。 */
export async function deleteThumbnail(entryId: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(`${WEB_PREFIX}${entryId}`);
      return;
    }
    const { File, Paths } = await import('expo-file-system');
    const file = new File(Paths.document, DIR_NAME, `${entryId}.jpg`);
    if (file.exists) file.delete();
  } catch (e) {
    console.warn('サムネイルの削除に失敗しました', e);
  }
}

/** 設定を無効にしたときなどに、保存済みのサムネイルをすべて消す。 */
export async function deleteAllThumbnails(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      const keys = await AsyncStorage.getAllKeys();
      const targets = keys.filter((k) => k.startsWith(WEB_PREFIX));
      if (targets.length) await AsyncStorage.multiRemove(targets);
      return;
    }
    const { Directory, Paths } = await import('expo-file-system');
    const dir = new Directory(Paths.document, DIR_NAME);
    if (dir.exists) dir.delete();
  } catch (e) {
    console.warn('サムネイルの一括削除に失敗しました', e);
  }
}

/**
 * バックアップ用に全サムネイルをbase64で取り出す。
 * 機種変更でベタ焼きが消えてしまわないよう、バックアップにも含める。
 */
export async function exportThumbnails(
  entryIds: string[],
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const id of entryIds) {
    try {
      if (Platform.OS === 'web') {
        const uri = await AsyncStorage.getItem(`${WEB_PREFIX}${id}`);
        if (uri) out[id] = uri.replace(/^data:image\/\w+;base64,/, '');
        continue;
      }
      const { File, Paths } = await import('expo-file-system');
      const file = new File(Paths.document, DIR_NAME, `${id}.jpg`);
      if (file.exists) out[id] = await file.base64();
    } catch (e) {
      console.warn(`サムネイルの書き出しに失敗しました (${id})`, e);
    }
  }
  return out;
}

/** バックアップから復元する。 */
export async function importThumbnails(
  map: Record<string, string>,
): Promise<void> {
  const enabled = await loadThumbnailEnabled();
  if (!enabled) return;
  for (const [id, base64] of Object.entries(map)) {
    await saveThumbnail(id, base64);
  }
}
