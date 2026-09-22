export const PUBLIC_SITE_URL = "https://organizze-mes-claro.fabriciolimayt.chatgpt.site/";

// Old auth links can return to /. Keep their credentials on the app's origin.
export function publicHomeDestination(search: string, hash: string) {
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));
  const authKeys = ["code", "access_token", "refresh_token", "token_hash", "error", "error_code", "type"];
  return authKeys.some((key) => query.has(key) || fragment.has(key))
    ? `/auth${search}${hash}`
    : PUBLIC_SITE_URL;
}
