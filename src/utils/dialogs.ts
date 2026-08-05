import { Alert, Linking, Platform } from "react-native";

// react-native-web の Alert.alert は現状 no-op (何も起きない) なので、
// Web でも確実にユーザーへ確認・通知できるよう window.confirm / window.alert にフォールバックする。

export function confirmAsync(
  title: string,
  message?: string,
  confirmLabel = "OK",
): Promise<boolean> {
  if (Platform.OS === "web") {
    const text = message ? `${title}\n\n${message}` : title;
    return Promise.resolve(window.confirm(text));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "キャンセル", style: "cancel", onPress: () => resolve(false) },
      { text: confirmLabel, style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

export function notify(title: string, message?: string): void {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

/**
 * 端末のメールアプリを、宛先・件名・本文を入れた状態で開く。
 * アプリ自身はデータを送信しない（送信はユーザーのメールアプリが行う）。
 * メールアプリが開けなかった場合は false を返す。
 */
export async function openMailComposer(params: {
  to: string;
  subject: string;
  body: string;
}): Promise<boolean> {
  const { to, subject, body } = params;
  const url = `mailto:${to}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
  try {
    if (Platform.OS === "web") {
      window.location.href = url;
      return true;
    }
    // Linking は上で静的に読み込む。ここで await import("react-native") を
    // 使っていたが、名前空間を作る過程で react-native の index が持つ
    // getter を全て評価してしまう。読み込む必要のないものまで巻き込むうえ、
    // 同じファイルの先頭で既に静的importしている以上、そもそも不要だった。
    await Linking.openURL(url);
    return true;
  } catch (e) {
    console.warn("メールアプリを開けませんでした", e);
    return false;
  }
}
