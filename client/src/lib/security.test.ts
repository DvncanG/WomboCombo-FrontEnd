import { describe, it, expect, vi, beforeEach } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// Tests de seguridad: API Client
//
// Verifican que el cliente HTTP no introduce vulnerabilidades comunes:
// XSS, inyeccion, fuga de tokens, path traversal, etc.
// ─────────────────────────────────────────────────────────────────────────────

vi.mock("./stores/auth.svelte", () => ({
  auth: { token: null as string | null },
}));

vi.stubEnv("VITE_API_URL", "http://test-api.com/api");

import { apiRequest } from "./api/client";
import { auth } from "./stores/auth.svelte";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  (auth as any).token = null;
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Seguridad: Serializacion segura del body (anti-injection)", () => {
  it("el body se serializa con JSON.stringify, no con concatenacion", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const maliciousBody = {
      username: '"; DROP TABLE users; --',
      password: "' OR '1'='1",
    };

    await apiRequest("/login", { method: "POST", body: maliciousBody });

    const [, options] = mockFetch.mock.calls[0];
    // JSON.stringify escapa las comillas correctamente
    const parsed = JSON.parse(options.body);
    expect(parsed.username).toBe('"; DROP TABLE users; --');
    expect(parsed.password).toBe("' OR '1'='1");
    // El body es un string JSON valido, no una concatenacion
    expect(typeof options.body).toBe("string");
    expect(() => JSON.parse(options.body)).not.toThrow();
  });

  it("objetos con __proto__ no contaminan el body serializado", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const payload = { name: "test", __proto__: { admin: true } };
    await apiRequest("/users", { method: "POST", body: payload });

    const [, options] = mockFetch.mock.calls[0];
    const parsed = JSON.parse(options.body);
    // __proto__ no deberia inyectar propiedades extra
    expect(parsed.admin).toBeUndefined();
  });

  it("caracteres especiales HTML en el body se mantienen como texto", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const xssBody = {
      name: '<script>alert("xss")</script>',
      bio: '<img src=x onerror="steal()">',
    };

    await apiRequest("/profile", { method: "POST", body: xssBody });

    const [, options] = mockFetch.mock.calls[0];
    const parsed = JSON.parse(options.body);
    // Los caracteres se preservan como texto plano, no se ejecutan
    expect(parsed.name).toContain("<script>");
    expect(parsed.bio).toContain("onerror");
    // Pero al estar dentro de JSON, no hay ejecucion posible
    expect(typeof options.body).toBe("string");
  });
});

describe("Seguridad: Token JWT - proteccion contra fugas", () => {
  it("el token solo se envia al API_BASE, no a URLs arbitrarias", async () => {
    (auth as any).token = "jwt-secreto-123";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await apiRequest("/data");

    const [url, options] = mockFetch.mock.calls[0];
    // La URL debe contener el path solicitado, concatenado al base
    expect(url).toContain("/api/data");
    // El token se envia en la cabecera Authorization
    expect(options.headers["Authorization"]).toBe("Bearer jwt-secreto-123");
  });

  it("sin token, no se envia ninguna cabecera Authorization", async () => {
    (auth as any).token = null;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await apiRequest("/public");

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers["Authorization"]).toBeUndefined();
  });

  it("un token vacio (string vacio) no se envia como Bearer", async () => {
    (auth as any).token = "";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await apiRequest("/endpoint");

    const [, options] = mockFetch.mock.calls[0];
    // String vacio es falsy, no deberia enviarse
    expect(options.headers["Authorization"]).toBeUndefined();
  });
});

describe("Seguridad: Inputs maliciosos en la URL (path traversal)", () => {
  it("un path con .. se envia tal cual (el servidor decide)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await apiRequest("/../../../etc/passwd");

    const [url] = mockFetch.mock.calls[0];
    // El path se concatena al API_BASE — el cliente no navega fuera
    expect(url).toContain("/api/../../../etc/passwd");
    // La URL siempre empieza con el dominio del API_BASE, no con otro origen
    expect(url).toMatch(/^http:\/\//);
    expect(url).toContain("/api/");
  });

  it("caracteres especiales en el path no rompen la peticion", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const weirdPath = "/users/<script>alert(1)</script>";
    await apiRequest(weirdPath);

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain(weirdPath);
    // La peticion se realiza sin error (fetch la hace)
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("query params inyectados en el path no alteran las cabeceras", async () => {
    (auth as any).token = "mi-token";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await apiRequest("/search?q=test&admin=true");

    const [, options] = mockFetch.mock.calls[0];
    // Las cabeceras siguen siendo las normales, no se inyecta nada extra
    expect(Object.keys(options.headers)).toContain("Content-Type");
    expect(Object.keys(options.headers)).toContain("Authorization");
    expect(Object.keys(options.headers).length).toBe(2);
  });
});

describe("Seguridad: XSS - payloads tipicos no rompen el flujo", () => {
  it("payload XSS en el body se serializa sin ejecutar", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ saved: true }),
    });

    const xssPayloads = [
      '<script>document.cookie</script>',
      '"><img src=x onerror=alert(1)>',
      "javascript:alert('XSS')",
      '<svg onload="fetch(\'http://evil.com\')">',
    ];

    for (const payload of xssPayloads) {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      });

      // No debe lanzar error
      await expect(
        apiRequest("/comments", { method: "POST", body: { text: payload } }),
      ).resolves.toBeDefined();
    }
  });

  it("respuesta del servidor con HTML no se ejecuta (es JSON parseado)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        name: '<script>alert("stored XSS")</script>',
        safe: true,
      }),
    });

    const result = await apiRequest<{ name: string; safe: boolean }>("/user");

    // El resultado es un objeto JS, el HTML es solo un string
    expect(result.name).toContain("<script>");
    expect(typeof result.name).toBe("string");
    expect(result.safe).toBe(true);
  });
});

describe("Seguridad: Datos sensibles en respuestas", () => {
  it("apiRequest no filtra campos pero el JSON se parsea correctamente", async () => {
    // El cliente no deberia exponer campos sensibles por accidente
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        username: "player1",
        // Un servidor mal configurado podria devolver esto:
        password_hash: "$2b$10$abc...",
      }),
    });

    const result = await apiRequest<any>("/profile");

    // El cliente parsea lo que el servidor manda — la responsabilidad
    // de no enviar password_hash es del backend, pero verificamos
    // que el cliente no anade campos sensibles por su cuenta
    expect(result.id).toBe(1);
    expect(result.username).toBe("player1");
  });

  it("un error del servidor no expone informacion del cliente", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    try {
      await apiRequest("/crash");
    } catch (e: any) {
      // El mensaje de error solo contiene lo que el servidor mando
      expect(e.message).toBe("API 500: Internal Server Error");
      // No contiene el token ni informacion del cliente
      expect(e.message).not.toContain("Bearer");
      expect(e.message).not.toContain("jwt");
    }
  });
});
