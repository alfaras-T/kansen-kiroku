import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { useFonts } from 'expo-font';
import { DarkTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { CreateFormProvider } from '@/contexts/create-form';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BebasNeue_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  // ネイティブではフォント読み込み完了(または失敗)までスプラッシュを表示。
  // Webではフォントを待たずに描画する(読み込み後に自動適用される)。
  // フォント読み込みで画面全体をブロックすると、失敗時に永久に真っ白になるため。
  if (!fontsLoaded && !fontError && Platform.OS !== 'web') return null;

  return (
    <ThemeProvider value={DarkTheme}>
      <AnimatedSplashOverlay />
      <CreateFormProvider>
        <AppTabs />
      </CreateFormProvider>
    </ThemeProvider>
  );
}
