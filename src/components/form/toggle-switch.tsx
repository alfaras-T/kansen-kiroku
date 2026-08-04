import { Platform, Switch, type SwitchProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/**
 * オン・オフの切り替え。
 *
 * 標準の Switch はオン時の色を自由に指定できるが、球団カラーをそのまま
 * 当てると具合が悪い。12球団の中には土台の色との明度差が小さいものがあり、
 * オンなのかオフなのか一目で分からなくなる。カープの赤やマリーンズの黒の
 * ように、地に近い色ほど沈む。
 *
 * そこで色では判別させない。オンは明るい灰、オフは暗い灰にして、
 * **濃淡とつまみの左右位置**だけで状態を示す。どの球団でも同じ見え方に
 * なり、色覚に依存しないという利点もある。
 */
export function ToggleSwitch(props: SwitchProps) {
  const colors = useTheme();
  return (
    <Switch
      trackColor={{ true: 'rgba(255,255,255,0.42)', false: colors.border }}
      // iOSはオフ時の下地を別に持つため、trackColor.false だけでは効かない
      ios_backgroundColor={colors.border}
      thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
      {...props}
    />
  );
}
