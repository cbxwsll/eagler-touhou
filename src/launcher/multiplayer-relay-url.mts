const relayRoleParams = Object.freeze([
  "room",
  "run",
  "lobby",
  "player",
  "players",
  "signal",
  "spectator",
  "diagnostic",
  "directory",
  "member",
  "intent",
  "visibility",
  "disableCheatMovement",
  "challengeMode",
  "prankMode",
  "difficulty",
]);

export interface MultiplayerLobbyRelayUrl {
  roomId: string;
  url: string;
}

export function buildMultiplayerDiagnosticRelayUrl(baseUrl: string): string {
  const url = relayUrl(baseUrl);
  clearRelayRole(url);
  url.searchParams.set("diagnostic", "1");
  return url.href;
}

export type MultiplayerGameplayRelayRole =
  | { player: number }
  | { spectator: string };

function relayUrl(value: string): URL {
  let url: URL;
  try { url = new URL(value); }
  catch { throw new TypeError("invalid multiplayer relay URL"); }
  if (url.protocol !== "ws:" && url.protocol !== "wss:") {
    throw new TypeError("multiplayer relay URL must use ws or wss");
  }
  return url;
}

function clearRelayRole(url: URL): void {
  for (const key of relayRoleParams) url.searchParams.delete(key);
}

export function effectiveNetplayRelayUrl(raw: string): string {
  if (!raw) return raw;
  try {
    const parsed = new URL(raw);
    // 魔改: 页面走 HTTPS（Caddy 统一入口）而 manifest 给的是明文 ws:// 时，
    // 浏览器会按混合内容策略拦截；改经当前页面入口走 WSS，
    // Caddy 按项目路径前缀反代到内网中继。
    if (typeof location !== "undefined" && location.protocol === "https:" && parsed.protocol === "ws:") {
      const base = location.pathname.substring(0, location.pathname.lastIndexOf("/") + 1);
      return "wss://" + location.host + base;
    }
  } catch {
    // 保持原值
  }
  return raw;
}

export function multiplayerTransportRoomId(product: string, roomCode: string): string {
  return `${product}-${roomCode}`;
}

export function buildMultiplayerLobbyRelayUrl(
  baseUrl: string,
  { product, roomCode, clientId, memberId, intent, visibility, disableCheatMovement, challengeMode, prankMode, playerCount, difficulty }: { product: string; roomCode: string; clientId: string; memberId?: string; intent?: string; visibility?: "public" | "private"; disableCheatMovement?: boolean; challengeMode?:boolean; prankMode?:boolean; playerCount?: number; difficulty?: number },
): MultiplayerLobbyRelayUrl {
  const url = relayUrl(baseUrl);
  clearRelayRole(url);
  const roomId = multiplayerTransportRoomId(product, roomCode);
  url.searchParams.set("room", roomId);
  url.searchParams.set("lobby", clientId);
  if (memberId) url.searchParams.set("member", memberId);
  if (intent === "join" || intent === "create") url.searchParams.set("intent", intent);
  if (intent === "create") {
    url.searchParams.set("visibility", visibility === "private" ? "private" : "public");
    url.searchParams.set("disableCheatMovement", disableCheatMovement ? "1" : "0");
    if(challengeMode!==undefined)url.searchParams.set("challengeMode",challengeMode?"1":"0");
    if(prankMode!==undefined)url.searchParams.set("prankMode","0");
    if (playerCount != null) url.searchParams.set("players", String(playerCount));
    if (difficulty != null) url.searchParams.set("difficulty", String(difficulty));
  }
  return { roomId, url: url.href };
}

export function buildMultiplayerDirectoryRelayUrl(baseUrl: string, memberId: string): string {
  const url = relayUrl(baseUrl);
  clearRelayRole(url);
  url.searchParams.set("directory", "1");
  url.searchParams.set("member", memberId);
  return url.href;
}

export function buildMultiplayerGameplayRelayUrl(
  baseUrl: string,
  {
    product,
    roomCode,
    runId,
    role,
    memberId,
  }: {
    product: string;
    roomCode: string;
    runId: number;
    role: MultiplayerGameplayRelayRole;
    memberId?: string;
  },
): string {
  const url = relayUrl(baseUrl);
  clearRelayRole(url);
  url.searchParams.set("room", multiplayerTransportRoomId(product, roomCode));
  url.searchParams.set("run", String(Math.max(0, Math.trunc(Number(runId) || 0))));
  if (memberId) url.searchParams.set("member", memberId);
  if ("spectator" in role) url.searchParams.set("spectator", role.spectator);
  else url.searchParams.set("player", String(role.player));
  return url.href;
}
