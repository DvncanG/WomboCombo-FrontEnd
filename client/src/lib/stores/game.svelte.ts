export type GamePhase = "loading" | "playing" | "shop" | "countdown" | "dead" | "game_over";

class GameStore {
  // HUD data
  health = $state(100);
  maxHealth = $state(100);
  score = $state(0);
  gold = $state(0);
  round = $state(1);
  timeLeft = $state(60);
  phase = $state<GamePhase>("loading");

  // Player info
  playerId = $state<string | null>(null);
  playerCount = $state(0);

  // Shop
  shopItems = $state<Array<{ id: string; name: string; cost: number; description: string }>>([]);

  // Countdown
  countdownSeconds = $state(0);

  // Death
  isLocalPlayerDead = $state(false);

  // Final stats
  finalStats = $state<Record<string, unknown> | null>(null);

  reset() {
    this.health = 100;
    this.maxHealth = 100;
    this.score = 0;
    this.gold = 0;
    this.round = 1;
    this.timeLeft = 60;
    this.phase = "loading";
    this.playerId = null;
    this.isLocalPlayerDead = false;
    this.finalStats = null;
    this.shopItems = [];
    this.countdownSeconds = 0;
  }
}

export const gameStore = new GameStore();
