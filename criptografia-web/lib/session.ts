export function isSecureRequest(request: Request): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "";
  const forwardedProtocol = request.headers.get("x-forwarded-protocol") ?? "";
  const origin = request.headers.get("origin") ?? "";

  const candidateProtocols = [
    ...forwardedProto.split(","),
    ...forwardedProtocol.split(","),
  ].map((value) => value.trim().toLowerCase());

  return candidateProtocols.includes("https") || origin.startsWith("https://");
}

export function getSessionCookieOptions(request: Request) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: isSecureRequest(request),
    maxAge: 60 * 60 * 24 * 7,
  };
}
