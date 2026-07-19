import { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";

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

/**
 * 年間観戦まとめカード。
 * 写真は使わず、観戦履歴の集計だけで構成する(記録のみ保存のユーザーにも出せる)。
 * 配色は現在のテーマ(お気に入りチーム)に追従する。
 */
export const WrapUpCard = forwardRef<View, {
  summary: YearSummary;
  myTeam: string;
  ratio: WrapRatio;
  width: number;
  colors: Palette;
}>(function WrapUpCard({ summary, myTeam, ratio, width, colors }, ref) {
  const s = width / BASE_WIDTH; // scale
  const height = wrapCardHeight(ratio, width);
  const story = ratio === "story";

  const rec = summary.record;
  const pct =
    summary.winRate !== null ? Math.round(summary.winRate * 100) : null;
  const best = summary.bestGame;

  const rows: { label: string; value: string }[] = [];
  // 優先度順に候補を積み、上から表示枠ぶんだけ使う
  if (summary.luckyStadium) {
    const st = summary.luckyStadium;
    rows.push({
      label: "今年のラッキー球場",
      value: `${st.name}（${st.win}勝${st.lose}敗${st.draw > 0 ? `${st.draw}分` : ""}）`,
    });
  }
  if (summary.topMonth && summary.topMonth.count >= 2) {
    rows.push({
      label: "一番通った月",
      value: `${summary.topMonth.month}月に ${summary.topMonth.count} 試合`,
    });
  }
  if (summary.maxWinStreak >= 2) {
    rows.push({ label: "現地連勝", value: `最大 ${summary.maxWinStreak} 連勝` });
  }
  if (summary.slugfest && summary.slugfest.total >= 10) {
    const g = summary.slugfest.entry;
    rows.push({
      label: "一番打ち合った夜",
      value: `${formatShortDate(g.date)}  ${g.visitorCode} ${g.visitorScore}–${g.homeScore} ${g.homeCode}`,
    });
  }
  if (summary.stadiumsVisited >= 3) {
    rows.push({ label: "巡った球場", value: `${summary.stadiumsVisited} 球場` });
  }
  // 上が埋まらないときの控え
  if (best) {
    rows.push({
      label: "忘れられない試合",
      value: `${formatShortDate(best.date)}  ${best.visitorCode} ${best.visitorScore}–${best.homeScore} ${best.homeCode}`,
    });
  }
  if (summary.oneRunGames > 0) {
    rows.push({ label: "1点差の熱戦", value: `${summary.oneRunGames} 試合` });
  }
  if (summary.topStadium) {
    rows.push({
      label: "今年のホーム",
      value: `${summary.topStadium.name} × ${summary.topStadium.count}`,
    });
  }
  // 重複値の行(打ち合った夜と忘れられない試合が同一試合 等)を除いたうえで、
  // ストーリー4行・スクエア2行に収める(フッターとの重なり防止)
  const seen = new Set<string>();
  const visibleRows = rows
    .filter((r) => {
      if (seen.has(r.value)) return false;
      seen.add(r.value);
      return true;
    })
    .slice(0, story ? 4 : 2);

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
          borderColor: colors.accent,
          borderWidth: Math.max(2, 3 * s),
          padding: 22 * s,
        },
      ]}
    >
      {/* ヘッダー */}
      <View>
        <Text
          style={{
            color: colors.accent,
            fontSize: (story ? 58 : 36) * s,
            fontWeight: "800",
            letterSpacing: 2 * s,
            lineHeight: (story ? 62 : 40) * s,
          }}
        >
          {summary.year}
        </Text>
        <Text
          style={{
            color: colors.text,
            fontSize: 17 * s,
            fontWeight: "700",
            marginTop: 2 * s,
          }}
        >
          観戦まとめ
        </Text>
      </View>

      {story && <View style={{ flexGrow: 1, maxHeight: 40 * s }} />}

      {/* メイン: 観戦数 */}
      <View style={{ marginTop: (story ? 12 : 14) * s }}>
        <Text style={{ color: colors.textSecondary, fontSize: 12.5 * s }}>
          今年、球場にいた回数
        </Text>
        <View style={styles.bigRow}>
          <Text
            style={{
              color: colors.accent,
              fontSize: (story ? 84 : 48) * s,
              fontWeight: "800",
              lineHeight: (story ? 90 : 54) * s,
            }}
          >
            {summary.games}
          </Text>
          <Text
            style={{
              color: colors.text,
              fontSize: 16 * s,
              fontWeight: "700",
              marginBottom: (story ? 12 : 8) * s,
              marginLeft: 6 * s,
            }}
          >
            回
          </Text>
        </View>
      </View>

      {/* マイチーム成績 */}
      {rec && (
        <View style={{ marginTop: (story ? 18 : 10) * s }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12.5 * s }}>
            {nicknameOf(myTeam)}とともに
          </Text>
          <Text
            style={{
              color: colors.text,
              fontSize: (story ? 24 : 18) * s,
              fontWeight: "800",
              marginTop: 2 * s,
            }}
          >
            {rec.win}勝{rec.lose}敗{rec.draw > 0 ? `${rec.draw}分` : ""}
            {pct !== null && (
              <Text style={{ color: colors.accent }}>{`  勝率${pct}%`}</Text>
            )}
          </Text>
        </View>
      )}

      {story && <View style={{ flexGrow: 1, maxHeight: 40 * s }} />}

      {/* 明細行 */}
      <View style={{ marginTop: (story ? 14 : 12) * s, gap: (story ? 12 : 7) * s }}>
        {visibleRows.map((r) => (
          <View
            key={r.label}
            style={[
              styles.row,
              {
                borderColor: colors.accent,
                backgroundColor: colors.backgroundElement,
                borderRadius: 10 * s,
                paddingVertical: (story ? 10 : 7) * s,
                paddingHorizontal: 12 * s,
              },
            ]}
          >
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 11.5 * s,
              }}
            >
              {r.label}
            </Text>
            <Text
              style={{
                color: colors.text,
                fontSize: 13.5 * s,
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
      <View style={[styles.footer, { paddingTop: 14 * s }]}>
        {summary.firstDate && summary.lastDate && (
          <Text style={{ color: colors.textSecondary, fontSize: 11.5 * s }}>
            {formatShortDate(summary.firstDate)} 〜 {formatShortDate(summary.lastDate)}
          </Text>
        )}
        <Text
          style={{
            color: colors.accent,
            fontSize: 12.5 * s,
            fontWeight: "800",
            letterSpacing: 1 * s,
          }}
        >
          Ball Films
        </Text>
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
