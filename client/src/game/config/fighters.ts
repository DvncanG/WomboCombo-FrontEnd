/**
 * Fighter roster configuration.
 * Each fighter maps to one of the 3 gangster sprite sets.
 */

export interface AttackData {
  damage: number;
  knockback: number;
  angle: number;          // degrees: 0=horizontal, 90=straight up
  startup: number;        // ms before hitbox appears
  active: number;         // ms hitbox is live
  recovery: number;       // ms after hitbox
  hitboxW: number;
  hitboxH: number;
  hitboxOffsetX: number;  // offset from center, positive = forward (before scale)
  hitboxOffsetY: number;
}

export interface AnimKeys {
  /** Base spritesheet texture key (e.g. "g1_idle") used for sprite creation */
  initTexture: string;
  idle: string;
  crouch?: string;   // Idle_2 — crouching / guard stance
  walk: string;
  run: string;
  jump: string;
  fall: string;
  attack: string;
  heavy: string;
  special?: string;
  shot?: string;     // Ranged shot (Blaze only)
  recharge?: string; // Reload after shot (Blaze only)
  hurt: string;
  dead: string;
}

export interface FighterConfig {
  id: string;
  name: string;
  /** Hex color for UI only */
  color: number;
  accentColor: number;
  scale: number;         // display scale (sprites are 128px)
  /** Physics body dimensions (pre-scale) */
  width: number;
  height: number;
  speed: number;
  jumpForce: number;
  doubleJumpForce: number;
  weight: number;
  /** Path to idle spritesheet relative to /public, for character select preview */
  previewSprite: string;
  /** Number of frames in the idle animation (for CSS sprite clipping) */
  idleFrames: number;
  /** Fraction of the 128px frame height where the character's feet are (0=top, 1=bottom) */
  spriteFootY: number;
  anim: AnimKeys;
  attacks: {
    light: AttackData;
    heavy: AttackData;
    airLight: AttackData;
    airHeavy: AttackData;
    special: AttackData;
  };
  description: string;
}

export const FIGHTERS: Record<string, FighterConfig> = {

  // ─────────────────────────────────────────────────────────────────────────
  // BLAZE — Gangster 1 (coat + hat, rifle/pistol)
  // Rápido y a distancia. Su especial es un disparo de largo alcance.
  // Recibe más daño (peso bajo). Combo: light → light → special (disparo).
  // ─────────────────────────────────────────────────────────────────────────
  blaze: {
    id: "blaze",
    name: "Blaze",
    color: 0xff4444,
    accentColor: 0xff8800,
    scale: 2.3,
    width: 42,
    height: 80,
    speed: 265,           // rápido
    jumpForce: -530,
    doubleJumpForce: -430,
    weight: 0.65,          // muy ligero → recibe mucho más knockback
    previewSprite: "assets/sprites/gangsters/Gangsters_1/Idle.png",
    idleFrames: 6,
    spriteFootY: 0.63,     // mismo valor para todos → altura garantizada igual
    description: "Rápido y letal a distancia. Su disparo rompe defensas.",
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
      // Jab rápido
      light: {
        damage: 5, knockback: 130, angle: 30,
        startup: 50,  active: 80,  recovery: 70,
        hitboxW: 30, hitboxH: 20, hitboxOffsetX: 40, hitboxOffsetY: 0,
      },
      // Culatazo — lento pero lanza
      heavy: {
        damage: 14, knockback: 380, angle: 50,
        startup: 180, active: 100, recovery: 260,
        hitboxW: 40, hitboxH: 28, hitboxOffsetX: 46, hitboxOffsetY: -4,
      },
      // Golpe aéreo rápido
      airLight: {
        damage: 6, knockback: 160, angle: 50,
        startup: 50, active: 75, recovery: 90,
        hitboxW: 28, hitboxH: 24, hitboxOffsetX: 38, hitboxOffsetY: -4,
      },
      // Patada descendente
      airHeavy: {
        damage: 11, knockback: 320, angle: 280,
        startup: 120, active: 90, recovery: 260,
        hitboxW: 30, hitboxH: 30, hitboxOffsetX: 0, hitboxOffsetY: 42,
      },
      // DISPARO — alcance casi toda la pantalla
      special: {
        damage: 14, knockback: 280, angle: 5,
        startup: 65, active: 100, recovery: 370,
        hitboxW: 280, hitboxH: 13, hitboxOffsetX: 190, hitboxOffsetY: -10,
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TITAN — Gangster 3 (traje oscuro, cuerpo a cuerpo)
  // Lento pero devastador. Cuerpo a cuerpo puro, aguanta mucho daño.
  // Combo: heavy → airHeavy slam
  // ─────────────────────────────────────────────────────────────────────────
  titan: {
    id: "titan",
    name: "Titan",
    color: 0x44cc44,
    accentColor: 0x228822,
    scale: 2.3,
    width: 42,
    height: 80,
    speed: 155,           // MUY lento — noticeable
    jumpForce: -430,
    doubleJumpForce: -340,
    weight: 1.65,          // muy pesado → recibe muy poco knockback
    previewSprite: "assets/sprites/gangsters/Gangsters_3/Idle.png",
    idleFrames: 7,
    spriteFootY: 0.63,     // mismo valor para todos → altura garantizada igual
    description: "Brutal e imparable. Cada golpe hace temblar el suelo.",
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
      // Puñetazo directo
      light: {
        damage: 9, knockback: 210, angle: 35,
        startup: 100, active: 110, recovery: 140,
        hitboxW: 40, hitboxH: 32, hitboxOffsetX: 46, hitboxOffsetY: 0,
      },
      // Uppercut devastador
      heavy: {
        damage: 26, knockback: 650, angle: 72,
        startup: 320, active: 140, recovery: 380,
        hitboxW: 54, hitboxH: 46, hitboxOffsetX: 28, hitboxOffsetY: -18,
      },
      // Gancho aéreo
      airLight: {
        damage: 10, knockback: 240, angle: 48,
        startup: 85, active: 110, recovery: 160,
        hitboxW: 42, hitboxH: 34, hitboxOffsetX: 38, hitboxOffsetY: 0,
      },
      // Slam al suelo desde el aire
      airHeavy: {
        damage: 22, knockback: 560, angle: 278,
        startup: 220, active: 140, recovery: 400,
        hitboxW: 50, hitboxH: 50, hitboxOffsetX: 0, hitboxOffsetY: 50,
      },
      // Barrido giratorio — amplio y bajo
      special: {
        damage: 17, knockback: 480, angle: 18,
        startup: 220, active: 170, recovery: 320,
        hitboxW: 64, hitboxH: 28, hitboxOffsetX: 30, hitboxOffsetY: 8,
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PHANTOM — Gangster 2 (boxeador, MUY rápido)
  // El más veloz. Stats de ataque y defensa normales, pero supera en velocidad.
  // Combo: light × 3 → heavy | special (teleporte + gancho)
  // ─────────────────────────────────────────────────────────────────────────
  phantom: {
    id: "phantom",
    name: "Phantom",
    color: 0xaa44ff,
    accentColor: 0x6622aa,
    scale: 2.3,
    width: 42,
    height: 80,
    speed: 385,           // MUY rápido — notablemente más rápido que los demás
    jumpForce: -510,
    doubleJumpForce: -420,
    weight: 1.0,           // peso normal
    previewSprite: "assets/sprites/gangsters/Gangsters_2/Idle.png",
    idleFrames: 7,
    spriteFootY: 0.63,     // mismo valor para todos → altura garantizada igual
    description: "Velocidad pura. Nadie le alcanza en el cuerpo a cuerpo.",
    anim: {
      initTexture: "g2_idle",
      idle:    "phantom_idle",
      crouch:  "phantom_crouch",
      walk:    "phantom_walk",
      run:     "phantom_run",
      jump:    "phantom_jump",
      fall:    "phantom_fall",
      attack:  "phantom_attack",
      heavy:   "phantom_heavy",
      special: "phantom_special",
      hurt:    "phantom_hurt",
      dead:    "phantom_dead",
    },
    attacks: {
      // Jab rapidísimo
      light: {
        damage: 5, knockback: 120, angle: 30,
        startup: 40, active: 65, recovery: 60,
        hitboxW: 28, hitboxH: 20, hitboxOffsetX: 38, hitboxOffsetY: 0,
      },
      // Cross con buen knockback
      heavy: {
        damage: 14, knockback: 400, angle: 45,
        startup: 155, active: 95, recovery: 230,
        hitboxW: 38, hitboxH: 28, hitboxOffsetX: 44, hitboxOffsetY: -2,
      },
      // Uppercut aéreo
      airLight: {
        damage: 6, knockback: 180, angle: 68,
        startup: 45, active: 75, recovery: 100,
        hitboxW: 28, hitboxH: 26, hitboxOffsetX: 32, hitboxOffsetY: -12,
      },
      // Drop kick
      airHeavy: {
        damage: 12, knockback: 370, angle: 285,
        startup: 130, active: 95, recovery: 270,
        hitboxW: 34, hitboxH: 32, hitboxOffsetX: 8, hitboxOffsetY: 38,
      },
      // Teletransporte + gancho
      special: {
        damage: 12, knockback: 350, angle: 38,
        startup: 75, active: 85, recovery: 170,
        hitboxW: 40, hitboxH: 24, hitboxOffsetX: 36, hitboxOffsetY: 0,
      },
    },
  },
};

export const FIGHTER_IDS = Object.keys(FIGHTERS);

export function getFighterConfig(id: string): FighterConfig {
  return FIGHTERS[id] ?? FIGHTERS.blaze;
}
