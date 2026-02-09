// ============================================================
// OUTGOING MESSAGES (Client → Server)
// ============================================================

export interface PlayerReadyMsg {
  type: "player_ready";
  ready: boolean;
}

export interface ChatMessageMsg {
  type: "chat_message";
  message: string;
}

export interface PlayerInputMsg {
  type: "player_input";
  tick: number;
  actions: PlayerAction[];
}

export interface PlayerActionMsg {
  type: "player_action";
  action: "use_item";
}

export interface BuyItemMsg {
  type: "buy_item";
  item_id: string;
}

export type OutgoingMessage =
  | PlayerReadyMsg
  | ChatMessageMsg
  | PlayerInputMsg
  | PlayerActionMsg
  | BuyItemMsg;

export type PlayerAction =
  | "left"
  | "right"
  | "jump"
  | "crouch"
  | "interact"
  | "use_item";

// ============================================================
// INCOMING MESSAGES (Server → Client)
// ============================================================

// -- Connection --

export interface ConnectedMsg {
  type: "connected";
  player_id: string;
  server_tick: number;
}

export interface ErrorMsg {
  type: "error";
  code: number;
  message: string;
}

// -- Lobby --

export interface PlayerJoinedMsg {
  type: "player_joined";
  player_id: string;
  player_name: string;
}

export interface PlayerLeftMsg {
  type: "player_left";
  player_id: string;
}

export interface PlayerReadyStateMsg {
  type: "player_ready_state";
  player_id: string;
  ready: boolean;
}

export interface LobbyStateMsg {
  type: "lobby_state";
  players: Array<{ id: string; name: string; ready: boolean }>;
  settings: Record<string, unknown>;
}

export interface ChatBroadcastMsg {
  type: "chat_broadcast";
  player_id: string;
  message: string;
}

// -- Gameplay --

export interface PlayerState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  state: string;
  facing: "left" | "right";
}

export interface EnemyState {
  id: string;
  type: string;
  x: number;
  y: number;
  health: number;
  state: string;
}

export interface ItemState {
  id: string;
  type: string;
  x: number;
  y: number;
}

export interface GameStateMsg {
  type: "game_state";
  tick: number;
  time_left: number;
  players: PlayerState[];
  enemies: EnemyState[];
  items: ItemState[];
}

export interface GameStartMsg {
  type: "game_start";
  round: number;
  map_data: Record<string, unknown>;
  spawn_points: Array<{ x: number; y: number }>;
}

export interface PlayerHitMsg {
  type: "player_hit";
  player_id: string;
  damage: number;
  health: number;
}

export interface PlayerDeathMsg {
  type: "player_death";
  player_id: string;
}

export interface PlayerRespawnMsg {
  type: "player_respawn";
  player_id: string;
  x: number;
  y: number;
}

export interface EnemySpawnMsg {
  type: "enemy_spawn";
  enemy_id: string;
  enemy_type: string;
  x: number;
  y: number;
}

export interface EnemyDeathMsg {
  type: "enemy_death";
  enemy_id: string;
  killed_by: string;
}

export interface ItemSpawnMsg {
  type: "item_spawn";
  item_id: string;
  item_type: string;
  x: number;
  y: number;
}

export interface ItemPickupMsg {
  type: "item_pickup";
  item_id: string;
  player_id: string;
}

export interface RoundEndMsg {
  type: "round_end";
  stats: Record<string, unknown>;
  rewards: Record<string, unknown>;
}

export interface ShopOpenMsg {
  type: "shop_open";
  available_items: Array<{
    id: string;
    name: string;
    cost: number;
    description: string;
  }>;
}

export interface BuyResultMsg {
  type: "buy_result";
  success: boolean;
  item_id: string;
  gold_left: number;
}

export interface RoundStartCountdownMsg {
  type: "round_start_countdown";
  seconds: number;
}

export interface GameOverMsg {
  type: "game_over";
  final_stats: Record<string, unknown>;
}

export type IncomingMessage =
  | ConnectedMsg
  | ErrorMsg
  | PlayerJoinedMsg
  | PlayerLeftMsg
  | PlayerReadyStateMsg
  | LobbyStateMsg
  | ChatBroadcastMsg
  | GameStateMsg
  | GameStartMsg
  | PlayerHitMsg
  | PlayerDeathMsg
  | PlayerRespawnMsg
  | EnemySpawnMsg
  | EnemyDeathMsg
  | ItemSpawnMsg
  | ItemPickupMsg
  | RoundEndMsg
  | ShopOpenMsg
  | BuyResultMsg
  | RoundStartCountdownMsg
  | GameOverMsg;
