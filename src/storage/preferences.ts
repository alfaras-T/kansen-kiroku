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
