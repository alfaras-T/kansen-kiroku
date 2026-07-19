import { forwardRef } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { Palette } from "@/constants/theme";
import {
  formatShortDate,
  nicknameOf,
  YearSummary,
} from "@/utils/yearSummary";

export type WrapRatio = "story" | "square";

/** 基準幅。フォントサイズ等はこの幅に対する比率でスケールする。 */
const BASE_WIDTH = 360;

export function wrapCardHeight(ratio: WrapRatio, width: number): number {
  return ratio === "story" ? (width * 16) / 9 : width;
}

/** #RRGGBB の相対輝度(WCAG基準)。0(黒)〜1(白)。 */
function luminance(hex: string): number {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/**
 * 背景写真+暗いスクリムの上でも読めるよう、暗すぎる色は明るい既定色に
 * 差し替える。タイガースのように「明るい背景向けに黒に近い文字色」を
 * 持つチームでも、写真モードでは白抜けせず可視性を保つための保険。
 */
function readableOnPhoto(hex: string, fallback: string): string {
  return luminance(hex) < 0.35 ? fallback : hex;
}

/**
 * 年間観戦まとめカード。
 * 既定は写真なしの統計グラフィック(記録のみ保存のユーザーにも出せる)。
 * backgroundUri を渡すと、その写真を背景に敷き、暗いスクリムを重ねて
 * 文字の可読性を保つ。配色は現在のテーマ(お気に入りチーム)に追従する。
 */
export const WrapUpCard = forwardRef<View, {
  summary: YearSummary;
  myTeam: string;
  ratio: WrapRatio;
  width: number;
  colors: Palette;
  backgroundUri?: string | null;
  /** 背景写真のデコードが完了した時に呼ばれる(書き出し前の待ち合わせに使う) */
  onBackgroundLoad?: () => void;
}>(function WrapUpCard(
  { summary, myTeam, ratio, width, colors, backgroundUri, onBackgroundLoad },
  ref,
) {
  const s = width / BASE_WIDTH; // scale
  const height = wrapCardHeight(ratio, width);
  const story = ratio === "story";
  const photoMode = !!backgroundUri;

  // 写真モードでは、チームテーマの文字色が暗すぎる場合(タイガース等)に
  // 読める色へ差し替える。写真が無い通常モードはテーマの色をそのまま使う。
  const tc = photoMode ? readableOnPhoto(colors.text, "#FFFFFF") : colors.text;
  const tc2 = photoMode
    ? readableOnPhoto(colors.textSecondary, "rgba(255,255,255,0.78)")
    : colors.textSecondary;
  const ac = photoMode ? readableOnPhoto(colors.accent, "#FFD84D") : colors.accent;

  const rec = summary.record;
  const pct =
    summary.winRate !== null ? Math.round(summary.winRate * 100) : null;

  // 表示項目は固定4つ。データが無い項目はカードごと出さない。
  const rows: { label: string; value: string }[] = [];
  if (summary.topStadium) {
    rows.push({
      label: "今年のホーム",
      value: `${summary.topStadium.name} × ${summary.topStadium.count}`,
    });
  }
  if (summary.luckyStadium) {
    const st = summary.luckyStadium;
    rows.push({
      label: "今年のラッキー球場",
      value: `${st.name}（${st.win}勝${st.lose}敗${st.draw > 0 ? `${st.draw}分` : ""}）`,
    });
  }
  if (summary.stadiumsVisited >= 2) {
    rows.push({ label: "巡った球場", value: `${summary.stadiumsVisited} 球場` });
  }
  if (summary.maxWinStreak >= 2) {
    rows.push({ label: "現地最大連勝", value: `${summary.maxWinStreak} 連勝` });
  }
  // 表示は常に全4項目(スクエアも専用に詰めたレイアウトで全項目収める)
  const visibleRows = rows.slice(0, 4);

  return (
    <View
      ref={ref}
      collapsable={false}
      style={[
        styles.card,
        {
          width,
          height,
          backgroundColor: colors.background,
          borderColor: ac,
          borderWidth: Math.max(2, 3 * s),
        },
      ]}
    >
      {backgroundUri && (
        <>
          <Image
            source={{ uri: backgroundUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onLoad={onBackgroundLoad}
            onError={onBackgroundLoad}
          />
          {/* 文字の可読性を保つための暗いスクリム */}
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0,0,0,0.52)" },
            ]}
          />
        </>
      )}
      <View style={{ flex: 1, padding: (story ? 22 : 15) * s }}>
      {/* ヘッダー */}
      <View>
        <Text
          style={{
            color: ac,
            fontSize: (story ? 58 : 24) * s,
            fontWeight: "800",
            letterSpacing: 2 * s,
            lineHeight: (story ? 62 : 24) * s,
          }}
        >
          {summary.year}
        </Text>
        <Text
          style={{
            color: tc,
            fontSize: (story ? 17 : 13) * s,
            fontWeight: "700",
            marginTop: (story ? 2 : 1) * s,
          }}
        >
          観戦まとめ
        </Text>
      </View>

      {story && <View style={{ flexGrow: 1, maxHeight: 40 * s }} />}

      {/* メイン: 観戦数 */}
      <View style={{ marginTop: (story ? 12 : 6) * s }}>
        <Text style={{ color: tc2, fontSize: (story ? 12.5 : 10.5) * s }}>
          今年、球場にいた回数
        </Text>
        <View style={styles.bigRow}>
          <Text
            style={{
              color: ac,
              fontSize: (story ? 84 : 27) * s,
              fontWeight: "800",
              lineHeight: (story ? 90 : 31) * s,
            }}
          >
            {summary.games}
          </Text>
          <Text
            style={{
              color: tc,
              fontSize: (story ? 16 : 12) * s,
              fontWeight: "700",
              marginBottom: (story ? 12 : 5) * s,
              marginLeft: (story ? 6 : 4) * s,
            }}
          >
            回
          </Text>
        </View>
      </View>

      {/* マイチーム成績 */}
      {rec && (
        <View style={{ marginTop: (story ? 18 : 6) * s }}>
          <Text style={{ color: tc2, fontSize: (story ? 12.5 : 10.5) * s }}>
            {nicknameOf(myTeam)}とともに
          </Text>
          <Text
            style={{
              color: tc,
              fontSize: (story ? 24 : 14) * s,
              fontWeight: "800",
              marginTop: 2 * s,
            }}
          >
            {rec.win}勝{rec.lose}敗{rec.draw > 0 ? `${rec.draw}分` : ""}
            {pct !== null && (
              <Text style={{ color: ac }}>{`  勝率${pct}%`}</Text>
            )}
          </Text>
        </View>
      )}

      {story && <View style={{ flexGrow: 1, maxHeight: 40 * s }} />}

      {/* 明細行 */}
      <View style={{ marginTop: (story ? 14 : 6) * s, gap: (story ? 12 : 3) * s }}>
        {visibleRows.map((r) => (
          <View
            key={r.label}
            style={[
              styles.row,
              {
                borderColor: ac,
                backgroundColor: backgroundUri
                  ? "rgba(0,0,0,0.38)"
                  : colors.backgroundElement,
                borderRadius: (story ? 10 : 8) * s,
                paddingVertical: (story ? 10 : 3) * s,
                paddingHorizontal: (story ? 12 : 10) * s,
              },
            ]}
          >
            <Text
              style={{
                color: tc2,
                fontSize: (story ? 11.5 : 9.5) * s,
              }}
            >
              {r.label}
            </Text>
            <Text
              style={{
                color: tc,
                fontSize: (story ? 13.5 : 11.5) * s,
                fontWeight: "700",
                marginTop: 1 * s,
              }}
              numberOfLines={1}
            >
              {r.value}
            </Text>
          </View>
        ))}
      </View>

      {/* フッター(通常フローで最下部に置き、行との重なりを構造的に防ぐ) */}
      <View style={[styles.footer, { paddingTop: (story ? 14 : 6) * s }]}>
        {summary.firstDate && summary.lastDate && (
          <Text style={{ color: tc2, fontSize: (story ? 11.5 : 9.5) * s }}>
            {formatShortDate(summary.firstDate)} 〜 {formatShortDate(summary.lastDate)}
          </Text>
        )}
        <Text
          style={{
            color: ac,
            fontSize: (story ? 12.5 : 10.5) * s,
            fontWeight: "800",
            letterSpacing: 1 * s,
          }}
        >
          Ball Films
        </Text>
      </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { overflow: "hidden" },
  bigRow: { flexDirection: "row", alignItems: "flex-end" },
  row: { borderWidth: 1 },
  footer: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
