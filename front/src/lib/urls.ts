// src/lib/urls.ts
export const MEETING_ALLOWED_PREFIXES = [
  "https://meet.google.com/",
  "https://zoom.us/j/",
  "https://teams.microsoft.com/l/meetup-join/",
];

export function isSafeMeetingUrl(url?: string | null) {
  if (!url) return false;
  const clean = url.trim();
  return MEETING_ALLOWED_PREFIXES.some((p) => clean.startsWith(p));
}
