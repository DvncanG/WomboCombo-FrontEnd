/**
 * Fighter roster configuration — Smash Bros style.
 * Each fighter maps to one of the 3 gangster sprite sets.
 * Attacks now use baseKnockback + knockbackGrowth for % scaling.
 */

export interface AttackData {
  damage: number;
  baseKnockback: number;      // fixed KB applied regardless of %
  knockbackGrowth: number;    // how much KB scales with defender's %
  angle: number;              // degrees: 0=horizontal, 90=straight up
  startup: number;            // ms before hitbox appears
  active: number;             // ms hitbox is live
  recovery: number;           // ms after hitbox
  hitboxW: number;
  hitboxH: number;
  hitboxOffsetX: number;      // offset from center, positive = forward
  hitboxOffsetY: number;
  isSmashable?: boolean;      // can be charged (heavy attacks)
}

export interface AnimKeys {
  initTexture: string;
  idle: string;
  crouch?: string;
  walk: string;
  run: string;
  jump: string;
  fall: string;
  attack: string;
  heavy: string;
  special?: string;
  shot?: string;
  recharge?: string;
  attack2?: string;
  attack3?: string;
  hurt: string;
  dead: string;
}

export interface FighterConfig {
  id: string;
  name: string;
  color: number;
  accentColor: number;
  scale: number;
  width: number;
  height: number;
  speed: number;
  jumpForce: number;
  doubleJumpForce: number;
  /** Weight 50-170 (Smash scale). Higher = harder to launch. */
  weight: number;
  /** Number of air jumps (1 = double jump only) */
  airJumps: number;
  previewSprite: string;
  idleFrames: number;
  spriteFootY: number;
  anim: AnimKeys;
  attacks: {
    light: AttackData;
    heavy: AttackData;       // ground smash attack (chargeable)
    airLight: AttackData;    // neutral air / forward air
    airHeavy: AttackData;    // down air (spike potential)
    airUp: AttackData;       // up air
    special: AttackData;     // neutral special
  };
  /** Super armor: don't flinch during these attack types */
  superArmor?: { heavy?: boolean; special?: boolean };
  description: string;
}

export const FIGHTERS: Record<string, FighterConfig> = {

  // ─────────────────────────────────────────────────────────────────────────
  // BLAZE — Gangster 1 (coat + hat, rifle/pistol)
  // Ligero, rapido, ataque a distancia. Muere temprano por poco peso.
  // ─────────────────────────────────────────────────────────────────────────
  blaze: {
    id: "blaze",
    name: "Blaze",
    color: 0xff4444,
    accentColor: 0xff8800,
    scale: 2.3,
    width: 42,
    height: 80,
    speed: 265,
    jumpForce: -530,
    doubleJumpForce: -430,
    weight: 75,              // very light — easy to KO
    airJumps: 2,             // extra air jump — compensates low weight
    previewSprite: "assets/sprites/gangsters/Gangsters_1/Idle.png",
    idleFrames: 6,
    spriteFootY: 0.63,
    description: "Rapido y letal a distancia. Ligero como una pluma.",
    anim: {
      initTexture: "g1_idle",
      idle:     "blaze_idle",
      crouch:   "blaze_crouch",
      walk:     "blaze_walk",
      run:      "blaze_run",
      jump:     "blaze_jump",
      fall:     "blaze_fall",
      attack:   "blaze_attack",
      heavy:    "blaze_heavy",
      shot:     "blaze_shot",
      recharge: "blaze_recharge",
      hurt:     "blaze_hurt",
      dead:     "blaze_dead",
    },
    attacks: {
      // Jab rapido — fast poke, good for combos
      light: {
        damage: 5, baseKnockback: 15, knockbackGrowth: 60, angle: 45,
        startup: 35, active: 70, recovery: 50,
        hitboxW: 32, hitboxH: 22, hitboxOffsetX: 40, hitboxOffsetY: 0,
      },
      // Forward Smash — chargeable, kills at ~120%
      heavy: {
        damage: 14, baseKnockback: 30, knockbackGrowth: 100, angle: 40,
        startup: 160, active: 90, recovery: 240,
        hitboxW: 40, hitboxH: 28, hitboxOffsetX: 46, hitboxOffsetY: -4,
        isSmashable: true,
      },
      // Neutral / Forward air
      airLight: {
        damage: 7, baseKnockback: 12, knockbackGrowth: 65, angle: 50,
        startup: 50, active: 70, recovery: 80,
        hitboxW: 28, hitboxH: 24, hitboxOffsetX: 38, hitboxOffsetY: -4,
      },
      // Down air — meteor smash!
      airHeavy: {
        damage: 12, baseKnockback: 20, knockbackGrowth: 85, angle: 270,
        startup: 110, active: 80, recovery: 240,
        hitboxW: 30, hitboxH: 30, hitboxOffsetX: 0, hitboxOffsetY: 42,
      },
      // Up air — juggle tool
      airUp: {
        damage: 8, baseKnockback: 18, knockbackGrowth: 75, angle: 85,
        startup: 55, active: 65, recovery: 90,
        hitboxW: 34, hitboxH: 30, hitboxOffsetX: 0, hitboxOffsetY: -38,
      },
      // DISPARO — projectile, long range (faster recovery for zoning)
      special: {
        damage: 11, baseKnockback: 28, knockbackGrowth: 58, angle: 10,
        startup: 50, active: 90, recovery: 260,
        hitboxW: 300, hitboxH: 14, hitboxOffsetX: 200, hitboxOffsetY: -10,
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TITAN — Gangster 3 (traje oscuro, cuerpo a cuerpo)
  // Pesado, lento, devastador. Sobrevive hasta % muy altos.
  // ─────────────────────────────────────────────────────────────────────────
  titan: {
    id: "titan",
    name: "Titan",
    color: 0x44cc44,
    accentColor: 0x228822,
    scale: 2.3,
    width: 42,
    height: 80,
    speed: 155,
    jumpForce: -430,
    doubleJumpForce: -340,
    weight: 145,             // very heavy — survives long
    airJumps: 1,
    previewSprite: "assets/sprites/gangsters/Gangsters_3/Idle.png",
    idleFrames: 7,
    spriteFootY: 0.63,
    superArmor: { heavy: true },
    description: "Brutal e imparable. El mas pesado del roster.",
    anim: {
      initTexture: "g3_idle",
      idle:   "titan_idle",
      crouch: "titan_crouch",
      walk:   "titan_walk",
      run:    "titan_run",
      jump:   "titan_jump",
      fall:   "titan_fall",
      attack: "titan_attack",
      heavy:  "titan_heavy",
      hurt:   "titan_hurt",
      dead:   "titan_dead",
    },
    attacks: {
      // Jab — slow but powerful, decent knockback
      light: {
        damage: 6, baseKnockback: 18, knockbackGrowth: 65, angle: 40,
        startup: 110, active: 100, recovery: 150,
        hitboxW: 40, hitboxH: 32, hitboxOffsetX: 46, hitboxOffsetY: 0,
      },
      // Forward Smash — DEVASTATING, kills early (but very punishable)
      heavy: {
        damage: 20, baseKnockback: 38, knockbackGrowth: 105, angle: 48,
        startup: 300, active: 120, recovery: 400,
        hitboxW: 54, hitboxH: 46, hitboxOffsetX: 28, hitboxOffsetY: -18,
        isSmashable: true,
      },
      // Forward air — strong but slow aerial
      airLight: {
        damage: 10, baseKnockback: 16, knockbackGrowth: 72, angle: 45,
        startup: 100, active: 90, recovery: 180,
        hitboxW: 42, hitboxH: 34, hitboxOffsetX: 38, hitboxOffsetY: 0,
      },
      // Down air — massive spike (high commitment)
      airHeavy: {
        damage: 16, baseKnockback: 22, knockbackGrowth: 85, angle: 275,
        startup: 220, active: 110, recovery: 400,
        hitboxW: 48, hitboxH: 48, hitboxOffsetX: 0, hitboxOffsetY: 50,
      },
      // Up air — launcher (slower than others)
      airUp: {
        damage: 12, baseKnockback: 20, knockbackGrowth: 78, angle: 88,
        startup: 120, active: 80, recovery: 180,
        hitboxW: 42, hitboxH: 38, hitboxOffsetX: 0, hitboxOffsetY: -40,
      },
      // Spinning sweep — wide, horizontal kill move (no longer armored)
      special: {
        damage: 14, baseKnockback: 32, knockbackGrowth: 85, angle: 25,
        startup: 240, active: 140, recovery: 340,
        hitboxW: 60, hitboxH: 28, hitboxOffsetX: 30, hitboxOffsetY: 8,
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PHANTOM — Gangster 2 (boxeador, MUY rapido)
  // Peso medio, velocidad extrema. Combo machine.
  // ─────────────────────────────────────────────────────────────────────────
  phantom: {
    id: "phantom",
    name: "Phantom",
    color: 0xaa44ff,
    accentColor: 0x6622aa,
    scale: 2.3,
    width: 42,
    height: 80,
    speed: 385,
    jumpForce: -510,
    doubleJumpForce: -420,
    weight: 100,             // medium weight — balanced
    airJumps: 3,             // quad jump — the aerial combo king
    previewSprite: "assets/sprites/gangsters/Gangsters_2/Idle.png",
    idleFrames: 7,
    spriteFootY: 0.63,
    description: "Velocidad pura. El rey de los combos.",
    anim: {
      initTexture: "g2_idle",
      idle:    "phantom_idle",
      crouch:  "phantom_crouch",
      walk:    "phantom_walk",
      run:     "phantom_run",
      jump:    "phantom_jump",
      fall:    "phantom_fall",
      attack:  "phantom_attack",
      attack2: "phantom_light2",
      attack3: "phantom_light3",
      heavy:   "phantom_heavy",
      special: "phantom_special",
      hurt:    "phantom_hurt",
      dead:    "phantom_dead",
    },
    attacks: {
      // Jab — fastest in the game, combo starter
      light: {
        damage: 4, baseKnockback: 10, knockbackGrowth: 52, angle: 55,
        startup: 30, active: 55, recovery: 45,
        hitboxW: 30, hitboxH: 22, hitboxOffsetX: 38, hitboxOffsetY: 0,
      },
      // Forward Smash — quick smash, moderate power
      heavy: {
        damage: 15, baseKnockback: 32, knockbackGrowth: 105, angle: 42,
        startup: 140, active: 85, recovery: 210,
        hitboxW: 38, hitboxH: 28, hitboxOffsetX: 44, hitboxOffsetY: -2,
        isSmashable: true,
      },
      // Forward air — great combo aerial
      airLight: {
        damage: 7, baseKnockback: 10, knockbackGrowth: 60, angle: 60,
        startup: 35, active: 70, recovery: 75,
        hitboxW: 30, hitboxH: 28, hitboxOffsetX: 32, hitboxOffsetY: -12,
      },
      // Down air — quick spike
      airHeavy: {
        damage: 11, baseKnockback: 18, knockbackGrowth: 80, angle: 280,
        startup: 110, active: 80, recovery: 240,
        hitboxW: 34, hitboxH: 32, hitboxOffsetX: 8, hitboxOffsetY: 38,
      },
      // Up air — juggle king
      airUp: {
        damage: 7, baseKnockback: 14, knockbackGrowth: 70, angle: 82,
        startup: 40, active: 60, recovery: 80,
        hitboxW: 30, hitboxH: 28, hitboxOffsetX: 0, hitboxOffsetY: -34,
      },
      // Teleport + hook — dash forward, high risk/reward
      special: {
        damage: 14, baseKnockback: 30, knockbackGrowth: 92, angle: 42,
        startup: 55, active: 80, recovery: 140,
        hitboxW: 44, hitboxH: 26, hitboxOffsetX: 36, hitboxOffsetY: 0,
      },
    },
  },
};

export const FIGHTER_IDS = Object.keys(FIGHTERS);

export function getFighterConfig(id: string): FighterConfig {
  return FIGHTERS[id] ?? FIGHTERS.blaze;
}
