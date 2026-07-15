import { useEffect, useRef } from 'react';

/**
 * 最新の値を常に指すrefを返す。
 * PanResponderなど「初回だけ生成され、以後クロージャが固定されるAPI」から
 * 常に最新のprops/stateを参照したい場合に使う。
 * ref.currentの更新はuseEffect内で行い、レンダー中には書き換えない
 * （React Compilerのreact-hooks/refsルールに準拠するため）。
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}
