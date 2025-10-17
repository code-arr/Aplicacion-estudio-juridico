// src/hooks/useJoinMeeting.ts
import { useCallback, useMemo } from "react";
import { isSafeMeetingUrl } from "@/lib/urls";

type UseJoinMeetingOptions = {
  onInvalidUrl?: () => void;
  onOpenError?: () => void;
  onOpened?: (url: string) => void; // p/telemetría o iniciar timer, etc.
};

export function useJoinMeeting(
  url?: string | null,
  opts: UseJoinMeetingOptions = {}
) {
  const disabled = useMemo(() => !isSafeMeetingUrl(url), [url]);

  const join = useCallback(async () => {
    if (!url || disabled) {
      opts.onInvalidUrl?.();
      return false;
    }
    const ok = await window.api.openExternal(url.trim());
    if (!ok) {
      opts.onOpenError?.();
      return false;
    }
    opts.onOpened?.(url);
    return true;
  }, [url, disabled, opts]);

  const copy = useCallback(async () => {
    if (!url || disabled) {
      opts.onInvalidUrl?.();
      return false;
    }
    await navigator.clipboard.writeText(url.trim());
    return true;
  }, [url, disabled, opts]);

  return { disabled, join, copy };
}
