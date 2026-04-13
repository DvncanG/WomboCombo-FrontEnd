# Plan de Pruebas de Software - WomboKombo

## 1. Informacion del proyecto

| Campo | Valor |
|---|---|
| **Proyecto** | WomboKombo - Juego de lucha estilo Smash Bros |
| **Version** | 0.1.0 |
| **Tecnologias** | Svelte 5, Phaser 3, TypeScript, Vite |
| **Framework de testing** | Vitest 4.x |
| **Responsable QA** | Julian (Desarrollo + QA) |
| **Fecha** | 10/04/2026 |

---

## 2. Objetivos del plan de pruebas

1. **Verificar la correctitud** de las formulas de combate (knockback, hitstun, hitlag).
2. **Validar la integridad** de las configuraciones de los luchadores y constantes fisicas.
3. **Asegurar el correcto funcionamiento** de la IA del CPU y sus decisiones.
4. **Comprobar que el cliente API** maneja correctamente las peticiones, autenticacion y errores.
5. **Detectar errores de balance** entre luchadores mediante pruebas comparativas.
6. **Garantizar la calidad** del software antes de la entrega final.

---

## 3. Alcance

### Funcionalidades a testear

| Modulo | Archivo | Descripcion |
|---|---|---|
| Config. Luchadores | `src/game/config/fighters.ts` | Registro de fighters, getFighterConfig(), validacion de stats |
| Config. Fisicas | `src/game/config/physics.ts` | Constantes de gravedad, arena, escudo, knockback, burst |
| Logica de combate | `src/game/entities/Fighter.ts` | Formula de knockback, condiciones de KO, hitstun, hitlag |
| IA del CPU | `src/game/systems/CPUController.ts` | Estados de la IA, toma de decisiones, inputs |
| Cliente API | `src/lib/api/client.ts` | Peticiones HTTP, auth headers, manejo de errores |

### Funcionalidades fuera de alcance (no testeadas automaticamente)

- Renderizado grafico (Phaser scenes, sprites, animaciones)
- Componentes UI de Svelte (formularios, navegacion)
- Comunicacion WebSocket en tiempo real
- Tests E2E / integracion con servidor

---

## 4. Estrategia de pruebas

### 4.1 Tipos de pruebas realizadas

| Tipo | Forma | Metodo | Descripcion |
|---|---|---|---|
| **Unitarias** | Automatizado | Caja Blanca | Tests de funciones individuales con Vitest |
| **Validacion de datos** | Automatizado | Caja Blanca | Verificacion de configuraciones y constantes |
| **Humo (Smoke)** | Manual | Caja Negra | Verificacion basica de que el juego carga y funciona |
| **Funcionales** | Manual | Caja Negra | Prueba de flujos de usuario (login, seleccion, combate) |

### 4.2 Orden de ejecucion

1. Pruebas unitarias automatizadas (`npm test`)
2. Pruebas de humo manuales
3. Pruebas funcionales manuales
4. Pruebas de regresion (re-ejecutar unitarias tras cambios)

---

## 5. Entorno de pruebas

| Componente | Detalle |
|---|---|
| **SO** | Windows 11 Pro |
| **Node.js** | v18+ |
| **Framework** | Vitest 4.x (integrado con Vite) |
| **Comando** | `npm test` (ejecuta `vitest run`) |
| **Navegador (manual)** | Chrome / Firefox (ultima version) |

---

## 6. Matriz de casos de prueba

| Id | Tipo de prueba | Nombre de la prueba | Modulo | Responsable | Estado |
|---|---|---|---|---|---|
| CP-01 | Unitaria (Auto) | Validar getFighterConfig() con IDs validos e invalidos | fighters.ts | Julian | Cerrado |
| CP-02 | Unitaria (Auto) | Validar stats de los 3 luchadores (peso, velocidad, ataques) | fighters.ts | Julian | Cerrado |
| CP-03 | Unitaria (Auto) | Verificar balance entre luchadores (Titan mas pesado, Phantom mas rapido) | fighters.ts | Julian | Cerrado |
| CP-04 | Unitaria (Auto) | Validar constantes fisicas de la arena (dimensiones, paredes, suelo) | physics.ts | Julian | Cerrado |
| CP-05 | Unitaria (Auto) | Validar constantes del escudo (HP, decay, regen, stun) | physics.ts | Julian | Cerrado |
| CP-06 | Unitaria (Auto) | Validar constantes de dodge, smash charge y burst | physics.ts | Julian | Cerrado |
| CP-07 | Unitaria (Auto) | Validar constantes de knockback, hitstun y KO | physics.ts | Julian | Cerrado |
| CP-08 | Unitaria (Auto) | Formula de knockback: escala con % de dano | Fighter.ts | Julian | Cerrado |
| CP-09 | Unitaria (Auto) | Formula de knockback: mas peso = menos KB | Fighter.ts | Julian | Cerrado |
| CP-10 | Unitaria (Auto) | Condiciones de KO: blast zone superior y umbral de dano | Fighter.ts | Julian | Cerrado |
| CP-11 | Unitaria (Auto) | Hitstun: decay anti-infinito por combos consecutivos | Fighter.ts | Julian | Cerrado |
| CP-12 | Unitaria (Auto) | Hitlag: formula correcta segun dano del ataque | Fighter.ts | Julian | Cerrado |
| CP-13 | Unitaria (Auto) | Vectores de knockback: angulos 0, 90, 270 grados | Fighter.ts | Julian | Cerrado |
| CP-14 | Unitaria (Auto) | CPU: estados inactivos no generan inputs | CPUController.ts | Julian | Cerrado |
| CP-15 | Unitaria (Auto) | CPU: approach se mueve hacia el oponente | CPUController.ts | Julian | Cerrado |
| CP-16 | Unitaria (Auto) | CPU: ataca cuando el oponente esta cerca | CPUController.ts | Julian | Cerrado |
| CP-17 | Unitaria (Auto) | CPU: prioriza heavy cuando oponente tiene alto % | CPUController.ts | Julian | Cerrado |
| CP-18 | Unitaria (Auto) | CPU: retreat y shield funcionan correctamente | CPUController.ts | Julian | Cerrado |
| CP-19 | Unitaria (Auto) | API: peticiones GET/POST/PATCH con metodo correcto | client.ts | Julian | Cerrado |
| CP-20 | Unitaria (Auto) | API: inyeccion de token Bearer en headers | client.ts | Julian | Cerrado |
| CP-21 | Unitaria (Auto) | API: manejo de errores 401, 404, 500 | client.ts | Julian | Cerrado |
| CP-22 | Funcional (Manual) | Registro de usuario con datos validos | UI/Register | Julian | Cerrado |
| CP-23 | Funcional (Manual) | Login con credenciales correctas e incorrectas | UI/Login | Julian | Cerrado |
| CP-24 | Funcional (Manual) | Seleccion de personaje y escenario | UI/CharacterSelect | Julian | Cerrado |
| CP-25 | Funcional (Manual) | Combate completo contra CPU (3 stocks) | Game/ArenaScene | Julian | Cerrado |
| CP-26 | Humo (Manual) | La aplicacion carga sin errores en consola | General | Julian | Cerrado |
| CP-27 | Humo (Manual) | Navegacion entre todas las pantallas funciona | UI/Router | Julian | Cerrado |

---

## 7. Resultados

### Tests automatizados

```
Framework: Vitest 4.x
Archivos de test: 5
Tests totales: 233
Tests pasados: 233 (100%)
Tests fallidos: 0
Tiempo de ejecucion: ~200ms
```

### Comando para ejecutar

```bash
cd client
npm test
```

---

## 8. Conclusiones

- Se han implementado **233 pruebas unitarias automatizadas** cubriendo los modulos criticos del juego.
- Las formulas de combate (knockback, hitstun, hitlag) han sido verificadas matematicamente.
- La IA del CPU responde correctamente a diferentes situaciones de combate.
- El cliente API gestiona la autenticacion y errores de forma robusta.
- El balance entre luchadores (Blaze, Titan, Phantom) cumple las especificaciones de diseno.
- Se recomienda ampliar las pruebas con tests E2E (Cypress/Playwright) en futuras iteraciones.
