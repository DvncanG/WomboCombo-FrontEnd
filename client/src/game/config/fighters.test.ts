import { describe, it, expect } from "vitest";
import { FIGHTERS, FIGHTER_IDS, getFighterConfig } from "./fighters";
import type { FighterConfig, AttackData } from "./fighters";

// ─────────────────────────────────────────────────────────────────────────────
// Tests unitarios: Configuracion de luchadores (fighters.ts)
// ─────────────────────────────────────────────────────────────────────────────

describe("FIGHTERS - Registro de luchadores", () => {
  it("debe tener exactamente 3 luchadores definidos", () => {
    expect(Object.keys(FIGHTERS)).toHaveLength(3);
  });

  it("debe contener blaze, titan y phantom", () => {
    expect(FIGHTERS).toHaveProperty("blaze");
    expect(FIGHTERS).toHaveProperty("titan");
    expect(FIGHTERS).toHaveProperty("phantom");
  });

  it("FIGHTER_IDS debe coincidir con las keys de FIGHTERS", () => {
    expect(FIGHTER_IDS).toEqual(Object.keys(FIGHTERS));
  });
});

describe("getFighterConfig - Busqueda de configuracion", () => {
  it("debe devolver la config correcta para 'blaze'", () => {
    const config = getFighterConfig("blaze");
    expect(config.id).toBe("blaze");
    expect(config.name).toBe("Blaze");
  });

  it("debe devolver la config correcta para 'titan'", () => {
    const config = getFighterConfig("titan");
    expect(config.id).toBe("titan");
    expect(config.name).toBe("Titan");
  });

  it("debe devolver la config correcta para 'phantom'", () => {
    const config = getFighterConfig("phantom");
    expect(config.id).toBe("phantom");
    expect(config.name).toBe("Phantom");
  });

  it("debe devolver blaze como fallback para un ID inexistente", () => {
    const config = getFighterConfig("noexiste");
    expect(config.id).toBe("blaze");
  });

  it("debe devolver blaze para string vacio", () => {
    const config = getFighterConfig("");
    expect(config.id).toBe("blaze");
  });
});

describe("Validacion de stats de cada luchador", () => {
  const attackTypes = [
    "light",
    "heavy",
    "airLight",
    "airHeavy",
    "airUp",
    "special",
  ] as const;

  for (const [id, fighter] of Object.entries(FIGHTERS)) {
    describe(`${fighter.name} (${id})`, () => {
      it("debe tener un id que coincida con su key", () => {
        expect(fighter.id).toBe(id);
      });

      it("debe tener nombre no vacio", () => {
        expect(fighter.name.length).toBeGreaterThan(0);
      });

      it("debe tener speed positivo", () => {
        expect(fighter.speed).toBeGreaterThan(0);
      });

      it("debe tener weight entre 50 y 170 (escala Smash)", () => {
        expect(fighter.weight).toBeGreaterThanOrEqual(50);
        expect(fighter.weight).toBeLessThanOrEqual(170);
      });

      it("debe tener jumpForce negativo (impulso hacia arriba)", () => {
        expect(fighter.jumpForce).toBeLessThan(0);
      });

      it("debe tener al menos 1 salto aereo", () => {
        expect(fighter.airJumps).toBeGreaterThanOrEqual(1);
      });

      it("debe tener width y height positivos", () => {
        expect(fighter.width).toBeGreaterThan(0);
        expect(fighter.height).toBeGreaterThan(0);
      });

      // Validar cada ataque
      for (const attackType of attackTypes) {
        describe(`Ataque: ${attackType}`, () => {
          const attack = fighter.attacks[attackType];

          it("debe existir", () => {
            expect(attack).toBeDefined();
          });

          it("debe tener damage positivo", () => {
            expect(attack.damage).toBeGreaterThan(0);
          });

          it("debe tener baseKnockback >= 0", () => {
            expect(attack.baseKnockback).toBeGreaterThanOrEqual(0);
          });

          it("debe tener knockbackGrowth >= 0", () => {
            expect(attack.knockbackGrowth).toBeGreaterThanOrEqual(0);
          });

          it("debe tener startup, active y recovery positivos", () => {
            expect(attack.startup).toBeGreaterThan(0);
            expect(attack.active).toBeGreaterThan(0);
            expect(attack.recovery).toBeGreaterThan(0);
          });

          it("debe tener hitbox con dimensiones positivas", () => {
            expect(attack.hitboxW).toBeGreaterThan(0);
            expect(attack.hitboxH).toBeGreaterThan(0);
          });
        });
      }
    });
  }
});

describe("Balance entre luchadores", () => {
  it("Blaze debe ser el mas ligero (weight minimo)", () => {
    expect(FIGHTERS.blaze.weight).toBeLessThan(FIGHTERS.titan.weight);
    expect(FIGHTERS.blaze.weight).toBeLessThan(FIGHTERS.phantom.weight);
  });

  it("Titan debe ser el mas pesado", () => {
    expect(FIGHTERS.titan.weight).toBeGreaterThan(FIGHTERS.blaze.weight);
    expect(FIGHTERS.titan.weight).toBeGreaterThan(FIGHTERS.phantom.weight);
  });

  it("Phantom debe ser el mas rapido", () => {
    expect(FIGHTERS.phantom.speed).toBeGreaterThan(FIGHTERS.blaze.speed);
    expect(FIGHTERS.phantom.speed).toBeGreaterThan(FIGHTERS.titan.speed);
  });

  it("Titan debe ser el mas lento", () => {
    expect(FIGHTERS.titan.speed).toBeLessThan(FIGHTERS.blaze.speed);
    expect(FIGHTERS.titan.speed).toBeLessThan(FIGHTERS.phantom.speed);
  });

  it("Titan debe tener super armor en heavy", () => {
    expect(FIGHTERS.titan.superArmor?.heavy).toBe(true);
  });

  it("Blaze y Phantom no deben tener super armor en heavy", () => {
    expect(FIGHTERS.blaze.superArmor?.heavy).toBeFalsy();
    expect(FIGHTERS.phantom.superArmor?.heavy).toBeFalsy();
  });

  it("El heavy de Titan debe hacer mas dano que cualquier otro heavy", () => {
    expect(FIGHTERS.titan.attacks.heavy.damage).toBeGreaterThan(
      FIGHTERS.blaze.attacks.heavy.damage,
    );
    expect(FIGHTERS.titan.attacks.heavy.damage).toBeGreaterThan(
      FIGHTERS.phantom.attacks.heavy.damage,
    );
  });

  it("El light de Phantom debe tener el startup mas rapido", () => {
    expect(FIGHTERS.phantom.attacks.light.startup).toBeLessThanOrEqual(
      FIGHTERS.blaze.attacks.light.startup,
    );
    expect(FIGHTERS.phantom.attacks.light.startup).toBeLessThan(
      FIGHTERS.titan.attacks.light.startup,
    );
  });
});
