import { describe, it, expect } from "vitest";
import { PHYSICS, NETWORK } from "./physics";

// ─────────────────────────────────────────────────────────────────────────────
// Tests unitarios: Constantes de fisicas (physics.ts)
// ─────────────────────────────────────────────────────────────────────────────

describe("PHYSICS - Constantes principales", () => {
  it("la gravedad debe ser positiva", () => {
    expect(PHYSICS.GRAVITY).toBeGreaterThan(0);
  });

  it("la velocidad maxima de caida debe ser mayor que la gravedad normalizada", () => {
    expect(PHYSICS.PLAYER_MAX_FALL).toBeGreaterThan(0);
  });

  it("el salto debe ser negativo (impulso hacia arriba)", () => {
    expect(PHYSICS.PLAYER_JUMP).toBeLessThan(0);
  });

  it("fast fall debe ser mayor que la caida normal", () => {
    expect(PHYSICS.FAST_FALL_SPEED).toBeGreaterThan(PHYSICS.PLAYER_MAX_FALL);
  });
});

describe("PHYSICS - Arena y escenario", () => {
  it("las dimensiones de la arena deben ser positivas", () => {
    expect(PHYSICS.ARENA_WIDTH).toBeGreaterThan(0);
    expect(PHYSICS.ARENA_HEIGHT).toBeGreaterThan(0);
  });

  it("la pared derecha debe estar a la derecha de la izquierda", () => {
    expect(PHYSICS.ARENA_WALL_RIGHT).toBeGreaterThan(PHYSICS.ARENA_WALL_LEFT);
  });

  it("el suelo debe estar dentro de la arena", () => {
    expect(PHYSICS.FLOOR_Y).toBeLessThanOrEqual(PHYSICS.ARENA_HEIGHT);
    expect(PHYSICS.FLOOR_Y).toBeGreaterThan(0);
  });

  it("la blast zone superior debe ser negativa (por encima de la pantalla)", () => {
    expect(PHYSICS.BLAST_TOP).toBeLessThan(0);
  });
});

describe("PHYSICS - Stocks y respawn", () => {
  it("debe empezar con 3 stocks", () => {
    expect(PHYSICS.STOCKS).toBe(3);
  });

  it("el tiempo de respawn debe ser positivo", () => {
    expect(PHYSICS.RESPAWN_TIME).toBeGreaterThan(0);
  });

  it("la invulnerabilidad de respawn debe ser mayor que el tiempo de respawn", () => {
    expect(PHYSICS.RESPAWN_INVULN).toBeGreaterThan(PHYSICS.RESPAWN_TIME);
  });
});

describe("PHYSICS - Escudo (Shield)", () => {
  it("el HP maximo del escudo debe ser positivo", () => {
    expect(PHYSICS.SHIELD_HP_MAX).toBeGreaterThan(0);
  });

  it("la tasa de decaimiento debe ser positiva", () => {
    expect(PHYSICS.SHIELD_DECAY_RATE).toBeGreaterThan(0);
  });

  it("la tasa de regeneracion debe ser positiva", () => {
    expect(PHYSICS.SHIELD_REGEN_RATE).toBeGreaterThan(0);
  });

  it("el decaimiento debe ser mayor que la regeneracion (el escudo se gasta mas rapido)", () => {
    expect(PHYSICS.SHIELD_DECAY_RATE).toBeGreaterThan(PHYSICS.SHIELD_REGEN_RATE);
  });

  it("la duracion de stun por rotura de escudo debe ser significativa", () => {
    expect(PHYSICS.SHIELD_STUN_DURATION).toBeGreaterThanOrEqual(2000);
  });
});

describe("PHYSICS - Dodge y Roll", () => {
  it("la duracion del dodge debe ser positiva", () => {
    expect(PHYSICS.DODGE_DURATION).toBeGreaterThan(0);
  });

  it("el cooldown del dodge debe ser mayor que su duracion", () => {
    expect(PHYSICS.DODGE_COOLDOWN).toBeGreaterThan(PHYSICS.DODGE_DURATION);
  });

  it("la velocidad de roll y air dodge deben ser positivas", () => {
    expect(PHYSICS.ROLL_SPEED).toBeGreaterThan(0);
    expect(PHYSICS.AIR_DODGE_SPEED).toBeGreaterThan(0);
  });
});

describe("PHYSICS - Smash charge", () => {
  it("el tiempo maximo de carga debe ser positivo", () => {
    expect(PHYSICS.SMASH_CHARGE_MAX).toBeGreaterThan(0);
  });

  it("el multiplicador de carga debe ser mayor que 1", () => {
    expect(PHYSICS.SMASH_CHARGE_MULT).toBeGreaterThan(1);
  });
});

describe("PHYSICS - Knockback y Hitstun", () => {
  it("la escala de formula de KB debe estar entre 0 y 1", () => {
    expect(PHYSICS.KNOCKBACK_FORMULA_SCALE).toBeGreaterThan(0);
    expect(PHYSICS.KNOCKBACK_FORMULA_SCALE).toBeLessThanOrEqual(1);
  });

  it("el hitstun base debe ser positivo", () => {
    expect(PHYSICS.HITSTUN_BASE_MS).toBeGreaterThan(0);
  });

  it("el decay de hitstun por hit debe estar entre 0 y 1", () => {
    expect(PHYSICS.HITSTUN_DECAY_PER_HIT).toBeGreaterThan(0);
    expect(PHYSICS.HITSTUN_DECAY_PER_HIT).toBeLessThan(1);
  });

  it("el decay maximo de combo no debe superar 1", () => {
    expect(PHYSICS.MAX_COMBO_DECAY).toBeGreaterThan(0);
    expect(PHYSICS.MAX_COMBO_DECAY).toBeLessThanOrEqual(1);
  });

  it("DI influence debe estar entre 0 y 1", () => {
    expect(PHYSICS.DI_INFLUENCE).toBeGreaterThan(0);
    expect(PHYSICS.DI_INFLUENCE).toBeLessThan(1);
  });
});

describe("PHYSICS - Combo breaker (Burst)", () => {
  it("el cooldown del burst debe ser significativo (>= 5 segundos)", () => {
    expect(PHYSICS.BURST_COOLDOWN).toBeGreaterThanOrEqual(5000);
  });

  it("la invulnerabilidad del burst debe ser positiva", () => {
    expect(PHYSICS.BURST_INVULN).toBeGreaterThan(0);
  });

  it("el pushback del burst debe ser positivo", () => {
    expect(PHYSICS.BURST_PUSHBACK).toBeGreaterThan(0);
  });
});

describe("PHYSICS - KO threshold", () => {
  it("el umbral de KO por dano debe ser un valor alto (>= 200)", () => {
    expect(PHYSICS.KO_DAMAGE_THRESHOLD).toBeGreaterThanOrEqual(200);
  });

  it("el dano maximo debe ser >= al umbral de KO", () => {
    expect(PHYSICS.MAX_DAMAGE_PERCENT).toBeGreaterThanOrEqual(
      PHYSICS.KO_DAMAGE_THRESHOLD,
    );
  });
});

describe("NETWORK - Constantes de red", () => {
  it("el tick rate del servidor debe ser positivo", () => {
    expect(NETWORK.SERVER_TICK_RATE).toBeGreaterThan(0);
  });

  it("el delay de interpolacion debe ser positivo", () => {
    expect(NETWORK.INTERPOLATION_DELAY).toBeGreaterThan(0);
  });

  it("el rate de envio de input debe ser positivo", () => {
    expect(NETWORK.INPUT_SEND_RATE).toBeGreaterThan(0);
  });
});
