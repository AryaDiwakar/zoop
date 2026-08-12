export async function parseJsonBody(request: Request): Promise<any> {
  const raw = await request.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    // Some browsers/clients can send literal control characters (raw newlines
    // pasted into text fields). Escape them so JSON.parse doesn't throw.
    const sanitized = raw.replace(
      /[\u0000-\u001F\u007F]/g,
      (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`
    );
    return JSON.parse(sanitized);
  }
}
