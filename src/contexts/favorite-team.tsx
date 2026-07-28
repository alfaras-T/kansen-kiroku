import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { loadMyTeam, saveMyTeam } from "@/storage/history";
import {
  loadFavoriteTeam,
  loadOnboarded,
  saveFavoriteTeam,
  saveOnboarded,
} from "@/storage/preferences";

interface FavoriteTeamContextValue {
  /** テーマ用のお気に入りチームコード。'' は「特になし」(既存デザインのまま)。 */
  favoriteTeam: string;
  /** 初回起動時のチーム選択(オンボーディング)が完了済みかどうか。 */
  onboarded: boolean;
  /** 端末保存値の読み込みが完了したかどうか。 */
  loading: boolean;
  /**
   * 成績集計用のマイチーム。'' は未設定。
   *
   * favoriteTeam(配色用)とは別物で、オンボーディング時に同じ値が入ったあとは
   * 独立して変更できる。テロップの球団カラーや勝率集計など「自分の試合か
   * どうか」の判定は、必ずこちらを基準にする。判定基準が2つあると
   * 「配色は巨人なのに勝率は阪神」といった食い違いが起きるため。
   */
  myTeam: string;
  /** 設定画面などから、いつでもお気に入りチームを変更する。 */
  setFavoriteTeam: (code: string) => Promise<void>;
  /** 履歴画面などから、成績集計用のマイチームを変更する。 */
  setMyTeam: (code: string) => Promise<void>;
  /**
   * 端末保存値を読み直す。バックアップ復元のように、この Provider を
   * 経由せずに保存値が書き換わった直後に呼ぶ。
   */
  reload: () => Promise<void>;
  /** オンボーディングでの初回選択を確定する。 */
  completeOnboarding: (code: string) => Promise<void>;
}

const FavoriteTeamContext = createContext<FavoriteTeamContextValue | null>(
  null,
);

export function FavoriteTeamProvider({ children }: { children: ReactNode }) {
  const [favoriteTeam, setFavoriteTeamState] = useState("");
  const [myTeam, setMyTeamState] = useState("");
  const [onboarded, setOnboardedState] = useState(false);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [team, done, mine] = await Promise.all([
      loadFavoriteTeam(),
      loadOnboarded(),
      loadMyTeam(),
    ]);
    setFavoriteTeamState(team);
    setOnboardedState(done);
    setMyTeamState(mine);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const setFavoriteTeam = useCallback(async (code: string) => {
    setFavoriteTeamState(code);
    await saveFavoriteTeam(code);
  }, []);

  const setMyTeam = useCallback(async (code: string) => {
    setMyTeamState(code);
    await saveMyTeam(code);
  }, []);

  const completeOnboarding = useCallback(async (code: string) => {
    setFavoriteTeamState(code);
    setOnboardedState(true);
    setMyTeamState(code);
    await Promise.all([
      saveFavoriteTeam(code),
      saveOnboarded(),
      // 観戦履歴タブの「マイチーム」(成績集計用)の初期値として、
      // オンボーディングで選んだお気に入りチームをそのまま反映する。
      // 以降、設定画面でお気に入りチームを変えてもここには影響しない(初回のみ)。
      saveMyTeam(code),
    ]);
  }, []);

  return (
    <FavoriteTeamContext.Provider
      value={{
        favoriteTeam,
        myTeam,
        onboarded,
        loading,
        setFavoriteTeam,
        setMyTeam,
        completeOnboarding,
        reload,
      }}
    >
      {children}
    </FavoriteTeamContext.Provider>
  );
}

export function useFavoriteTeam() {
  const ctx = useContext(FavoriteTeamContext);
  if (!ctx)
    throw new Error(
      "useFavoriteTeam は FavoriteTeamProvider の内側で使ってください",
    );
  return ctx;
}

/**
 * Provider の外側で呼ばれても例外を投げない版。
 * テーマ解決(useTheme)のように、Provider 外でも描画され得る箇所から使う。
 */
export function useFavoriteTeamOptional(): FavoriteTeamContextValue | null {
  return useContext(FavoriteTeamContext);
}
