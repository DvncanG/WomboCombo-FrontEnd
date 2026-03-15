export const PHYSICS = {
  GRAVITY: 980,
  PLAYER_SPEED: 200,
  PLAYER_JUMP: -400,
  PLAYER_MAX_FALL: 700,
  FAST_FALL_SPEED: 900,
  TILE_SIZE: 32,

  // Street Fighter style combat — knockback is pushback, no % scaling
  KNOCKBACK_MULTIPLIER: 0.45,
  DAMAGE_KNOCKBACK_SCALING: 0,
  HITSTUN_BASE_MS: 200,
  HITSTUN_SCALING: 0,

  // Match — 99s rounds, best of 3
  FIGHTER_HP: 100,
  ROUNDS_TO_WIN: 2,
  ROUND_TIME: 99,
  STOCKS: 3,           // legacy
  MATCH_TIME: 99,
  RESPAWN_TIME: 1500,  // legacy
  RESPAWN_INVULN: 500,

  // Arena
  ARENA_WIDTH: 1280,
  ARENA_HEIGHT: 720,

  // Street Fighter stage bounds (world bounds used for floor + walls)
  FLOOR_Y: 700,          // body bottom stops here (~87% of 720, matches visible street in all city backgrounds)
  ARENA_WALL_LEFT: 120,  // keeps sprite (294px wide) fully on-screen on the left
  ARENA_WALL_RIGHT: 1160, // keeps sprite fully on-screen on the right (1280 - 120)
} as const;

export const NETWORK = {
  SERVER_TICK_RATE: 20,
  INTERPOLATION_DELAY: 100,
  INPUT_SEND_RATE: 50,
} as const;
