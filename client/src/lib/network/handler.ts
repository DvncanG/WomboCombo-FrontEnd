import type { IncomingMessage } from "./messages";
import { socket } from "./socket";
import { gameStore } from "../stores/game.svelte";
import { lobby } from "../stores/lobby.svelte";
import { router } from "../stores/router.svelte";

/** Callback for GameScene to receive game_state and events */
export type GameSceneCallback = (msg: IncomingMessage) => void;

let gameSceneCallback: GameSceneCallback | null = null;

/** Register the Phaser GameScene to receive gameplay messages */
export function registerGameScene(cb: GameSceneCallback): void {
  gameSceneCallback = cb;
}

export function unregisterGameScene(): void {
  gameSceneCallback = null;
}

/** Initialize the message handler — call once on app startup */
export function initMessageHandler(): () => void {
  return socket.onMessage((msg) => {
    switch (msg.type) {
      // -- Connection --
      case "connected":
        gameStore.playerId = msg.player_id;
        console.log("[Handler] Connected as", msg.player_id);
        break;

      case "error":
        console.error("[Handler] Server error:", msg.code, msg.message);
        break;

      // -- Lobby --
      case "player_joined":
        lobby.addPlayer({
          id: msg.player_id,
          name: msg.player_name,
          ready: false,
        });
        break;

      case "player_left":
        lobby.removePlayer(msg.player_id);
        break;

      case "player_ready_state":
        lobby.setPlayerReady(msg.player_id, msg.ready);
        break;

      case "lobby_state":
        lobby.players = msg.players.map((p) => ({
          id: p.id,
          name: p.name,
          ready: p.ready,
        }));
        break;

      case "chat_broadcast": {
        const sender = lobby.players.find((p) => p.id === msg.player_id);
        lobby.addChat(msg.player_id, sender?.name ?? "Unknown", msg.message);
        break;
      }

      // -- Game lifecycle --
      case "game_start":
        gameStore.round = msg.round;
        gameStore.phase = "playing";
        router.navigate("game");
        gameSceneCallback?.(msg);
        break;

      case "round_start_countdown":
        gameStore.countdownSeconds = msg.seconds;
        gameStore.phase = "countdown";
        gameSceneCallback?.(msg);
        break;

      case "round_end":
        gameStore.phase = "shop";
        gameSceneCallback?.(msg);
        break;

      case "shop_open":
        gameStore.shopItems = msg.available_items;
        gameStore.phase = "shop";
        break;

      case "buy_result":
        gameStore.gold = msg.gold_left;
        break;

      case "game_over":
        gameStore.finalStats = msg.final_stats;
        gameStore.phase = "game_over";
        router.navigate("results");
        break;

      // -- Gameplay (forward to Phaser) --
      case "game_state":
        gameStore.timeLeft = msg.time_left;
        gameStore.playerCount = msg.players.length;
        // Update local player health from server state
        if (gameStore.playerId) {
          const me = msg.players.find((p) => p.id === gameStore.playerId);
          if (me) {
            gameStore.health = me.health;
          }
        }
        gameSceneCallback?.(msg);
        break;

      case "player_hit":
        if (msg.player_id === gameStore.playerId) {
          gameStore.health = msg.health;
        }
        gameSceneCallback?.(msg);
        break;

      case "player_death":
        if (msg.player_id === gameStore.playerId) {
          gameStore.isLocalPlayerDead = true;
          gameStore.phase = "dead";
        }
        gameSceneCallback?.(msg);
        break;

      case "player_respawn":
        if (msg.player_id === gameStore.playerId) {
          gameStore.isLocalPlayerDead = false;
          gameStore.phase = "playing";
        }
        gameSceneCallback?.(msg);
        break;

      case "enemy_spawn":
      case "enemy_death":
      case "item_spawn":
      case "item_pickup":
        gameSceneCallback?.(msg);
        break;
    }
  });
}
