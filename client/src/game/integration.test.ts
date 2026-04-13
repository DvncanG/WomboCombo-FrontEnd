import { describe, it, expect, vi, beforeEach } from "vitest";
import { FIGHTERS, FIGHTER_IDS, getFighterConfig } from "./config/fighters";
import type { AttackData, FighterConfig } from "./config/fighters";
import { PHYSICS } from "./config/physics";

// ─────────────────────────────────────────────────────────────────────────────
// Tests de integracion: Fighters + Physics + Combat Logic
//
// Verifican que los modulos funcionan correctamente cuando se combinan:
// las stats reales de los luchadores con las constantes fisicas y las formulas.
// ─────────────────────────────────────────────────────────────────────────────

/** Replica de Fighter.calcSmashKnockback() */
function calcSmashKnockback(
  damage: number,
  attack: AttackData,
  weight: number,
): number {
  const p = damage;
  const d = attack.damage;
  const w = weight;
  return (
    (((p / 10 + (p * d) / 20) * 200 / (w + 100)) * 1.4 + 18) *
      (attack.knockbackGrowth / 100) +
    attack.baseKnockback
  );
}

/** Calcula la velocidad vertical de un golpe */
function calcLaunchVelocityY(kb: number, angleDeg: number): number {
  const angleRad = (angleDeg * Math.PI) / 180;
  return -Math.sin(angleRad) * kb * PHYSICS.KNOCKBACK_FORMULA_SCALE;
}

// ─────────────────────────────────────────────────────────────────────────────

describe("Integracion: fighters config + formula de KB", () => {
  it("el heavy de Titan debe producir mas KB que el heavy de Blaze a mismo %", () => {
    const target = FIGHTERS.phantom; // mismo defensor
    const kbTitan = calcSmashKnockback(80, FIGHTERS.titan.attacks.heavy, target.weight);
    const kbBlaze = calcSmashKnockback(80, FIGHTERS.blaze.attacks.heavy, target.weight);
    expect(kbTitan).toBeGreaterThan(kbBlaze);
  });

  it("Blaze recibe mas KB que Titan al mismo golpe (por diferencia de peso)", () => {
    const attack = FIGHTERS.phantom.attacks.heavy;
    const kbBlaze = calcSmashKnockback(100, attack, FIGHTERS.blaze.weight);
    const kbTitan = calcSmashKnockback(100, attack, FIGHTERS.titan.weight);
    expect(kbBlaze).toBeGreaterThan(kbTitan);
  });

  it("Phantom recibe un KB intermedio entre Blaze y Titan", () => {
    const attack = FIGHTERS.titan.attacks.heavy;
    const kbBlaze = calcSmashKnockback(80, attack, FIGHTERS.blaze.weight);
    const kbPhantom = calcSmashKnockback(80, attack, FIGHTERS.phantom.weight);
    const kbTitan = calcSmashKnockback(80, attack, FIGHTERS.titan.weight);
    expect(kbPhantom).toBeLessThan(kbBlaze);
    expect(kbPhantom).toBeGreaterThan(kbTitan);
  });

  it("todos los ataques de todos los fighters producen KB positivo a 50%", () => {
    for (const [fighterId, fighter] of Object.entries(FIGHTERS)) {
      for (const [atkName, attack] of Object.entries(fighter.attacks)) {
        const kb = calcSmashKnockback(50, attack, 100);
        expect(kb, `${fighterId}.${atkName} produce KB negativo`).toBeGreaterThan(0);
      }
    }
  });
});

describe("Integracion: fighters + physics (blast zones)", () => {
  it("ningun ataque mata a 0% por blast zone superior", () => {
    // A 0% de dano, ningun golpe deberia lanzar lo suficiente para KO vertical
    for (const [fighterId, fighter] of Object.entries(FIGHTERS)) {
      for (const [atkName, attack] of Object.entries(fighter.attacks)) {
        const kb = calcSmashKnockback(0, attack, FIGHTERS.blaze.weight); // Blaze = mas ligero
        const vy = calcLaunchVelocityY(kb, attack.angle);
        // vy negativo = hacia arriba. Un KO seria que suba mas de |BLAST_TOP| desde FLOOR_Y
        // Simplificamos: el impulso inicial no deberia superar la distancia al blast top
        const maxRise = (vy * vy) / (2 * PHYSICS.GRAVITY * 0.01); // estimacion cruda
        expect(
          Math.abs(vy),
          `${fighterId}.${atkName} mata a 0%`,
        ).toBeLessThan(Math.abs(PHYSICS.BLAST_TOP) + PHYSICS.FLOOR_Y);
      }
    }
  });

  it("el heavy de Titan a 200% si deberia producir un KB capaz de matar", () => {
    const kb = calcSmashKnockback(200, FIGHTERS.titan.attacks.heavy, FIGHTERS.blaze.weight);
    // A 200% con el heavy mas fuerte del juego contra el mas ligero, tiene que ser letal
    expect(kb).toBeGreaterThan(100);
  });

  it("los hitboxes de todos los ataques caben dentro de la arena", () => {
    const arenaWidth = PHYSICS.ARENA_WALL_RIGHT - PHYSICS.ARENA_WALL_LEFT;
    for (const [fighterId, fighter] of Object.entries(FIGHTERS)) {
      for (const [atkName, attack] of Object.entries(fighter.attacks)) {
        expect(
          attack.hitboxW,
          `${fighterId}.${atkName} hitbox mas ancho que la arena`,
        ).toBeLessThan(arenaWidth);
      }
    }
  });

  it("ningun startup de ataque es 0 (siempre hay anticipacion)", () => {
    for (const [fighterId, fighter] of Object.entries(FIGHTERS)) {
      for (const [atkName, attack] of Object.entries(fighter.attacks)) {
        expect(
          attack.startup,
          `${fighterId}.${atkName} tiene startup 0`,
        ).toBeGreaterThan(0);
      }
    }
  });
});

describe("Integracion: getFighterConfig + formula KB (flujo completo)", () => {
  it("el flujo completo: buscar config -> calcular KB -> verificar resultado", () => {
    // Simula lo que hace GameScene: busca la config del personaje seleccionado
    const attackerConfig = getFighterConfig("titan");
    const defenderConfig = getFighterConfig("blaze");

    // Calcula el KB del heavy de Titan contra Blaze a 80%
    const kb = calcSmashKnockback(
      80,
      attackerConfig.attacks.heavy,
      defenderConfig.weight,
    );

    // El resultado debe ser un numero positivo y significativo
    expect(kb).toBeGreaterThan(50);
    expect(kb).toBeLessThan(500); // no deberia ser absurdo
  });

  it("un ID invalido usa blaze como fallback y sigue funcionando", () => {
    const fallback = getFighterConfig("personaje_que_no_existe");
    expect(fallback.id).toBe("blaze");

    // La formula sigue funcionando con la config de fallback
    const kb = calcSmashKnockback(50, fallback.attacks.light, fallback.weight);
    expect(kb).toBeGreaterThan(0);
    expect(Number.isFinite(kb)).toBe(true);
  });

  it("todos los fighter IDs del roster devuelven configs validas", () => {
    for (const id of FIGHTER_IDS) {
      const config = getFighterConfig(id);
      expect(config.id).toBe(id);
      expect(config.attacks).toBeDefined();
      expect(Object.keys(config.attacks)).toHaveLength(6);
    }
  });
});

describe("Integracion: balance cruzado entre luchadores", () => {
  // Verifica que el balance del juego es coherente usando datos reales

  it("el DPS teorico de Phantom (rapido) supera al de Titan (lento)", () => {
    // DPS = damage / (startup + active + recovery) * 1000
    const phantomDPS =
      (FIGHTERS.phantom.attacks.light.damage /
        (FIGHTERS.phantom.attacks.light.startup +
          FIGHTERS.phantom.attacks.light.active +
          FIGHTERS.phantom.attacks.light.recovery)) *
      1000;
    const titanDPS =
      (FIGHTERS.titan.attacks.light.damage /
        (FIGHTERS.titan.attacks.light.startup +
          FIGHTERS.titan.attacks.light.active +
          FIGHTERS.titan.attacks.light.recovery)) *
      1000;
    expect(phantomDPS).toBeGreaterThan(titanDPS);
  });

  it("Titan compensa su lentitud con mas dano por golpe en heavys", () => {
    expect(FIGHTERS.titan.attacks.heavy.damage).toBeGreaterThan(
      FIGHTERS.blaze.attacks.heavy.damage,
    );
    expect(FIGHTERS.titan.attacks.heavy.damage).toBeGreaterThan(
      FIGHTERS.phantom.attacks.heavy.damage,
    );
  });

  it("los 3 luchadores tienen el mismo numero de ataques (6)", () => {
    for (const fighter of Object.values(FIGHTERS)) {
      expect(Object.keys(fighter.attacks)).toHaveLength(6);
    }
  });

  it("cada luchador tiene al menos un ataque smashable (chargeable)", () => {
    for (const [id, fighter] of Object.entries(FIGHTERS)) {
      const hasSmashable = Object.values(fighter.attacks).some(
        (atk) => atk.isSmashable === true,
      );
      expect(hasSmashable, `${id} no tiene ningun ataque smashable`).toBe(true);
    }
  });

  it("el peso de todos los luchadores esta dentro del rango de la formula", () => {
    // La formula usa 200/(w+100), asi que w no puede ser negativo
    for (const fighter of Object.values(FIGHTERS)) {
      expect(fighter.weight).toBeGreaterThan(0);
      expect(fighter.weight + 100).toBeGreaterThan(0); // denominador positivo
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integracion: API Client + Auth Store (flujo completo)
// ─────────────────────────────────────────────────────────────────────────────

vi.mock("../lib/stores/auth.svelte", () => ({
  auth: { token: null as string | null },
}));

vi.stubEnv("VITE_API_URL", "http://test-api.com/api");

import { apiRequest } from "../lib/api/client";
import { auth } from "../lib/stores/auth.svelte";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  (auth as any).token = null;
});

describe("Integracion: flujo completo de autenticacion API", () => {
  it("peticion sin token -> 401 -> set token -> peticion con token OK", async () => {
    // Paso 1: sin token, el servidor rechaza
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });

    await expect(apiRequest("/profile")).rejects.toThrow("API 401");

    // Paso 2: el usuario hace login, se guarda el token
    (auth as any).token = "jwt-token-valido";

    // Paso 3: ahora la peticion lleva el Bearer y el servidor acepta
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, username: "player1" }),
    });

    const profile = await apiRequest<{ id: number; username: string }>("/profile");
    expect(profile.username).toBe("player1");

    // Verificar que la segunda peticion lleva el token
    const [, options] = mockFetch.mock.calls[1];
    expect(options.headers["Authorization"]).toBe("Bearer jwt-token-valido");
  });

  it("multiples peticiones con token mantienen el header consistente", async () => {
    (auth as any).token = "mi-token";

    for (let i = 0; i < 3; i++) {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      });
      await apiRequest(`/endpoint-${i}`);
    }

    // Todas las peticiones deben tener el mismo token
    expect(mockFetch).toHaveBeenCalledTimes(3);
    for (let i = 0; i < 3; i++) {
      const [, opts] = mockFetch.mock.calls[i];
      expect(opts.headers["Authorization"]).toBe("Bearer mi-token");
    }
  });

  it("POST de login seguido de GET autenticado", async () => {
    // Simular login
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "nuevo-token-123", user: { id: 1 } }),
    });

    const loginResult = await apiRequest<{ token: string }>("/auth/login", {
      method: "POST",
      body: { email: "test@test.com", password: "secret" },
    });

    // Verificar que el POST se envio correctamente
    const [, loginOpts] = mockFetch.mock.calls[0];
    expect(loginOpts.method).toBe("POST");
    expect(JSON.parse(loginOpts.body).email).toBe("test@test.com");

    // Ahora el "frontend" guarda el token recibido
    (auth as any).token = loginResult.token;

    // Y hace una peticion autenticada
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rooms: [] }),
    });

    await apiRequest("/rooms");

    const [, roomOpts] = mockFetch.mock.calls[1];
    expect(roomOpts.headers["Authorization"]).toBe("Bearer nuevo-token-123");
  });
});
