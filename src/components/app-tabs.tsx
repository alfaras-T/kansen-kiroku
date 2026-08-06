import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { ColorValue, StyleSheet, Text, View } from "react-native";

import { Rule, Type } from "@/constants/typography";
import { useTheme } from "@/hooks/use-theme";

/**
 * タブの見出し。
 *
 * 既定のタブバーは、アイコンとラベルが常に同じ重さで3つ並ぶ。どれが今いる
 * 場所なのかが色の差だけに委ねられていて弱い。ここでは選択中のものだけ
 * 上に短い線を引き、文字を締める。フィルムのパーフォレーション(送り穴)を
 * 思わせる小さな印で、居場所を線として示す。
 */
function TabLabel({
  label,
  focused,
  color,
}: {
  label: string;
  focused: boolean;
  color: ColorValue;
}) {
  return (
    <View style={styles.labelWrap}>
      <View
        style={[
          styles.marker,
          { backgroundColor: focused ? color : "transparent" },
        ]}
      />
      <Text
        style={[
          styles.label,
          { color, fontWeight: focused ? "700" : "500" },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function AppTabs() {
  const colors = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { flex: 1 },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          // 地と同じ色にして、面ではなく一本の罫線で仕切る。
          // 別色の帯を敷くと、画面の下に余計な「箱」が増える。
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: Rule.hairline,
          elevation: 0,
        },
        tabBarIconStyle: { marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "記録",
          tabBarIcon: ({ color }) => (
            <Ionicons name="camera-outline" color={color} size={21} />
          ),
          tabBarLabel: ({ color, focused }) => (
            <TabLabel label="記録" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "履歴",
          tabBarIcon: ({ color }) => (
            <Ionicons name="albums-outline" color={color} size={21} />
          ),
          tabBarLabel: ({ color, focused }) => (
            <TabLabel label="履歴" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          // 設定はタブに置かない。記録・履歴は「日々使うもの」だが、設定は
          // 一度決めたら滅多に触らない。同じ列に並べると、使用頻度の違う
          // ものが同じ重さで並ぶことになる。各画面の右上の歯車から開く。
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="adjust"
        options={{
          href: null, // タブバーには表示せず、遷移でのみ開く隠しルート
          tabBarStyle: { display: "none" }, // このページでは全画面表示のためタブバー自体を隠す
        }}
      />
      <Tabs.Screen
        name="privacy"
        options={{
          href: null, // タブバーには表示しない(設定画面のリンク/直接URLでのみ開く)
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  labelWrap: { alignItems: "center", gap: 4, paddingBottom: 2 },
  // 送り穴に見立てた短い印。現在地を色ではなく形でも示す
  marker: { width: 14, height: 2, borderRadius: 1 },
  // 見出しは日本語なので labelJa。Type.label(Montserrat)を当てると
  // Androidで豆腐になる。
  label: { ...Type.labelJa, fontSize: 10.5, letterSpacing: 0.6 },
});
