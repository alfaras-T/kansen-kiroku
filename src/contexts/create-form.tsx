import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { createContext, ReactNode, useContext, useRef, useState } from 'react';
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

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function blobUrlToDataUri(blobUrl: string): Promise<string> {
  const blob = await (await fetch(blobUrl)).blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
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
      // Web版のexpo-image-pickerはblob: URLを返すが、書き出しに使う
      // html-to-imageはDOMをSVGに直列化する都合上blob: URLを画像として
      // 正しく埋め込めず、書き出し画像から写真が消えてしまう
      // (テロップやグラデーション背景だけが残る)。data: URI(base64)に
      // 変換してから保持することで、埋め込み時の参照切れを避ける。
      let uri = asset.uri;
      if (Platform.OS === 'web' && asset.uri.startsWith('blob:')) {
        try {
          uri = await blobUrlToDataUri(asset.uri);
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

  async function capture(): Promise<string | null> {
    if (!exportRef.current) {
      Alert.alert('少し待ってから再度お試しください', 'プレビューの準備がまだ完了していません');
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
      Alert.alert('エラー', '画像の生成に失敗しました。もう一度お試しください');
      return null;
    }
  }

  function downloadOnWeb(dataUri: string) {
    const link = document.createElement('a');
    link.download = `kansen-kiroku_${date || 'photo'}.png`;
    link.href = dataUri;
    link.click();
  }

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
      file = new File([blob], `kansen-kiroku_${date || 'photo'}.png`, { type: 'image/png' });
    } catch (e) {
      console.warn('画像データの取得に失敗しました', e);
    }

    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: '観戦きろく' });
        return true;
      } catch (e) {
        // ユーザーによる意図的なキャンセル(AbortError)なら何もせず終える。
        // それ以外の予期しないエラーの場合のみダウンロードにフォールバックする。
        const isAbort = e instanceof Error && e.name === 'AbortError';
        if (isAbort) return false;
        console.warn('共有に失敗したためダウンロードにフォールバックします', e);
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
      const uri = await capture();
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
          await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '観戦きろくを共有' });
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
