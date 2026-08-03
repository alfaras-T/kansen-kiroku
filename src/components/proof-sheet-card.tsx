import { forwardRef } from "react";
import { Image, StyleSheet, View } from "react-native";

import { CardText } from "@/components/card-text";

import { Palette } from "@/constants/theme";
import { GameResult } from "@/storage/history";
import { HistoryEntry } from "@/types/history";

/** 基準幅。文字サイズや余白はこの幅に対する比率で決める。 */
const BASE_WIDTH = 360;

export interface ProofSheetItem {
  entry: HistoryEntry;
  /** サムネイルの表示URI。無い記録もあるので null を許す。 */
  uri: string | null;
  /** マイチームから見た勝敗。出場していない試合は null。 */
  result: GameResult;
}

/**
 * 勝敗の印。日本の野球でよく使われる表記に倣う。
 * ○=勝ち ●=負け △=引き分け
 */
const RESULT_MARK: Record<"win" | "lose" | "draw", string> = {
  win: "○",
  lose: "●",
  draw: "△",
};

/**
 * 枚数に応じて列数を決める。
 *
 * 実物のベタ焼きも、フィルムの本数に応じて並びが変わる。少ない枚数で
 * 6列にすると1コマが小さくなりすぎ、多い枚数で3列にすると縦に間延びする。
 */
export function proofColumns(count: number): number {
  if (count <= 4) return 2;
  if (count <= 9) return 3;
  if (count <= 20) return 4;
  if (count <= 35) return 5;
  return 6;
}

/** 指定幅でカードを描いたときの高さ。書き出しサイズの算出に使う。 */
export function proofCardHeight(count: number, width: number): number {
  const s = width / BASE_WIDTH;
  const cols = proofColumns(count);
  const rows = Math.max(1, Math.ceil(count / cols));
  const pad = 22 * s;
  const gap = 5 * s;
  const cell = (width - pad * 2 - gap * (cols - 1)) / cols;
  // ヘッダー(年+ブランド) + 格子 + フッター(成績)
  return pad + 62 * s + rows * (cell + gap) + 52 * s;
}

/** 日付(ISO)から「4.02」のような短い表記を作る */
function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  if (!m || !d) return "";
  return `${Number(m)}.${d}`;
}

/**
 * ベタ焼き（その年の観戦を1枚に並べたもの）。
 *
 * 写真のある記録はサムネイルを、無い記録は日付とスコアだけのコマを置く。
 * 歯抜けにせず全試合を並べるのは、枚数そのものが「その年どれだけ通ったか」
 * を語るため。写真が無いコマも記録としては等価に扱う。
 */
export const ProofSheetCard = forwardRef<
  View,
  {
    year: string;
    items: ProofSheetItem[];
    width: number;
    colors: Palette;
    record: { win: number; lose: number; draw: number } | null;
    /** 各コマの画像デコード完了時に呼ばれる。書き出し前の待ち合わせ用。 */
    onCellLoad?: () => void;
  }
>(function ProofSheetCard(
  { year, items, width, colors, record, onCellLoad },
  ref,
) {
  const s = width / BASE_WIDTH;
  const cols = proofColumns(items.length);
  const pad = 22 * s;
  const gap = 5 * s;
  const cell = (width - pad * 2 - gap * (cols - 1)) / cols;
  const height = proofCardHeight(items.length, width);

  return (
    <View
      ref={ref}
      collapsable={false}
      style={[
        styles.card,
        {
          width,
          height,
          padding: pad,
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={styles.header}>
        <CardText
          style={[
            styles.year,
            { fontSize: 34 * s, lineHeight: 36 * s, color: colors.text },
          ]}
        >
          {year}
        </CardText>
        <CardText
          style={[
            styles.brand,
            {
              fontSize: 9 * s,
              letterSpacing: 3 * s,
              color: colors.accent,
            },
          ]}
        >
          BALL FILMS
        </CardText>
      </View>

      <View style={[styles.grid, { gap, marginTop: 14 * s }]}>
        {items.map(({ entry, uri, result }) => (
          <View
            key={entry.id}
            style={[
              styles.cell,
              {
                width: cell,
                height: cell,
                backgroundColor: colors.backgroundElement,
                borderRadius: 2 * s,
              },
            ]}
          >
            {uri ? (
              <Image
                source={{ uri }}
                style={styles.cellImage}
                resizeMode="cover"
                onLoad={onCellLoad}
                onError={onCellLoad}
              />
            ) : (
              // 写真が無い記録。日付とスコアだけの静かなコマにする。
              <View style={styles.cellFallback}>
                <CardText
                  style={{
                    fontSize: 9 * s,
                    color: colors.textSecondary,
                  }}
                  numberOfLines={1}
                >
                  {shortDate(entry.date)}
                </CardText>
                <CardText
                  style={{
                    fontSize: 11 * s,
                    fontWeight: "700",
                    color: colors.text,
                  }}
                  numberOfLines={1}
                >
                  {entry.visitorScore}-{entry.homeScore}
                </CardText>
              </View>
            )}

            {/*
              勝敗の印。写真の有無に関わらず同じ位置に置くことで、
              格子を眺めたときに勝ち負けの並びが読み取れる。
              写真の上でも読めるよう、暗い下地を敷いている。
            */}
            {result && (
              <View
                style={[
                  styles.mark,
                  {
                    top: 2 * s,
                    right: 2 * s,
                    paddingHorizontal: 3 * s,
                    paddingVertical: 0.5 * s,
                    borderRadius: 2 * s,
                  },
                ]}
              >
                <CardText
                  style={{
                    fontSize: 9 * s,
                    lineHeight: 12 * s,
                    fontWeight: "700",
                    color: result === "lose" ? colors.textSecondary : "#FFFFFF",
                  }}
                >
                  {RESULT_MARK[result]}
                </CardText>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={[styles.footer, { marginTop: 16 * s }]}>
        <CardText style={{ fontSize: 12 * s, color: colors.textSecondary }}>
          {items.length}試合
        </CardText>
        {record && (
          /*
            コマに付けた印と同じ記号で内訳を出す。
            「24試合」と「15勝4敗1分」を並べると合計が合わず、残りの試合が
            どこへ行ったのか分からない。印のないコマ(マイチームが出ていない
            試合)があることを、記号の一致で読み取れるようにしている。
          */
          <CardText
            style={{
              fontSize: 12 * s,
              fontWeight: "700",
              color: colors.text,
            }}
          >
            {RESULT_MARK.win}
            {record.win}　{RESULT_MARK.lose}
            {record.lose}　{RESULT_MARK.draw}
            {record.draw}
          </CardText>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { overflow: "hidden" },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  year: { fontWeight: "700" },
  brand: { fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { overflow: "hidden" },
  cellImage: { width: "100%", height: "100%" },
  mark: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  cellFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
});
