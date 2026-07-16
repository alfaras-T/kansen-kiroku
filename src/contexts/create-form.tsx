import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { createContext, ReactNode, useContext, useRef, useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import {
  DEFAULT_PHOTO_OFFSET,
  DEFAULT_PHOTO_SCALE,
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

interface CreateFormContextValue {
  overlayRef: React.RefObject<View | null>;

  photoUri: string | null;
  photoAspectRatio: number | null;
  photoOffset: PhotoOffset;
  setPhotoOffset: (v: PhotoOffset) => void;
  photoScale: number;
  setPhotoScale: (v: number) => void;
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
  isDraw: boolean;
  setIsDraw: (v: boolean) => void;
  isExtra: boolean;
  setIsExtra: (v: boolean) => void;
  extraInning: string;
  setExtraInning: (v: string) => void;
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
  handleSaveToLibrary: () => Promise<void>;
  handleShare: () => Promise<void>;
  handleSaveRecord: () => Promise<void>;
}

const CreateFormContext = createContext<CreateFormContextValue | null>(null);

export function CreateFormProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const overlayRef = useRef<View>(null);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoAspectRatio, setPhotoAspectRatio] = useState<number | null>(null);
  const [photoOffset, setPhotoOffset] = useState<PhotoOffset>(DEFAULT_PHOTO_OFFSET);
  const [photoScale, setPhotoScale] = useState(DEFAULT_PHOTO_SCALE);
  const [ratio, setRatio] = useState<OutputRatio>('original');
  const [position, setPosition] = useState<OverlayPosition>('br');
  const [styleKey, setStyleKey] = useState<OverlayStyleKey>('amber');
  const [winHighlight, setWinHighlight] = useState(false);
  const [recordOnly, setRecordOnly] = useState(false);

  const [date, setDate] = useState(todayISO());
  const [stadium, setStadium] = useState<string>('東京ドーム');
  const [stadiumOther, setStadiumOther] = useState('');
  const [visitorCode, setVisitorCode] = useState<string>('T');
  const [homeCode, setHomeCode] = useState<string>('G');
  const [visitorTeamOther, setVisitorTeamOther] = useState('');
  const [homeTeamOther, setHomeTeamOther] = useState('');
  const [visitorScore, setVisitorScore] = useState('3');
  const [homeScore, setHomeScore] = useState('1');
  const [isDraw, setIsDraw] = useState(false);
  const [isExtra, setIsExtra] = useState(false);
  const [extraInning, setExtraInning] = useState('12');
  const [memo, setMemo] = useState('');

  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const stadiumName = stadium === OTHER_STADIUM ? stadiumOther.trim() : stadium;
  const visitorTeamName = visitorCode === OTHER_TEAM ? visitorTeamOther.trim() : visitorCode;
  const homeTeamName = homeCode === OTHER_TEAM ? homeTeamOther.trim() : homeCode;

  function resetPhotoAdjustment() {
    setPhotoOffset(DEFAULT_PHOTO_OFFSET);
    setPhotoScale(DEFAULT_PHOTO_SCALE);
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
      setPhotoUri(asset.uri);
      setPhotoAspectRatio(asset.width && asset.height ? asset.width / asset.height : null);
      resetPhotoAdjustment();
      // 写真が決まったら、調整・プレビュー専用ページへ自動的に遷移する
      router.push('/adjust');
    }
  }

  function clearPhoto() {
    setPhotoUri(null);
    setPhotoAspectRatio(null);
    resetPhotoAdjustment();
  }

  async function capture(): Promise<string | null> {
    if (!overlayRef.current) return null;
    try {
      return await captureRef(overlayRef, {
        format: 'png',
        quality: 1,
        result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile',
      });
    } catch {
      Alert.alert('エラー', '画像の生成に失敗しました');
      return null;
    }
  }

  function downloadOnWeb(dataUri: string) {
    const link = document.createElement('a');
    link.download = `kansen-kiroku_${date || 'photo'}.png`;
    link.href = dataUri;
    link.click();
  }

  async function handleSaveToLibrary() {
    setSaving(true);
    try {
      const uri = await capture();
      if (!uri) return;

      if (Platform.OS === 'web') {
        // Webではダウンロードとして保存
        downloadOnWeb(uri);
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
      Alert.alert('保存しました', '写真アプリに画像を保存しました');
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    setSaving(true);
    try {
      const uri = await capture();
      if (!uri) return;

      if (Platform.OS === 'web') {
        // Web Share API(ファイル共有)が使えれば共有、なければダウンロード
        try {
          const blob = await (await fetch(uri)).blob();
          const file = new File([blob], `kansen-kiroku_${date || 'photo'}.png`, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: '観戦きろく' });
            return;
          }
        } catch {
          // 共有キャンセルや未対応の場合はダウンロードにフォールバック
        }
        downloadOnWeb(uri);
        return;
      }

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('共有できません', 'この端末では共有機能が利用できません');
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '観戦きろくを共有' });
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
      isDraw,
      isExtra,
      extraInning,
      memo: memo.trim(),
    };
    await addHistoryEntry(entry);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  }

  const value: CreateFormContextValue = {
    overlayRef,
    photoUri,
    photoAspectRatio,
    photoOffset,
    setPhotoOffset,
    photoScale,
    setPhotoScale,
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
    isDraw,
    setIsDraw,
    isExtra,
    setIsExtra,
    extraInning,
    setExtraInning,
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
    handleSaveToLibrary,
    handleShare,
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
