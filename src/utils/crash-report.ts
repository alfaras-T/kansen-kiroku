import { Alert, Platform } from "react-native";

/**
 * JSの未捕捉エラーを画面に出す。
 *
 * リリースビルドでは、JS側で拾われなかった例外がそのまま
 * RCTExceptionsManager.reportFatal に渡り、プロセスが abort する。
 * このときクラッシュログ(.ips)にはネイティブのスタックしか残らず、
 * 肝心の「何が undefined だったのか」は一切書かれない。
 * 実機でしか出ない不具合を追うときに、これでは手掛かりがゼロになる。
 *
 * 致命的な場合だけ既定の処理を引き取って、エラーの本文を表示する。
 * アプリの状態は壊れているかもしれないが、黙って消えるよりは、
 * 何が起きたかが分かって続行できる方がよい。
 * 致命的でないものは今まで通り既定の処理へ渡す。
 */

type GlobalErrorHandler = (error: unknown, isFatal?: boolean) => void;

type ErrorUtilsShape = {
  getGlobalHandler: () => GlobalErrorHandler;
  setGlobalHandler: (handler: GlobalErrorHandler) => void;
};

let installed = false;

function describe(error: unknown): { title: string; body: string } {
  if (error instanceof Error || (typeof error === "object" && error !== null)) {
    const e = error as { name?: string; message?: string; stack?: string };
    const stack =
      typeof e.stack === "string"
        ? e.stack.split("\n").slice(0, 8).join("\n")
        : "";
    return {
      title: e.name ? `エラー: ${e.name}` : "エラー",
      body: [e.message ?? String(error), stack].filter(Boolean).join("\n\n"),
    };
  }
  return { title: "エラー", body: String(error) };
}

export function installCrashReporter(): void {
  if (installed || Platform.OS === "web") return;

  const errorUtils = (
    globalThis as unknown as { ErrorUtils?: ErrorUtilsShape }
  ).ErrorUtils;
  if (!errorUtils) return;

  installed = true;
  const previous = errorUtils.getGlobalHandler();

  errorUtils.setGlobalHandler((error, isFatal) => {
    if (!isFatal) {
      previous(error, isFatal);
      return;
    }
    const { title, body } = describe(error);
    console.error("[BallFilms] 未捕捉のエラー", error);
    try {
      Alert.alert(title, body);
    } catch {
      // 表示にすら失敗したら、元の処理に委ねる(=従来通り落ちる)
      previous(error, isFatal);
    }
  });
}
