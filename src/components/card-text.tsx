import { Text, type TextProps } from 'react-native';

/**
 * 書き出す画像の中で使う Text。
 *
 * React Native の Text は既定で端末の文字サイズ設定に追随する(allowFontScaling)。
 * 画面のUIならそれが正しいが、カードは「画面」ではなく「作品」なので、
 * 利用者の端末設定によって出来上がる画像が変わってしまうのは具合が悪い。
 *
 * 具体的には次の破綻が起きる。
 * - テロップの文字だけが拡大され、球場名が途中で切れる、スコア行が折り返す
 * - 「カード幅の88%に収める」「日付は1行」といった前提が崩れる
 * - フィルムシートのコマは計算で大きさを出しているため、中身がはみ出す
 * - 書き出し用ステージ(3000px)にも端末の拡大率が別途かかり、プレビューと食い違う
 *
 * そのため、カード内の文字は端末設定に追随させない。
 */
export function CardText({ allowFontScaling = false, ...rest }: TextProps) {
  return <Text allowFontScaling={allowFontScaling} {...rest} />;
}
