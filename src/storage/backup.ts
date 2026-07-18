import { Platform } from "react-native";

import { loadFavoriteTeam, saveFavoriteTeam } from "@/storage/preferences";
import {
  loadHistory,
  loadMyTeam,
  saveHistory,
  saveMyTeam,
} from "@/storage/history";
import { HistoryEntry } from "@/types/history";

// 観戦履歴・マイチーム・お気に入りチームをまとめてJSONとして書き出し/読み込みするための
// 手動バックアップ機能。サーバーには一切送信せず、端末上でファイル化するだけ。
const BACKUP_FORMAT = "kansen-kiroku-backup";
const BACKUP_VERSION = 1;

interface BackupPayload {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  history: HistoryEntry[];
  myTeam: string;
  favoriteTeam: string;
}

function backupFileName(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `kansen-kiroku-backup-${y}${m}${d}.json`;
}

async function buildBackupJson(): Promise<string> {
  const [history, myTeam, favoriteTeam] = await Promise.all([
    loadHistory(),
    loadMyTeam(),
    loadFavoriteTeam(),
  ]);
  const payload: BackupPayload = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    history,
    myTeam,
    favoriteTeam,
  };
  return JSON.stringify(payload, null, 2);
}

/** 観戦履歴・マイチーム・お気に入りチームをJSONファイルとして書き出す。 */
export async function exportBackup(): Promise<void> {
  const json = await buildBackupJson();
  const filename = backupFileName();

  if (Platform.OS === "web") {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  const [{ File, Paths }, Sharing] = await Promise.all([
    import("expo-file-system"),
    import("expo-sharing"),
  ]);
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(json);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/json",
      dialogTitle: "バックアップを保存",
    });
  }
}

function isHistoryEntry(v: unknown): v is HistoryEntry {
  if (!v || typeof v !== "object") return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.createdAt === "number" &&
    typeof e.date === "string" &&
    typeof e.stadium === "string" &&
    typeof e.visitorCode === "string" &&
    typeof e.homeCode === "string" &&
    typeof e.visitorScore === "string" &&
    typeof e.homeScore === "string"
  );
}

function parseBackupJson(raw: string): BackupPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("ファイルの形式を読み取れませんでした。");
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    (parsed as Record<string, unknown>).format !== BACKUP_FORMAT ||
    !Array.isArray((parsed as Record<string, unknown>).history) ||
    !((parsed as Record<string, unknown>).history as unknown[]).every(
      isHistoryEntry,
    )
  ) {
    throw new Error("Ball Filmsのバックアップファイルではないようです。");
  }
  const p = parsed as BackupPayload;
  return {
    format: BACKUP_FORMAT,
    version: p.version ?? 1,
    exportedAt: p.exportedAt ?? "",
    history: p.history,
    myTeam: typeof p.myTeam === "string" ? p.myTeam : "",
    favoriteTeam: typeof p.favoriteTeam === "string" ? p.favoriteTeam : "",
  };
}

/**
 * バックアップファイルを選択させ、内容を検証したうえで端末に復元する。
 * 復元前の確認は呼び出し側の責務とする。キャンセル時は null を返す。
 */
export async function importBackup(): Promise<BackupPayload | null> {
  const DocumentPicker = await import("expo-document-picker");
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/*"],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];

  let raw: string;
  if (Platform.OS === "web" && "file" in asset && asset.file) {
    raw = await asset.file.text();
  } else {
    const { File } = await import("expo-file-system");
    raw = await new File(asset.uri).text();
  }

  const payload = parseBackupJson(raw);
  await Promise.all([
    saveHistory(payload.history),
    saveMyTeam(payload.myTeam),
    saveFavoriteTeam(payload.favoriteTeam),
  ]);
  return payload;
}
