export type GamePhase =
  | "loading"
  | "character_select"
  | "playing"
  | "ko"
  | "respawn"
  | "game_over"
  | "results";

class GameStore {
  // Player 1
  p1Damage = $state(0);         // damage % (0 → ∞)
  p1Stocks = $state(3);         // lives remaining
  p1Character = $state("");
  p1Name = $state("Player 1");

  // Player 2
  p2Damage = $state(0);
  p2Stocks = $state(3);
  p2Character = $state("");
  p2Name = $state("CPU");

  // Match
  phase = $state<GamePhase>("loading");
  timer = $state(480);
  winner = $state<string | null>(null);
  isCPU = $state(true);
  totalStocks = $state(3);      // starting stocks

  // Stage
  selectedStage = $state("bg_city1");

  // Combo display
  comboCount = $state(0);
  lastComboPlayer = $state(-1);

  // Legacy compat
  p1Health = $state(0);
  p2Health = $state(0);
  p1Rounds = $state(0);
  p2Rounds = $state(0);

  // Extra display state
  playerId = $state<string | null>(null);
  finalStats = $state<Record<string, unknown> | null>(null);

  reset() {
    this.p1Damage = 0;
    this.p2Damage = 0;
    this.p1Stocks = 3;
    this.p2Stocks = 3;
    this.p1Character = "";
    this.p2Character = "";
    this.p1Name = "Player 1";
    this.p2Name = "CPU";
    this.phase = "loading";
    this.timer = 480;
    this.winner = null;
    this.isCPU = true;
    this.totalStocks = 3;
    this.comboCount = 0;
    this.lastComboPlayer = -1;
    this.p1Health = 0;
    this.p2Health = 0;
    this.p1Rounds = 0;
    this.p2Rounds = 0;
    this.playerId = null;
    this.finalStats = null;
  }
}

export const gameStore = new GameStore();
