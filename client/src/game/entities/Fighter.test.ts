import { describe, it, expect } from "vitest";
import { PHYSICS } from "../config/physics";
import { FIGHTERS, getFighterConfig } from "../config/fighters";
import type { AttackData, FighterConfig } from "../config/fighters";

// ─────────────────────────────────────────────────────────────────────────────
// Tests unitarios: Logica de combate (Fighter.ts)
//
// Fighter depende de Phaser.Scene para instanciarse, asi que testeamos
// la logica pura (formulas de KB, condiciones de KO, hitstun) directamente.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Replica exacta de Fighter.calcSmashKnockback()
 * KB = (((p/10 + p*d/20) * 200/(w+100) * 1.4) + 18) * growth/100 + baseKB
 */
function calcSmashKnockback(
  damage: number,
  attack: AttackData,
  weight: number,
): number {
  const p = damage;
  const d = attack.damage;
  const w = weight;
  const raw =
    (((p / 10 + (p * d) / 20) * 200 / (w + 100)) * 1.4 + 18) *
      (attack.knockbackGrowth / 100) +
    attack.baseKnockback;
  return raw;
}

/**
 * Replica de las condiciones de KO de Fighter.checkBlastZones()
 */
function checkBlastZones(y: number, damage: number): boolean {
  if (y < PHYSICS.BLAST_TOP) return true;
  if (damage >= PHYSICS.KO_DAMAGE_THRESHOLD) return true;
  return false;
}

/**
 * Calculo de hitstun con decay por combos consecutivos
 */
function calcHitstun(knockbackForce: number, consecutiveHits: number): number {
  const decayMult = Math.max(
    1 - PHYSICS.HITSTUN_DECAY_PER_HIT * (consecutiveHits - 1),
    PHYSICS.MAX_COMBO_DECAY,
  );
  return (
    (PHYSICS.HITSTUN_BASE_MS + knockbackForce * PHYSICS.HITSTUN_PER_KB) *
    decayMult
  );
}

/**
 * Calculo de hitlag (freeze frames)
 */
function calcHitlag(attackDamage: number): number {
  return PHYSICS.HITLAG_BASE + attackDamage * PHYSICS.HITLAG_PER_DAMAGE;
}

// ─────────────────────────────────────────────────────────────────────────────

describe("calcSmashKnockback - Formula de knockback estilo Smash", () => {
  const blazeLight = FIGHTERS.blaze.attacks.light;
  const titanHeavy = FIGHTERS.titan.attacks.heavy;
  const phantomLight = FIGHTERS.phantom.attacks.light;

  it("a 0% de dano, el KB debe ser cercano al baseKnockback", () => {
    // Con 0% de dano, la parte escalante es 0 → solo queda (18 * growth/100) + baseKB
    const kb = calcSmashKnockback(0, blazeLight, FIGHTERS.blaze.weight);
    const expected = 18 * (blazeLight.knockbackGrowth / 100) + blazeLight.baseKnockback;
    expect(kb).toBeCloseTo(expected, 2);
  });

  it("el KB debe aumentar con el porcentaje de dano", () => {
    const kb0 = calcSmashKnockback(0, blazeLight, FIGHTERS.blaze.weight);
    const kb50 = calcSmashKnockback(50, blazeLight, FIGHTERS.blaze.weight);
    const kb100 = calcSmashKnockback(100, blazeLight, FIGHTERS.blaze.weight);
    expect(kb50).toBeGreaterThan(kb0);
    expect(kb100).toBeGreaterThan(kb50);
  });

  it("mas peso = menos knockback a mismo porcentaje", () => {
    const kbLight = calcSmashKnockback(80, blazeLight, 75); // Blaze weight
    const kbHeavy = calcSmashKnockback(80, blazeLight, 145); // Titan weight
    expect(kbLight).toBeGreaterThan(kbHeavy);
  });

  it("un ataque con mas knockbackGrowth escala mas fuerte", () => {
    // Titan heavy tiene growth 105, Blaze light tiene growth 60
    const kbLow = calcSmashKnockback(100, blazeLight, 100);
    const kbHigh = calcSmashKnockback(100, titanHeavy, 100);
    expect(kbHigh).toBeGreaterThan(kbLow);
  });

  it("el heavy de Titan a 120% debe producir un KB significativo", () => {
    const kb = calcSmashKnockback(120, titanHeavy, FIGHTERS.phantom.weight);
    // A 120% con el heavy de Titan, deberia ser un KB muy alto
    expect(kb).toBeGreaterThan(100);
  });

  it("el light de Phantom a 0% debe producir un KB bajo", () => {
    const kb = calcSmashKnockback(0, phantomLight, FIGHTERS.titan.weight);
    expect(kb).toBeLessThan(30);
  });

  it("el resultado siempre debe ser positivo", () => {
    for (const [, fighter] of Object.entries(FIGHTERS)) {
      for (const attackKey of Object.keys(fighter.attacks)) {
        const attack = fighter.attacks[attackKey as keyof typeof fighter.attacks];
        const kb = calcSmashKnockback(50, attack, fighter.weight);
        expect(kb).toBeGreaterThan(0);
      }
    }
  });
});

describe("checkBlastZones - Condiciones de KO", () => {
  it("no debe haber KO en posicion y dano normales", () => {
    expect(checkBlastZones(400, 50)).toBe(false);
  });

  it("debe haber KO si y esta por encima de BLAST_TOP", () => {
    expect(checkBlastZones(PHYSICS.BLAST_TOP - 1, 0)).toBe(true);
  });

  it("no debe haber KO justo en BLAST_TOP", () => {
    expect(checkBlastZones(PHYSICS.BLAST_TOP, 0)).toBe(false);
  });

  it("debe haber KO si el dano alcanza el umbral", () => {
    expect(checkBlastZones(400, PHYSICS.KO_DAMAGE_THRESHOLD)).toBe(true);
  });

  it("no debe haber KO justo por debajo del umbral", () => {
    expect(checkBlastZones(400, PHYSICS.KO_DAMAGE_THRESHOLD - 1)).toBe(false);
  });

  it("debe haber KO si ambas condiciones se cumplen", () => {
    expect(
      checkBlastZones(PHYSICS.BLAST_TOP - 100, PHYSICS.KO_DAMAGE_THRESHOLD + 50),
    ).toBe(true);
  });
});

describe("calcHitstun - Hitstun con decay anti-infinito", () => {
  it("el hitstun base (hit 1) debe ser el maximo posible", () => {
    const hitstun1 = calcHitstun(50, 1);
    const hitstun5 = calcHitstun(50, 5);
    expect(hitstun1).toBeGreaterThan(hitstun5);
  });

  it("el hitstun debe disminuir con hits consecutivos", () => {
    const h1 = calcHitstun(80, 1);
    const h2 = calcHitstun(80, 2);
    const h3 = calcHitstun(80, 3);
    expect(h1).toBeGreaterThan(h2);
    expect(h2).toBeGreaterThan(h3);
  });

  it("el hitstun no debe bajar por debajo del decay maximo (40%)", () => {
    // Con muchos hits, el multiplicador no baja de MAX_COMBO_DECAY
    const hMuchos = calcHitstun(80, 100);
    const minExpected =
      (PHYSICS.HITSTUN_BASE_MS + 80 * PHYSICS.HITSTUN_PER_KB) *
      PHYSICS.MAX_COMBO_DECAY;
    expect(hMuchos).toBeCloseTo(minExpected, 2);
  });

  it("mas knockback = mas hitstun", () => {
    const hLow = calcHitstun(30, 1);
    const hHigh = calcHitstun(100, 1);
    expect(hHigh).toBeGreaterThan(hLow);
  });

  it("el hitstun siempre debe ser positivo", () => {
    expect(calcHitstun(0, 1)).toBeGreaterThan(0);
    expect(calcHitstun(0, 10)).toBeGreaterThan(0);
  });
});

describe("calcHitlag - Freeze frames al impactar", () => {
  it("mas dano = mas hitlag", () => {
    const lagLow = calcHitlag(5);
    const lagHigh = calcHitlag(20);
    expect(lagHigh).toBeGreaterThan(lagLow);
  });

  it("con 0 de dano el hitlag debe ser el base", () => {
    expect(calcHitlag(0)).toBe(PHYSICS.HITLAG_BASE);
  });

  it("la formula debe ser HITLAG_BASE + damage * HITLAG_PER_DAMAGE", () => {
    const damage = 14;
    const expected = PHYSICS.HITLAG_BASE + damage * PHYSICS.HITLAG_PER_DAMAGE;
    expect(calcHitlag(damage)).toBe(expected);
  });
});

describe("Velocidad de knockback - Calculo de componentes", () => {
  it("un angulo de 0 grados debe producir solo componente horizontal", () => {
    const attack: AttackData = {
      ...FIGHTERS.blaze.attacks.light,
      angle: 0,
    };
    const kb = calcSmashKnockback(50, attack, 100);
    const angleRad = (0 * Math.PI) / 180;
    const vx = Math.cos(angleRad) * kb * PHYSICS.KNOCKBACK_FORMULA_SCALE;
    const vy = -Math.sin(angleRad) * kb * PHYSICS.KNOCKBACK_FORMULA_SCALE;
    expect(Math.abs(vx)).toBeGreaterThan(0);
    expect(Math.abs(vy)).toBeCloseTo(0, 5);
  });

  it("un angulo de 90 grados debe producir solo componente vertical", () => {
    const attack: AttackData = {
      ...FIGHTERS.blaze.attacks.light,
      angle: 90,
    };
    const kb = calcSmashKnockback(50, attack, 100);
    const angleRad = (90 * Math.PI) / 180;
    const vx = Math.cos(angleRad) * kb * PHYSICS.KNOCKBACK_FORMULA_SCALE;
    const vy = -Math.sin(angleRad) * kb * PHYSICS.KNOCKBACK_FORMULA_SCALE;
    expect(Math.abs(vx)).toBeCloseTo(0, 5);
    expect(Math.abs(vy)).toBeGreaterThan(0);
  });

  it("un angulo de 270 (meteor/spike) debe lanzar hacia abajo", () => {
    const attack: AttackData = {
      ...FIGHTERS.blaze.attacks.airHeavy,
      angle: 270,
    };
    const kb = calcSmashKnockback(50, attack, 100);
    const angleRad = (270 * Math.PI) / 180;
    const vy = -Math.sin(angleRad) * kb * PHYSICS.KNOCKBACK_FORMULA_SCALE;
    // vy positivo = hacia abajo en pantalla
    expect(vy).toBeGreaterThan(0);
  });
});
