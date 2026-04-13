import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// Tests unitarios: API Client (client.ts)
//
// Mockeamos fetch() y el store de auth para testear la logica de peticiones.
// ─────────────────────────────────────────────────────────────────────────────

// Mock del modulo auth
vi.mock("../stores/auth.svelte", () => ({
  auth: {
    token: null as string | null,
  },
}));

// Mock de import.meta.env
vi.stubEnv("VITE_API_URL", "http://test-api.com/api");

import { apiRequest, api } from "./client";
import { auth } from "../stores/auth.svelte";

// Mock de fetch global
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  (auth as any).token = null;
});

describe("apiRequest - Peticiones basicas", () => {
  it("debe hacer un GET por defecto", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: "test" }),
    });

    const result = await apiRequest("/test");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/test");
    expect(options.method).toBe("GET");
  });

  it("debe enviar Content-Type application/json siempre", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await apiRequest("/test");

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers["Content-Type"]).toBe("application/json");
  });

  it("debe parsear la respuesta como JSON", async () => {
    const expected = { id: 1, name: "Blaze" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => expected,
    });

    const result = await apiRequest("/fighters/1");

    expect(result).toEqual(expected);
  });
});

describe("apiRequest - Autenticacion", () => {
  it("no debe incluir Authorization si no hay token", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await apiRequest("/public");

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers["Authorization"]).toBeUndefined();
  });

  it("debe incluir Authorization Bearer cuando hay token", async () => {
    (auth as any).token = "mi-jwt-token-123";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await apiRequest("/protected");

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers["Authorization"]).toBe("Bearer mi-jwt-token-123");
  });
});

describe("apiRequest - POST con body", () => {
  it("debe enviar el body serializado como JSON", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const body = { username: "player1", password: "secret" };
    await apiRequest("/login", { method: "POST", body });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(options.body).toBe(JSON.stringify(body));
  });

  it("no debe enviar body si no se proporciona", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await apiRequest("/test");

    const [, options] = mockFetch.mock.calls[0];
    expect(options.body).toBeUndefined();
  });
});

describe("apiRequest - Manejo de errores", () => {
  it("debe lanzar error con el codigo de estado para respuestas no-ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });

    await expect(apiRequest("/protected")).rejects.toThrow("API 401: Unauthorized");
  });

  it("debe lanzar error 404", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => "Not Found",
    });

    await expect(apiRequest("/noexiste")).rejects.toThrow("API 404");
  });

  it("debe lanzar error 500", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    await expect(apiRequest("/crash")).rejects.toThrow("API 500");
  });
});

describe("api shortcuts - Atajos de conveniencia", () => {
  it("api.get debe llamar con metodo GET", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ fighters: [] }),
    });

    await api.get("/fighters");

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("GET");
  });

  it("api.post debe llamar con metodo POST y body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "room-123" }),
    });

    await api.post("/rooms", { name: "Mi sala" });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(options.body).toBe(JSON.stringify({ name: "Mi sala" }));
  });

  it("api.patch debe llamar con metodo PATCH y body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ updated: true }),
    });

    await api.patch("/users/1", { name: "NuevoNombre" });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("PATCH");
    expect(options.body).toBe(JSON.stringify({ name: "NuevoNombre" }));
  });
});
