const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");
let accessToken = null;

export function setApiToken(token) {
  accessToken = typeof token === "string" && token.trim() ? token : null;
}

export function getMemberIdFromToken(token) {
  try {
    const encodedPayload = token?.split(".")[1];
    if (!encodedPayload) return null;
    const normalized = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")));
    const id = Number(payload.memberId);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest(path, options = {}) {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) {
    throw new ApiError("Invalid API path");
  }

  const { auth = true, body, headers: suppliedHeaders, ...fetchOptions } = options;
  const headers = new Headers(suppliedHeaders || {});
  headers.set("Accept", "application/json");

  if (body !== undefined && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (auth && accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
      body: body === undefined || body instanceof FormData ? body : JSON.stringify(body),
      credentials: "omit",
    });
  } catch {
    if (fetchOptions.signal?.aborted) {
      const abortError = new Error("Request aborted");
      abortError.name = "AbortError";
      throw abortError;
    }
    throw new ApiError("Could not reach the API. Check that the backend is running and VITE_API_URL is correct.");
  }

  const contentType = response.headers.get("content-type") || "";
  let result = null;
  if (contentType.includes("application/json")) {
    result = await response.json().catch(() => null);
  }

  if (!response.ok) {
    if (response.status === 401 && auth && accessToken) {
      window.dispatchEvent(new Event("bugtracker:unauthorized"));
    }
    const message = typeof result?.error === "string"
      ? result.error
      : `Request failed (${response.status})`;
    throw new ApiError(message, response.status, result?.details ?? null);
  }

  return result;
}

export async function apiGetAllPages(path, { limit = 100, maxPages = 50, signal } = {}) {
  const items = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const separator = path.includes("?") ? "&" : "?";
    const result = await apiRequest(`${path}${separator}page=${page}&limit=${limit}`, { signal });
    const pageItems = Array.isArray(result?.bugs) ? result.bugs : [];
    items.push(...pageItems);
    if (pageItems.length < limit) return items;
  }
  return items;
}