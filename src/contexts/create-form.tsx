import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import {
  DEFAULT_PHOTO_OFFSET,
  DEFAULT_PHOTO_SCALE,
  DEFAULT_TELOP_SCALE,
  OutputRatio,
  OverlayPosition,
  OverlayStyleKey,
  PhotoOffset,
} from '@/constants/overlayStyles';
import { OTHER_STADIUM } from '@/constants/stadiums';
import { OTHER_TEAM } from '@/constants/teams';
import { addHistoryEntry } from '@/storage/history';
import { HistoryEntry } from '@/types/history';
import { blobUrlToResizedDataUri } from '@/utils/image';

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}


interface CreateFormContextValue {
  overlayRef: React.RefObject<View | null>;
  /** 保存/共有時に実際にキャプチャする、画面表示とは別の固定解像度の書き出し専用View */
  exportRef: React.RefObject<View | null>;

  photoUri: string | null;
  photoAspectRatio: number | null;
  photoOffset: PhotoOffset;
  setPhotoOffset: (v: PhotoOffset) => void;
  photoScale: number;
  setPhotoScale: (v: number) => void;
  /** テロップ(日付・スコア・球場等のテキストブロック)の拡大率。1.0が等倍(=挿入時の元のサイズ)。 */
  telopScale: number;
  setTelopScale: (v: number) => void;
  ratio: OutputRatio;
  setRatio: (v: OutputRatio) => void;
  position: OverlayPosition;
  setPosition: (v: OverlayPosition) => void;
  styleKey: OverlayStyleKey;
  setStyleKey: (v: OverlayStyleKey) => void;
  winHighlight: boolean;
  setWinHighlight: (v: boolean) => void;
  recordOnly: boolean;
  setRecordOnly: (v: boolean) => void;
  /** 画像の保存/共有と同時に観戦履歴にも保存するか（調整画面のチェックボックス） */
  alsoSaveToHistory: boolean;
  setAlsoSaveToHistory: (v: boolean) => void;

  date: string;
  setDate: (v: string) => void;
  stadium: string;
  setStadium: (v: string) => void;
  stadiumOther: string;
  setStadiumOther: (v: string) => void;
  visitorCode: string;
  setVisitorCode: (v: string) => void;
  homeCode: string;
  setHomeCode: (v: string) => void;
  visitorTeamOther: string;
  setVisitorTeamOther: (v: string) => void;
  homeTeamOther: string;
  setHomeTeamOther: (v: string) => void;
  visitorScore: string;
  setVisitorScore: (v: string) => void;
  homeScore: string;
  setHomeScore: (v: string) => void;
  memo: string;
  setMemo: (v: string) => void;

  saving: boolean;
  savedFlash: boolean;

  stadiumName: string;
  visitorTeamName: string;
  homeTeamName: string;

  pickPhoto: () => Promise<void>;
  clearPhoto: () => void;
  resetPhotoAdjustment: () => void;
  handleSaveAndShare: () => Promise<void>;
  handleSaveRecord: () => Promise<void>;
}

const CreateFormContext = createContext<CreateFormContextValue | null>(null);

export function CreateFormProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const overlayRef = useRef<View>(null);
  const exportRef = useRef<View>(null);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoAspectRatio, setPhotoAspectRatio] = useState<number | null>(null);
  const [photoOffset, setPhotoOffset] = useState<PhotoOffset>(DEFAULT_PHOTO_OFFSET);
  const [photoScale, setPhotoScale] = useState(DEFAULT_PHOTO_SCALE);
  const [telopScale, setTelopScale] = useState(DEFAULT_TELOP_SCALE);
  const [ratio, setRatio] = useState<OutputRatio>('original');
  const [position, setPosition] = useState<OverlayPosition>('br');
  const [styleKey, setStyleKey] = useState<OverlayStyleKey>('classic');
  const [winHighlight, setWinHighlight] = useState(false);
  const [recordOnly, setRecordOnly] = useState(false);
  const [alsoSaveToHistory, setAlsoSaveToHistory] = useState(true);
  // 同じ下書き（同じ写真）で保存/共有を複数回押しても、観戦履歴には重複して記録しないようにする
  const recordSavedForDraft = useRef(false);

  const [date, setDate] = useState(todayISO());
  const [stadium, setStadium] = useState<string>('東京ドーム');
  const [stadiumOther, setStadiumOther] = useState('');
  const [visitorCode, setVisitorCode] = useState<string>('T');
  const [homeCode, setHomeCode] = useState<string>('G');
  const [visitorTeamOther, setVisitorTeamOther] = useState('');
  const [homeTeamOther, setHomeTeamOther] = useState('');
  const [visitorScore, setVisitorScore] = useState('3');
  const [homeScore, setHomeScore] = useState('1');
  const [memo, setMemo] = useState('');

  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const stadiumName = stadium === OTHER_STADIUM ? stadiumOther.trim() : stadium;
  const visitorTeamName = visitorCode === OTHER_TEAM ? visitorTeamOther.trim() : visitorCode;
  const homeTeamName = homeCode === OTHER_TEAM ? homeTeamOther.trim() : homeCode;

  function resetPhotoAdjustment() {
    setPhotoOffset(DEFAULT_PHOTO_OFFSET);
    setPhotoScale(DEFAULT_PHOTO_SCALE);
    setTelopScale(DEFAULT_TELOP_SCALE);
  }

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('権限が必要です', '写真ライブラリへのアクセスを許可してください');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      const asset = result.assets[0];
      // Web版のexpo-image-pickerはblob: URLを返すが、html-to-imageは
      // blob: URLを画像として正しく埋め込めない上、埋め込み用にdata URI化
      // する場合もカメラ写真そのままの解像度では大きすぎて失敗しうるため、
      // 縮小しつつdata URIへ変換してから保持する。
      let uri = asset.uri;
      if (Platform.OS === 'web' && asset.uri.startsWith('blob:')) {
        try {
          uri = await blobUrlToResizedDataUri(asset.uri);
        } catch (e) {
          console.warn('写真のdata URI変換に失敗しました。blob URLのまま使用します', e);
        }
      }
      setPhotoUri(uri);
      setPhotoAspectRatio(asset.width && asset.height ? asset.width / asset.height : null);
      resetPhotoAdjustment();
      recordSavedForDraft.current = false;
      // 写真が決まったら、調整・プレビュー専用ページへ自動的に遷移する
      router.push('/adjust');
    }
  }

  function clearPhoto() {
    setPhotoUri(null);
    setPhotoAspectRatio(null);
    resetPhotoAdjustment();
    recordSavedForDraft.current = false;
  }

  const captureInFlightRef = useRef<Promise<string | null> | null>(null);

  async function capture(options?: { silent?: boolean }): Promise<string | null> {
    // 裏側の事前生成と、ボタン押下時の生成が同時に走ると、同じ書き出し専用DOMを
    // 2つのhtml-to-image呼び出しが並行して処理することになり、一方の結果が
    // 壊れる(写真だけ抜け落ちる等)ことがある。進行中のキャプチャがあれば
    // 新規に始めずそれを使い回す。
    if (captureInFlightRef.current) {
      return captureInFlightRef.current;
    }
    const promise = captureInner(options);
    captureInFlightRef.current = promise;
    try {
      return await promise;
    } finally {
      captureInFlightRef.current = null;
    }
  }

  async function captureInner(options?: { silent?: boolean }): Promise<string | null> {
    if (!exportRef.current) {
      if (!options?.silent) {
        Alert.alert('少し待ってから再度お試しください', 'プレビューの準備がまだ完了していません');
      }
      return null;
    }
    try {
      // Web版はレイアウトファイル(_layout.tsx)がフォント読み込みを待たずに
      // 描画するため(理由は同ファイルのコメント参照)、テロップ用のカスタム
      // フォント(BebasNeue/Montserrat)がまだ読み込み中のタイミングで書き出すと、
      // ブラウザの代替フォントのままキャプチャされてしまうことがある。
      // document.fonts.readyを待つだけでは、そのフォントがまだ一度も
      // 「使用要求」されていない場合に効果が無いことがあるため、
      // 実際に使っているフォントを名指しでload()して確実に要求してから待つ。
      if (Platform.OS === 'web' && typeof document !== 'undefined' && document.fonts) {
        const requiredFonts = [
          '21px BebasNeue_400Regular',
          '34px BebasNeue_400Regular',
          '10.5px Montserrat_600SemiBold',
          '12px Montserrat_600SemiBold',
        ];
        try {
          await Promise.all(requiredFonts.map((f) => document.fonts.load(f)));
        } catch (fontLoadError) {
          console.warn('フォントの明示的読み込みに失敗しました', fontLoadError);
        }
        await document.fonts.ready;
      }
      // 書き出し専用View(画面上のプレビュー枠より高い固定解像度)がレイアウト・
      // 画像デコードを終える猶予として1フレーム待ってからキャプチャする。
      // これが無いと、特にWeb上で写真がまだ途中の状態のままキャプチャされ、
      // 継ぎ目や粗さの原因になることがある。
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

      if (Platform.OS === 'web') {
        // 上のRAF待ちだけでは、写真の<img>自体のデコードが実際に終わっている
        // 保証にはならない。html-to-imageはDOMを見たままSVGに直列化するだけで
        // 未デコードの画像を待ってはくれないため、書き出し専用View内の
        // すべての<img>についてdecode()完了を明示的に待ってからキャプチャする。
        const imgs = Array.from(
          (exportRef.current as unknown as HTMLElement).querySelectorAll('img')
        );
        await Promise.all(
          imgs.map((img) =>
            img.decode ? img.decode().catch(() => undefined) : Promise.resolve()
          )
        );

        // Web版はreact-native-view-shotではなくhtml-to-imageを使う。
        // captureRef(react-native-view-shot)はWeb上ではhtml2canvasベースで、
        // DOMのレイアウト・グラデーション・フォントをJSで一から再実装して
        // canvasに描き直すため、実際の画面プレビュー(ブラウザ自身が描画したもの)
        // と細部が一致しない(継ぎ目・グラデーションのズレ・フォールバックフォント
        // 化など)。html-to-imageはSVGのforeignObjectを経由し、ブラウザ自身の
        // 描画エンジンにレンダリングさせてから画像化するため、画面上のプレビューに
        // 忠実な結果が得られる。
        const { toPng } = await import('html-to-image');
        return await toPng(exportRef.current as unknown as HTMLElement, {
          pixelRatio: 1,
        });
      }

      return await captureRef(exportRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
    } catch (e) {
      console.warn('画像の生成に失敗しました', e);
      if (!options?.silent) {
        Alert.alert('エラー', '画像の生成に失敗しました。もう一度お試しください');
      }
      return null;
    }
  }

  function downloadOnWeb(dataUri: string) {
    const link = document.createElement('a');
    link.download = `ball-films_${date || 'photo'}.png`;
    link.href = dataUri;
    link.click();
  }

  // Web版専用: あらかじめ裏側で画像を生成しておき、共有ボタンを押した瞬間は
  // 既にできあがった画像をすぐ使えるようにする。
  //
  // navigator.share()はブラウザ(特にSafari)の制約で、ボタンを押してから
  // 呼び出すまでの間隔が空きすぎると「ユーザー操作起点でない」とみなされ
  // 拒否されることがある。画像生成(フォント読み込み+html-to-imageの
  // レンダリング)には無視できない時間がかかるため、ボタンを押してから
  // 生成していたのでは、共有画面が開けず保存だけのフォールバックになる
  // ことがあった。
  //
  // 表示内容(写真・調整・スコア等)が変わるたびに少し待ってから裏で
  // 再生成し、preparedUriに保持しておく。ボタンが押された時点で
  // preparedUriが最新であればそれをそのまま使い、無ければ(生成中/未生成)
  // 従来通りその場でcaptureする。
  const [preparedUri, setPreparedUri] = useState<string | null>(null);
  const captureTokenRef = useRef(0);

  useEffect(() => {
    if (Platform.OS !== 'web' || !photoUri) {
      setPreparedUri(null);
      return;
    }
    setPreparedUri(null);
    const token = ++captureTokenRef.current;
    const timer = setTimeout(async () => {
      if (!exportRef.current) return;
      try {
        const uri = await capture({ silent: true });
        if (uri && captureTokenRef.current === token) {
          setPreparedUri(uri);
        }
      } catch (e) {
        console.warn('事前生成に失敗しました(共有時に改めて生成します)', e);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 600);
    return () => clearTimeout(timer);
  }, [
    photoUri,
    photoAspectRatio,
    ratio,
    position,
    styleKey,
    visitorTeamName,
    homeTeamName,
    visitorScore,
    homeScore,
    date,
    stadiumName,
    memo,
    winHighlight,
    photoOffset,
    photoScale,
    telopScale,
  ]);

  /**
   * Web専用: 可能ならWeb Share API(ファイル共有)を使う。ブラウザやOSの制約上、
   * JavaScriptから直接「写真ライブラリ」に書き込むことはできないため、
   * 共有シートの「画像を保存」を経由するのが最も確実にライブラリへ届く方法。
   * 共有自体が使えない環境でのみダウンロードにフォールバックする。
   * ユーザーが共有シートを自分でキャンセルした場合は、勝手にダウンロードを
   * 始めたりせずそのまま終える。
   * @returns 実際に共有/ダウンロードが完了したか（キャンセル時はfalse）
   */
  async function shareOrDownloadOnWeb(uri: string): Promise<boolean> {
    let file: File | null = null;
    try {
      const blob = await (await fetch(uri)).blob();
      file = new File([blob], `ball-films_${date || 'photo'}.png`, { type: 'image/png' });
    } catch (e) {
      console.warn('画像データの取得に失敗しました', e);
    }

    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Ball Films' });
        return true;
      } catch (e) {
        // ユーザーによる意図的なキャンセル(AbortError)なら何もせず終える。
        // それ以外の予期しないエラーの場合のみダウンロードにフォールバックする。
        const isAbort = e instanceof Error && e.name === 'AbortError';
        if (isAbort) return false;
        console.warn('共有に失敗したためダウンロードにフォールバックします', e);
        // ブラウザ(特にSafari)はnavigator.share()をユーザー操作の直後でないと
        // 許可しないことがある。画像生成に時間がかかり、その間にタップから
        // 時間が経ちすぎるとこのエラーになり得る。ダウンロードにフォールバック
        // したことだけは伝え、「共有画面が出ない=何も起きていない」という
        // 誤解を防ぐ。
        downloadOnWeb(uri);
        Alert.alert(
          '共有画面を開けなかったため保存しました',
          '端末のダウンロードフォルダに画像を保存しました。'
        );
        return true;
      }
    }

    // Web Share API自体が使えない/失敗した場合はダウンロードする
    downloadOnWeb(uri);
    return true;
  }

  /**
   * 保存と共有をひとつの操作にまとめたもの。
   * - Web: Web Share API(使えれば「画像を保存」を含む共有シート)、
   *   使えない場合はダウンロードにフォールバック
   * - ネイティブ: まず確実に写真アプリのライブラリへ保存し、続けてOSの共有シートも
   *   開く(他のアプリへすぐ送れるように)。共有シート表示に失敗しても保存自体は
   *   既に完了しているので、それを無効なエラーとして扱わない。
   */
  async function handleSaveAndShare() {
    setSaving(true);
    try {
      const uri = Platform.OS === 'web' && preparedUri ? preparedUri : await capture();
      if (!uri) return;

      if (Platform.OS === 'web') {
        const completed = await shareOrDownloadOnWeb(uri);
        if (completed) await maybeSaveRecordAfterExport();
        return;
      }

      // ネイティブのみ: expo-media-libraryを動的に読み込む(Webでは読み込むだけでエラーになるため)
      const MediaLibrary = await import('expo-media-library');
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('権限が必要です', '写真アプリへの保存を許可してください');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      await maybeSaveRecordAfterExport();

      // 保存は完了済み。続けて共有シートを開く（失敗しても保存自体は成功しているので握りつぶす）
      try {
        const available = await Sharing.isAvailableAsync();
        if (available) {
          await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Ball Filmsを共有' });
        }
      } catch (e) {
        console.warn('共有シートの表示に失敗しました（保存は完了済み）', e);
      }
    } catch (e) {
      console.warn('保存に失敗しました', e);
      Alert.alert('保存に失敗しました', 'もう一度お試しください');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveRecord() {
    const entry: HistoryEntry = {
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
      date,
      stadium: stadiumName,
      visitorCode: visitorTeamName,
      homeCode: homeTeamName,
      visitorScore: visitorScore || '0',
      homeScore: homeScore || '0',
      memo: memo.trim(),
    };
    await addHistoryEntry(entry);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  }

  /**
   * 画像の保存/共有が成功した際に呼ぶ。「観戦履歴にも保存する」がONの場合のみ、
   * 同じ下書き（同じ写真）につき1回だけ観戦履歴に記録する（重複防止）。
   */
  async function maybeSaveRecordAfterExport() {
    if (!alsoSaveToHistory || recordSavedForDraft.current) return;
    recordSavedForDraft.current = true;
    await handleSaveRecord();
  }

  const value: CreateFormContextValue = {
    overlayRef,
    exportRef,
    photoUri,
    photoAspectRatio,
    photoOffset,
    setPhotoOffset,
    photoScale,
    setPhotoScale,
    telopScale,
    setTelopScale,
    ratio,
    setRatio,
    position,
    setPosition,
    styleKey,
    setStyleKey,
    winHighlight,
    setWinHighlight,
    recordOnly,
    setRecordOnly,
    alsoSaveToHistory,
    setAlsoSaveToHistory,
    date,
    setDate,
    stadium,
    setStadium,
    stadiumOther,
    setStadiumOther,
    visitorCode,
    setVisitorCode,
    homeCode,
    setHomeCode,
    visitorTeamOther,
    setVisitorTeamOther,
    homeTeamOther,
    setHomeTeamOther,
    visitorScore,
    setVisitorScore,
    homeScore,
    setHomeScore,
    memo,
    setMemo,
    saving,
    savedFlash,
    stadiumName,
    visitorTeamName,
    homeTeamName,
    pickPhoto,
    clearPhoto,
    resetPhotoAdjustment,
    handleSaveAndShare,
    handleSaveRecord,
  };

  return <CreateFormContext.Provider value={value}>{children}</CreateFormContext.Provider>;
}

export function useCreateForm(): CreateFormContextValue {
  const ctx = useContext(CreateFormContext);
  if (!ctx) {
    throw new Error('useCreateForm must be used within a CreateFormProvider');
  }
  return ctx;
}
