import { TextStyle } from 'react-native';

/**
 * 文字の設計。
 *
 * このアプリは Bebas Neue と Montserrat を読み込んでいるが、これまで
 * テロップの中でしか使っておらず、UIは端末の標準フォントのままだった。
 * 出力物には固有の書体があるのに、それを作る画面には無いという状態だった。
 *
 * ただし両書体とも日本語のグリフを持たない。日本語に当てると豆腐になる。
 * そこで **文字種で使い分ける** 方式にしている。この制約は不便ではなく、
 * むしろ「数字と英字は書体で語り、日本語は素直に読ませる」という
 * 一貫した規則を与えてくれる。
 *
 *   数字・英字  → Bebas Neue（凝縮した大文字。スコアボードや
 *                 フィルムのフレーム番号の質感）
 *   小さな英字  → Montserrat（ラベル、見出しの上に置く小見出し）
 *   日本語      → 端末標準（可読性を優先。字間と太さで階層を作る）
 */

const BEBAS = 'BebasNeue_400Regular';
const MONT_MED = 'Montserrat_500Medium';
const MONT_SEMI = 'Montserrat_600SemiBold';

export const Type = {
  /** 数字・英字の大見出し。年号、スコア、フレーム番号 */
  display: (size: number): TextStyle => ({
    fontFamily: BEBAS,
    fontSize: size,
    // Bebas は詰まって見えるので、少しだけ開ける
    letterSpacing: size * 0.04,
    // Bebas の実測高は指定サイズより小さいため、行高は控えめでよい
    lineHeight: size * 1.0,
  }),

  /** 見出しの上に置く小さな英字。セクションの所属を示す */
  eyebrow: {
    fontFamily: MONT_SEMI,
    fontSize: 10,
    letterSpacing: 1.8,
    lineHeight: 12,
  } as TextStyle,

  /** 英数字のラベル。数値の単位や補助表示 */
  label: {
    fontFamily: MONT_MED,
    fontSize: 11,
    letterSpacing: 0.8,
  } as TextStyle,

  /**
   * 日本語のラベル。label と同じ大きさだが、書体は端末標準に任せる。
   *
   * Bebas も Montserrat も日本語のグリフを持たない。iOSはCoreTextが
   * 自動で代替書体に落としてくれるので気づかないが、Androidは代替に
   * 落ちず豆腐(□)になる。「日本語には英字専用書体を当てない」を
   * 規則として持たせ、当たっている箇所を作らないようにする。
   */
  labelJa: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.8,
  } as TextStyle,

  /** 日本語の見出し。太さで立てる */
  headingJa: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0.2,
    lineHeight: 26,
  } as TextStyle,

  /** 日本語の本文 */
  bodyJa: {
    fontSize: 14.5,
    fontWeight: '400',
    lineHeight: 22,
  } as TextStyle,

  /** 日本語の補助文。本文より一段落とす */
  captionJa: {
    fontSize: 12.5,
    fontWeight: '400',
    lineHeight: 19,
  } as TextStyle,

  /** 操作の名前。ボタンや選択肢 */
  actionJa: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  } as TextStyle,
} as const;

/**
 * 余白。均等な倍数ではなく、役割ごとに決めた値。
 *
 * 4の倍数を機械的に並べると、どの隙間も同じ意味に見えてしまう。
 * 「行の間」と「節の間」と「画面の縁」は別の役割なので、別の値を持たせる。
 */
export const Space = {
  /** 密接に関係する要素の間（ラベルと値など） */
  tight: 6,
  /** 行の間 */
  row: 14,
  /** 節と節の間。行間よりはっきり広く取り、切れ目を作る */
  section: 34,
  /** 画面の左右の縁 */
  edge: 20,
} as const;

/** 罫線。面ではなく線で区切る */
export const Rule = {
  hairline: 1,
} as const;
