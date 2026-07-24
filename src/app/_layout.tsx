import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { useFonts } from 'expo-font';
import { DarkTheme, ThemeProvider, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { CreateFormProvider } from '@/contexts/create-form';
import { FavoriteTeamProvider, useFavoriteTeam } from '@/contexts/favorite-team';
import PrivacyScreen from './privacy';
import SupportScreen from './support';

SplashScreen.preventAutoHideAsync();

// フォント読み込みを待つ上限。これを超えたらシステムフォントで描画を続行する。
const FONT_WAIT_TIMEOUT_MS = 2000;

export default function TabLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BebasNeue_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });
  const [fontWaitElapsed, setFontWaitElapsed] = useState(false);
  const pathname = usePathname();
  const isLegalPage = pathname === '/privacy' || pathname === '/support';

  useEffect(() => {
    const timer = setTimeout(() => setFontWaitElapsed(true), FONT_WAIT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  // ネイティブではフォント読み込み完了(または失敗)までスプラッシュを表示。
  // Webではフォントを待たずに描画する(読み込み後に自動適用される)。
  // フォント読み込みで画面全体をブロックすると、失敗時に永久に真っ白になるため。
  //
  // さらに、読み込みが「完了も失敗もしない」まま止まるとネイティブでは
  // スプラッシュ画面から永久に進まなくなる。これを防ぐため、一定時間で
  // 待機を打ち切って描画を続行する(フォントは読み込み後に自動適用される)。
  if (!fontsLoaded && !fontError && !fontWaitElapsed && Platform.OS !== 'web') return null;

  return (
    <ThemeProvider value={DarkTheme}>
      <AnimatedSplashOverlay skipAnimation={isLegalPage} />
      <FavoriteTeamProvider>
        <CreateFormProvider>
          <RootGate />
        </CreateFormProvider>
      </FavoriteTeamProvider>
    </ThemeProvider>
  );
}

// 初回起動時はオンボーディング(お気に入りチーム選択)を完了するまでタブ画面を表示しない。
// ただし /privacy と /support は、ストア審査担当者や初めての訪問者が
// アプリの状態(オンボーディング完了・端末内データ)に関わらずURLを直接開いて
// 読めなければならないため、オンボーディングの完了を待たずに常に表示する。
function RootGate() {
  const pathname = usePathname();
  const { loading, onboarded } = useFavoriteTeam();

  if (pathname === '/privacy') return <PrivacyScreen />;
  if (pathname === '/support') return <SupportScreen />;

  if (loading) return null;
  if (!onboarded) return <OnboardingScreen />;
  return <AppTabs />;
}
