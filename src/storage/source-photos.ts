import { Platform } from 'react-native';

/**
 * 作り直し用の元写真の保管。
 *
 * 書き出したあとで「やっぱりスタイルを変えたい」「スコアを間違えていた」と
 * 思ったときに、写真を選び直さずに作り直せるようにする。
 *
 * サムネイル(320px)は一覧表示のためのもので、書き出しには使えない。
 * かといって元写真は1枚2〜4MBあり、全件を持ち続けると数百MBになる。
 * そこで **直近 KEEP_COUNT 件だけ** を残す方式にしている。
 *
 * 縮小はしていない。縮小すると作り直した画像の画質が元より落ちるうえ、
 * 縮小処理のために新しいネイティブ依存(expo-image-manipulator)を足すか、
 * 隠しビューをもう一つ用意する必要がある。件数で上限を掛ける方が、
 * 実装も単純で結果も良い。
 *
 * バックアップには含めない。含めるとバックアップファイルが数十MBになり、
 * 書き出しにも読み込みにも支障が出る。機種変更後は作り直せなくなるが、
 * 作り直しは「最近作ったものを直す」ための機能なので許容する。
 *
 * Webは対象外。ファイルシステムを持たず、AsyncStorageに数MBを何件も
 * 置くことはできないため。
 */

const DIR_NAME = 'sources';

/** 何件分の元写真を残すか。1枚2〜4MBなので、20件で40〜80MB程度。 */
export const SOURCE_KEEP_COUNT = 20;

function unsupported(): boolean {
  return Platform.OS === 'web';
}

async function ensureDir() {
  const { Directory, Paths } = await import('expo-file-system');
  const dir = new Directory(Paths.document, DIR_NAME);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

/**
 * 元写真を記録IDに紐づけて保存し、古いものを間引く。
 * 失敗しても書き出し自体は妨げない。
 */
export async function saveSourcePhoto(
  entryId: string,
  photoUri: string,
): Promise<void> {
  if (unsupported() || !photoUri) return;
  try {
    const { File } = await import('expo-file-system');
    const dir = await ensureDir();

    const src = new File(photoUri);
    if (!src.exists) return;

    const ext = photoUri.split('.').pop()?.toLowerCase();
    const safeExt = ext && ext.length <= 4 ? ext : 'jpg';
    const dest = new File(dir, `${entryId}.${safeExt}`);
    if (dest.exists) dest.delete();
    await src.copy(dest);

    await pruneSourcePhotos();
  } catch (e) {
    console.warn('元写真の保存に失敗しました', e);
  }
}

/** 保存されている元写真のURIを返す。無ければ null。 */
export async function loadSourcePhotoUri(
  entryId: string,
): Promise<string | null> {
  if (unsupported()) return null;
  try {
    const { Directory, Paths } = await import('expo-file-system');
    const dir = new Directory(Paths.document, DIR_NAME);
    if (!dir.exists) return null;
    // 拡張子は元写真によって変わるため、名前の前方一致で探す
    for (const item of dir.list()) {
      const name = item.uri.split('/').pop() ?? '';
      if (name.startsWith(`${entryId}.`)) return item.uri;
    }
    return null;
  } catch (e) {
    console.warn('元写真の読み込みに失敗しました', e);
    return null;
  }
}

/** 記録を削除したときに呼ぶ。 */
export async function deleteSourcePhoto(entryId: string): Promise<void> {
  if (unsupported()) return;
  try {
    const uri = await loadSourcePhotoUri(entryId);
    if (!uri) return;
    const { File } = await import('expo-file-system');
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (e) {
    console.warn('元写真の削除に失敗しました', e);
  }
}

/** 直近 SOURCE_KEEP_COUNT 件だけ残し、古いものから消す。 */
async function pruneSourcePhotos(): Promise<void> {
  try {
    const { Directory, File, Paths } = await import('expo-file-system');
    const dir = new Directory(Paths.document, DIR_NAME);
    if (!dir.exists) return;

    const files = dir
      .list()
      .filter((item): item is InstanceType<typeof File> => item instanceof File)
      .map((file) => ({ file, at: file.modificationTime ?? 0 }))
      .sort((a, b) => b.at - a.at);

    for (const { file } of files.slice(SOURCE_KEEP_COUNT)) {
      if (file.exists) file.delete();
    }
  } catch (e) {
    console.warn('元写真の間引きに失敗しました', e);
  }
}

/** 設定画面などで容量を示すため、保存済みの合計サイズ(バイト)を返す。 */
export async function sourcePhotosTotalSize(): Promise<number> {
  if (unsupported()) return 0;
  try {
    const { Directory, File, Paths } = await import('expo-file-system');
    const dir = new Directory(Paths.document, DIR_NAME);
    if (!dir.exists) return 0;
    // Directory.size は中身を合計してくれるとは限らず、値を返さないことがある。
    // その場合 ?? 0 で常に0になり、保存されていても「無し」に見えてしまう。
    // 中のファイルを一つずつ足す方が確実。
    let total = 0;
    for (const item of dir.list()) {
      if (item instanceof File) total += item.size ?? 0;
    }
    return total;
  } catch {
    return 0;
  }
}

/** 設定で保存をやめたときなどに、まとめて消す。 */
export async function deleteAllSourcePhotos(): Promise<void> {
  if (unsupported()) return;
  try {
    const { Directory, Paths } = await import('expo-file-system');
    const dir = new Directory(Paths.document, DIR_NAME);
    if (dir.exists) dir.delete();
  } catch (e) {
    console.warn('元写真の一括削除に失敗しました', e);
  }
}
