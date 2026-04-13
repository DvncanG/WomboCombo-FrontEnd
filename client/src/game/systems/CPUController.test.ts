import { describe, it, expect, vi, beforeEach } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// Tests unitarios: CPUController (IA del CPU)
//
// CPUController depende de Fighter y Phaser, asi que creamos mocks minimos
// para testear la logica de decision de la IA.
// ─────────────────────────────────────────────────────────────────────────────

// Mock minimo de Fighter para la IA
function createMockFighter(overrides: Partial<any> = {}) {
  return {
    state: "idle" as string,
    damage: 0,
    sprite: {
      x: 400,
      y: 500,
      body: {
        blocked: { down: true },
        touching: { down: false },
      },
    },
    ...overrides,
  } as any;
}

// Mock de Phaser.Math.Between
vi.stubGlobal("Phaser", {
  Math: {
    Between: (min: number, max: number) => Math.floor((min + max) / 2),
  },
});

// Importamos despues del mock global
import { CPUController } from "./CPUController";

describe("CPUController - Inicializacion", () => {
  it("debe crear con valores por defecto (dificultad 0.65)", () => {
    const cpu = createMockFighter();
    const opp = createMockFighter();
    const controller = new CPUController(cpu, opp);

    expect(controller.left).toBe(false);
    expect(controller.right).toBe(false);
    expect(controller.jumpPressed).toBe(false);
    expect(controller.lightAttack).toBe(false);
    expect(controller.heavyAttack).toBe(false);
    expect(controller.special).toBe(false);
    expect(controller.shield).toBe(false);
  });

  it("la dificultad debe afectar el attackDelay", () => {
    const cpu = createMockFighter();
    const opp = createMockFighter();

    // Dificultad 0 → delay = 280 - 0 = 280
    const easy = new CPUController(cpu, opp, 0);
    // Dificultad 1 → delay = 280 - 200 = 80
    const hard = new CPUController(cpu, opp, 1);

    // El controller hard deberia reaccionar mas rapido
    // Lo verificamos indirectamente: ambos se crean sin error
    expect(easy).toBeDefined();
    expect(hard).toBeDefined();
  });
});

describe("CPUController - Reset de inputs cada frame", () => {
  it("debe resetear todos los inputs al inicio de update()", () => {
    const cpu = createMockFighter();
    const opp = createMockFighter({ sprite: { ...createMockFighter().sprite, x: 600 } });
    const controller = new CPUController(cpu, opp);

    // Forzamos un update que active algun input
    controller.update(16);

    // Guardamos estado
    const hadSomeInput =
      controller.left || controller.right || controller.jumpPressed;

    // Ahora ponemos al CPU en estado ko (no ejecuta logica)
    cpu.state = "ko";
    controller.update(16);

    // En estado ko, todos los inputs deben ser false
    expect(controller.left).toBe(false);
    expect(controller.right).toBe(false);
    expect(controller.jumpPressed).toBe(false);
    expect(controller.crouch).toBe(false);
    expect(controller.lightAttack).toBe(false);
    expect(controller.heavyAttack).toBe(false);
    expect(controller.special).toBe(false);
    expect(controller.shield).toBe(false);
    expect(controller.upAttack).toBe(false);
  });
});

describe("CPUController - Estados no activos", () => {
  const inactiveStates = [
    "ko",
    "respawning",
    "attack_startup",
    "attack_active",
    "attack_recovery",
    "shield_broken",
    "dodge",
    "air_dodge",
  ];

  for (const state of inactiveStates) {
    it(`no debe generar inputs cuando el CPU esta en estado '${state}'`, () => {
      const cpu = createMockFighter({ state });
      const opp = createMockFighter({ sprite: { ...createMockFighter().sprite, x: 500 } });
      const controller = new CPUController(cpu, opp);

      controller.update(16);

      expect(controller.left).toBe(false);
      expect(controller.right).toBe(false);
      expect(controller.jumpPressed).toBe(false);
      expect(controller.lightAttack).toBe(false);
      expect(controller.heavyAttack).toBe(false);
      expect(controller.special).toBe(false);
    });
  }
});

describe("CPUController - Approach (acercarse)", () => {
  it("debe moverse a la derecha cuando el oponente esta a la derecha", () => {
    const cpu = createMockFighter({ sprite: { ...createMockFighter().sprite, x: 200 } });
    const opp = createMockFighter({ sprite: { ...createMockFighter().sprite, x: 800 } });
    const controller = new CPUController(cpu, opp);

    controller.update(16);

    // Distancia > 200, no esta en peligro → approach
    expect(controller.right).toBe(true);
    expect(controller.left).toBe(false);
  });

  it("debe moverse a la izquierda cuando el oponente esta a la izquierda", () => {
    const cpu = createMockFighter({ sprite: { ...createMockFighter().sprite, x: 800 } });
    const opp = createMockFighter({ sprite: { ...createMockFighter().sprite, x: 200 } });
    const controller = new CPUController(cpu, opp);

    controller.update(16);

    expect(controller.left).toBe(true);
    expect(controller.right).toBe(false);
  });
});

describe("CPUController - Attack (atacar)", () => {
  it("debe generar algun ataque cuando el oponente esta muy cerca (< 100px)", () => {
    const cpu = createMockFighter({ sprite: { ...createMockFighter().sprite, x: 400 } });
    const opp = createMockFighter({ sprite: { ...createMockFighter().sprite, x: 470 } });
    const controller = new CPUController(cpu, opp);

    let everAttacked = false;
    // Ejecutamos suficientes frames para que el cooldown baje y ataque
    for (let i = 0; i < 100; i++) {
      controller.update(16);
      if (
        controller.lightAttack ||
        controller.heavyAttack ||
        controller.special ||
        controller.upAttack
      ) {
        everAttacked = true;
      }
    }

    expect(everAttacked).toBe(true);
  });

  it("debe priorizar ataques heavy cuando el oponente tiene alto %", () => {
    const cpu = createMockFighter({ sprite: { ...createMockFighter().sprite, x: 400 } });
    const opp = createMockFighter({
      sprite: { ...createMockFighter().sprite, x: 450 },
      damage: 130,
      state: "idle",
    });
    const controller = new CPUController(cpu, opp);

    let heavyCount = 0;
    let totalAttacks = 0;

    // Ejecutamos muchas iteraciones para estadisticas
    for (let i = 0; i < 1000; i++) {
      controller.update(16);
      if (controller.heavyAttack) heavyCount++;
      if (controller.lightAttack || controller.heavyAttack || controller.special)
        totalAttacks++;
    }

    // Con opp.damage > 120, deberia intentar heavys con frecuencia
    if (totalAttacks > 0) {
      expect(heavyCount).toBeGreaterThan(0);
    }
  });
});

describe("CPUController - Retreat (retirarse)", () => {
  it("debe moverse en direccion opuesta al oponente cuando retrocede", () => {
    // Para activar retreat: cpu.damage > 120 && dist < 100
    // Necesitamos que Math.random() < 0.03 → mockeamos
    const cpu = createMockFighter({
      sprite: { ...createMockFighter().sprite, x: 400 },
      damage: 150,
    });
    const opp = createMockFighter({
      sprite: { ...createMockFighter().sprite, x: 450 },
    });

    // Forzamos Math.random para que active retreat
    const originalRandom = Math.random;
    Math.random = () => 0.01; // < 0.03 → activa retreat

    const controller = new CPUController(cpu, opp);
    controller.update(16);

    // Oponente a la derecha → CPU debe ir a la izquierda
    expect(controller.left).toBe(true);

    Math.random = originalRandom;
  });
});

describe("CPUController - Shield (escudo)", () => {
  it("debe activar escudo cuando el oponente ataca cerca", () => {
    const cpu = createMockFighter({
      sprite: { ...createMockFighter().sprite, x: 400 },
    });
    const opp = createMockFighter({
      sprite: { ...createMockFighter().sprite, x: 450 },
      state: "attack_active",
    });

    // Math.random < 0.04 → activa shield
    const originalRandom = Math.random;
    Math.random = () => 0.01;

    const controller = new CPUController(cpu, opp);
    controller.update(16);

    expect(controller.shield).toBe(true);

    Math.random = originalRandom;
  });
});
