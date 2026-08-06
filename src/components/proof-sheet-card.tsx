import { forwardRef } from "react";
import { Image, StyleSheet, View } from "react-native";

import { CardText } from "@/components/card-text";

import { Palette } from "@/constants/theme";
import { GameResult } from "@/storage/history";
import { OverlayPosition } from "@/constants/overlayStyles";
import { HistoryEntry } from "@/types/history";

/** 基準幅。文字サイズや余白はこの幅に対する比率で決める。 */
const BASE_WIDTH = 360;

export interface ProofSheetItem {
  entry: HistoryEntry;
  /** サムネイルの表示URI。無い記録もあるので null を許す。 */
  uri: string | null;
  /** サムネイルの縦横比(幅÷高さ)。測れなかった場合は null。 */
  aspect: number | null;
  /** マイチームから見た勝敗。出場していない試合は null。 */
  result: GameResult;
}

/**
 * 勝敗の印。日本の野球でよく使われる表記に倣う。
 * ○=勝ち ●=負け △=引き分け
 */
/**
 * 升目に貼るときの寸法と位置。
 *
 * 正方形のサムネイル(新しい保存分は正方形に切り出してある)はそのまま埋まる。
 * 縦長・横長のもの(切り出しを入れる前に保存された分)は、短い辺を升目に
 * 合わせたうえで、はみ出す分をテロップと反対側へ逃がす。
 *
 * どの隅を残すかは記録の telopPosition を見る。この項目を持たない
 * 古い記録は、既定値である右下として扱う。中央で切ると位置に関わらず
 * 隅が落ちるので、既定のまま使われた記録が救われるぶん確実に良くなる。
 */
function cellImageStyle(
  aspect: number | null,
  cell: number,
  position: OverlayPosition,
) {
  if (!aspect || Math.abs(aspect - 1) < 0.01) return styles.cellImage;
  const w = aspect >= 1 ? cell * aspect : cell;
  const h = aspect >= 1 ? cell : cell / aspect;
  return {
    position: "absolute" as const,
    width: w,
    height: h,
    left: position.endsWith("r") ? -(w - cell) : 0,
    top: position.startsWith("b") ? -(h - cell) : 0,
  };
}

const RESULT_MARK: Record<"win" | "lose" | "draw", string> = {
  win: "○",
  lose: "●",
  draw: "△",
};

export type ProofRatio = "auto" | "story" | "square";

/** 比率ごとの縦横比(幅÷高さ)。auto は中身の量で決まるので持たない。 */
const RATIO_ASPECT: Record<Exclude<ProofRatio, "auto">, number> = {
  story: 9 / 16,
  square: 1,
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

/**
 * 指定幅・指定比率でカードを描いたときの高さ。
 * auto は中身の量で決まり、story / square は比率で固定される。
 */
export function proofCardHeight(
  count: number,
  width: number,
  ratio: ProofRatio = "auto",
): number {
  if (ratio !== "auto") return width / RATIO_ASPECT[ratio];
  const s = width / BASE_WIDTH;
  const cols = proofColumns(count);
  const rows = Math.max(1, Math.ceil(count / cols));
  const pad = 22 * s;
  const gap = 5 * s;
  const cell = (width - pad * 2 - gap * (cols - 1)) / cols;
  // ヘッダー(年+ブランド) + 格子 + フッター(成績)
  return pad + 62 * s + rows * (cell + gap) + 52 * s;
}

/**
 * 高さが決まっている場合に、格子が収まる列数を求める。
 *
 * 比率を固定すると、枚数によっては既定の列数では縦にはみ出す。列を増やせば
 * 1コマは小さくなるが、全部が収まる。逆に余った場合は列を増やさない
 * (無理に引き伸ばすと、少ない枚数のときコマが不自然に大きくなる)。
 */
function fitColumns(count: number, width: number, gridHeight: number, pad: number, gap: number): number {
  let cols = proofColumns(count);
  for (let i = 0; i < 8; i += 1) {
    const rows = Math.max(1, Math.ceil(count / cols));
    const cell = (width - pad * 2 - gap * (cols - 1)) / cols;
    if (rows * (cell + gap) <= gridHeight || cols >= 10) break;
    cols += 1;
  }
  return cols;
}

/**
 * 日付(ISO)から「07.03」のような短い表記を作る。
 * 月をゼロ埋めするのは、履歴一覧と桁を揃えるため。格子に並べたときも
 * 幅が揃って読みやすい。
 */
function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  if (!m || !d) return "";
  return `${m}.${d}`;
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
    ratio?: ProofRatio;
    /** 各コマの画像デコード完了時に呼ばれる。書き出し前の待ち合わせ用。 */
    onCellLoad?: () => void;
  }
>(function ProofSheetCard(
  { year, items, width, colors, record, ratio = "auto", onCellLoad },
  ref,
) {
  const s = width / BASE_WIDTH;
  const pad = 22 * s;
  const gap = 5 * s;
  const height = proofCardHeight(items.length, width, ratio);
  // 格子に使える高さ(ヘッダーとフッターを除いた残り)
  const gridHeight = height - pad * 2 - 62 * s - 52 * s;
  const cols =
    ratio === "auto"
      ? proofColumns(items.length)
      : fitColumns(items.length, width, gridHeight, pad, gap);
  const cell = (width - pad * 2 - gap * (cols - 1)) / cols;

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

      <View
        style={[
          styles.grid,
          { gap, marginTop: 14 * s },
          ratio !== "auto" && { flex: 1, alignContent: "center" },
        ]}
      >
        {items.map(({ entry, uri, aspect, result }) => (
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
                style={cellImageStyle(
                  aspect,
                  cell,
                  entry.telopPosition ?? "br",
                )}
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
