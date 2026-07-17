import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { loadFavoriteTeam, loadOnboarded, saveFavoriteTeam, saveOnboarded } from '@/storage/preferences';

interface FavoriteTeamContextValue {
  /** テーマ用のお気に入りチームコード。'' は「特になし」(既存デザインのまま)。 */
  favoriteTeam: string;
  /** 初回起動時のチーム選択(オンボーディング)が完了済みかどうか。 */
  onboarded: boolean;
  /** 端末保存値の読み込みが完了したかどうか。 */
  loading: boolean;
  /** 設定画面などから、いつでもお気に入りチームを変更する。 */
  setFavoriteTeam: (code: string) => Promise<void>;
  /** オンボーディングでの初回選択を確定する。 */
  completeOnboarding: (code: string) => Promise<void>;
}

const FavoriteTeamContext = createContext<FavoriteTeamContextValue | null>(null);

export function FavoriteTeamProvider({ children }: { children: ReactNode }) {
  const [favoriteTeam, setFavoriteTeamState] = useState('');
  const [onboarded, setOnboardedState] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [team, done] = await Promise.all([loadFavoriteTeam(), loadOnboarded()]);
      setFavoriteTeamState(team);
      setOnboardedState(done);
      setLoading(false);
    })();
  }, []);

  const setFavoriteTeam = useCallback(async (code: string) => {
    setFavoriteTeamState(code);
    await saveFavoriteTeam(code);
  }, []);

  const completeOnboarding = useCallback(async (code: string) => {
    setFavoriteTeamState(code);
    setOnboardedState(true);
    await Promise.all([saveFavoriteTeam(code), saveOnboarded()]);
  }, []);

  return (
    <FavoriteTeamContext.Provider
      value={{ favoriteTeam, onboarded, loading, setFavoriteTeam, completeOnboarding }}>
      {children}
    </FavoriteTeamContext.Provider>
  );
}

export function useFavoriteTeam() {
  const ctx = useContext(FavoriteTeamContext);
  if (!ctx) throw new Error('useFavoriteTeam は FavoriteTeamProvider の内側で使ってください');
  return ctx;
}
