// ─── Hybrid fighting game physics ────────────────────────────────────────────
// Smash-style mechanics (%, knockback scaling, stocks, shield, dodge, hitlag)
// on a Tekken/Street Fighter closed stage (solid floor + walls).

export const PHYSICS = {
  // Core physics
  GRAVITY: 980,
  PLAYER_SPEED: 200,
  PLAYER_JUMP: -400,
  PLAYER_MAX_FALL: 700,
  FAST_FALL_SPEED: 900,
  TILE_SIZE: 32,

  // Knockback scaling (Smash formula)
  KNOCKBACK_FORMULA_SCALE: 0.45,
  HITSTUN_BASE_MS: 45,
  HITSTUN_PER_KB: 3.8,

  // Damage % (starts at 0%, goes up — more % = more knockback)
  MAX_DAMAGE_PERCENT: 999,

  // Stocks (lives)
  STOCKS: 3,
  RESPAWN_TIME: 1200,
  RESPAWN_INVULN: 2000,

  // Match timer
  MATCH_TIME: 300,            // 5 minutes
  ROUND_TIME: 300,

  // Arena dimensions
  ARENA_WIDTH: 1280,
  ARENA_HEIGHT: 720,

  // Closed stage bounds (Tekken/SF style)
  FLOOR_Y: 700,              // solid floor — body bottom stops here
  ARENA_WALL_LEFT: 120,      // left wall
  ARENA_WALL_RIGHT: 1160,    // right wall

  // Wall bounce — when KB exceeds this, fighter bounces off walls (tech chase)
  WALL_BOUNCE_KB_THRESHOLD: 120,
  WALL_BOUNCE_FACTOR: 0.45,  // velocity retained after wall bounce

  // KO — in a closed stage, KO happens via top blast zone or accumulated damage
  BLAST_TOP: -400,            // vertical KO if launched upward past this
  KO_DAMAGE_THRESHOLD: 300,   // auto-KO if damage exceeds this (safety valve)

  // Shield
  SHIELD_HP_MAX: 50,
  SHIELD_DECAY_RATE: 12,
  SHIELD_REGEN_RATE: 8,
  SHIELD_STUN_DURATION: 2500,
  SHIELD_PUSHBACK: 120,

  // Dodge / roll
  DODGE_DURATION: 350,
  DODGE_COOLDOWN: 600,
  ROLL_SPEED: 400,
  AIR_DODGE_SPEED: 300,

  // Smash attack charge
  SMASH_CHARGE_MAX: 1000,
  SMASH_CHARGE_MULT: 1.4,

  // Hitlag (freeze frames on hit)
  HITLAG_BASE: 40,
  HITLAG_PER_DAMAGE: 5,

  // DI (Directional Influence)
  DI_INFLUENCE: 0.12,

  // Combo breaker (burst)
  BURST_COOLDOWN: 8000,
  BURST_INVULN: 500,
  BURST_PUSHBACK: 350,

  // Hitstun decay per consecutive combo hit (anti-infinite)
  HITSTUN_DECAY_PER_HIT: 0.15,
  MAX_COMBO_DECAY: 0.40,

  // Wall splat stun (extra hitstun when bouncing off wall)
  WALL_SPLAT_STUN: 250,

  // Legacy compat
  FIGHTER_HP: 0,
  ROUNDS_TO_WIN: 0,
  STAGE_LEFT: 120,
  STAGE_RIGHT: 1160,
} as const;

export const NETWORK = {
  SERVER_TICK_RATE: 20,
  INTERPOLATION_DELAY: 100,
  INPUT_SEND_RATE: 50,
} as const;
