export const PHYSICS = {
  GRAVITY: 800,
  PLAYER_SPEED: 200,
  PLAYER_JUMP: -400,
  PLAYER_MAX_FALL: 600,
  TILE_SIZE: 32,
} as const;

export const NETWORK = {
  /** Server sends game_state at this rate */
  SERVER_TICK_RATE: 20,
  /** Delay for interpolating remote entities (ms) */
  INTERPOLATION_DELAY: 100,
  /** How often we send player_input (ms). 0 = every frame */
  INPUT_SEND_RATE: 50,
} as const;
