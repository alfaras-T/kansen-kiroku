import AsyncStorage from '@react-native-async-storage/async-storage';

// アプリの見た目(テーマ)用の「お気に入りチーム」。
// 観戦履歴タブの「マイチーム」(成績集計用)とは別の設定として保持する。
// すべてこの端末内(AsyncStorage)にのみ保存する。
const FAVORITE_TEAM_KEY = 'kansen-kiroku:favoriteTeam';
const ONBOARDED_KEY = 'kansen-kiroku:onboarded';

export async function loadFavoriteTeam(): Promise<string> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITE_TEAM_KEY);
    return raw ?? '';
  } catch (e) {
    console.warn('お気に入りチームの読み込みに失敗しました', e);
    return '';
  }
}

export async function saveFavoriteTeam(code: string): Promise<void> {
  try {
    await AsyncStorage.setItem(FAVORITE_TEAM_KEY, code);
  } catch (e) {
    console.warn('お気に入りチームの保存に失敗しました', e);
  }
}

export async function loadOnboarded(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(ONBOARDED_KEY);
    return raw === '1';
  } catch (e) {
    console.warn('初回起動フラグの読み込みに失敗しました', e);
    return false;
  }
}

export async function saveOnboarded(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDED_KEY, '1');
  } catch (e) {
    console.warn('初回起動フラグの保存に失敗しました', e);
  }
}

// バックアップを最後に案内した(または実際に取った)時点の記録件数。
// 端末内保存のみという方針の裏返しで、アプリを消すと記録は戻らない。
// かといって毎回促すと煩わしいので、件数が一定量増えたときだけ出す。
const BACKUP_NUDGE_KEY = 'kansen-kiroku:backupNudgeAt';

export async function loadBackupNudgeAt(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(BACKUP_NUDGE_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch (e) {
    console.warn('バックアップ案内の読み込みに失敗しました', e);
    return 0;
  }
}

export async function saveBackupNudgeAt(count: number): Promise<void> {
  try {
    await AsyncStorage.setItem(BACKUP_NUDGE_KEY, String(count));
  } catch (e) {
    console.warn('バックアップ案内の保存に失敗しました', e);
  }
}
