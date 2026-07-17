import { resolveTheme } from "@/constants/teamThemes";
import { Palette } from "@/constants/theme";
import { useFavoriteTeamOptional } from "@/contexts/favorite-team";

/**
 * 現在のパレットを返す。
 * 設定(またはオンボーディング)で選ばれたお気に入りチームに応じて配色が切り替わり、
 * 「特になし」の場合は既定のダークテーマになる。
 */
export function useTheme(): Palette {
  const ctx = useFavoriteTeamOptional();
  return resolveTheme(ctx?.favoriteTeam ?? "");
}
