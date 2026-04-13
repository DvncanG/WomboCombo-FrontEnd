# Casos de Prueba - WomboKombo

Fichas individuales de casos de prueba siguiendo el formato estandar de QA.

---

## CP-01: Validar getFighterConfig() con IDs validos e invalidos

| Campo | Valor |
|---|---|
| **IdPrueba** | CP-01 |
| **Tipo de prueba** | Unitaria (Automatizada) |
| **Titulo** | Validar getFighterConfig() con IDs validos e invalidos |
| **Descripcion** | Verificar que la funcion getFighterConfig() devuelve la configuracion correcta para IDs existentes y el fallback (blaze) para IDs inexistentes |
| **Prerrequisitos** | Tener el proyecto con dependencias instaladas (`npm install`) |
| **Pasos** | 1. Llamar a getFighterConfig("blaze") y verificar que devuelve config con id="blaze". 2. Llamar a getFighterConfig("titan") y verificar id="titan". 3. Llamar a getFighterConfig("phantom") y verificar id="phantom". 4. Llamar a getFighterConfig("noexiste") y verificar que devuelve blaze. 5. Llamar a getFighterConfig("") y verificar que devuelve blaze. |
| **Resultados esperados** | Cada llamada devuelve la config correcta; IDs invalidos devuelven la config de blaze como fallback |
| **Ambiente** | Node.js + Vitest (local) |
| **Importancia** | Alta |
| **Responsable** | Julian |
| **Asignado a** | Julian |
| **Estado** | Cerrado |
| **Resultados** | Todos los tests pasan correctamente. getFighterConfig devuelve la config esperada para los 3 fighters y blaze como fallback. |
| **Conclusiones** | La funcion de busqueda de configuracion funciona correctamente con un fallback seguro. |

---

## CP-08: Formula de knockback escala con % de dano

| Campo | Valor |
|---|---|
| **IdPrueba** | CP-08 |
| **Tipo de prueba** | Unitaria (Automatizada) |
| **Titulo** | Formula de knockback: escala con porcentaje de dano |
| **Descripcion** | Verificar que la formula de knockback estilo Smash Bros produce valores mayores a medida que el porcentaje de dano del defensor aumenta |
| **Prerrequisitos** | Tener el proyecto con dependencias instaladas |
| **Pasos** | 1. Calcular KB con dano=0%, ataque light de Blaze, peso de Blaze. 2. Calcular KB con dano=50%. 3. Calcular KB con dano=100%. 4. Verificar que KB(50%) > KB(0%). 5. Verificar que KB(100%) > KB(50%). |
| **Resultados esperados** | El knockback aumenta proporcionalmente con el porcentaje de dano del defensor |
| **Ambiente** | Node.js + Vitest (local) |
| **Importancia** | Critica |
| **Responsable** | Julian |
| **Asignado a** | Julian |
| **Estado** | Cerrado |
| **Resultados** | La formula produce valores crecientes: KB(0%)=25.8, KB(50%)=40.2, KB(100%)=62.4 (valores aproximados para el light de Blaze). |
| **Conclusiones** | La formula de knockback escala correctamente, clave para la mecanica de combate tipo Smash Bros. |

---

## CP-09: Mas peso = menos knockback

| Campo | Valor |
|---|---|
| **IdPrueba** | CP-09 |
| **Tipo de prueba** | Unitaria (Automatizada) |
| **Titulo** | Formula de knockback: mas peso = menos KB |
| **Descripcion** | Verificar que un luchador mas pesado recibe menos knockback que uno mas ligero con el mismo ataque y porcentaje de dano |
| **Prerrequisitos** | Tener el proyecto con dependencias instaladas |
| **Pasos** | 1. Calcular KB para peso=75 (Blaze) con dano=80%. 2. Calcular KB para peso=145 (Titan) con dano=80%. 3. Verificar que KB(peso=75) > KB(peso=145). |
| **Resultados esperados** | El luchador ligero (Blaze, weight=75) recibe mas knockback que el pesado (Titan, weight=145) |
| **Ambiente** | Node.js + Vitest (local) |
| **Importancia** | Critica |
| **Responsable** | Julian |
| **Asignado a** | Julian |
| **Estado** | Cerrado |
| **Resultados** | KB(75)=47.3 vs KB(145)=33.1 (aprox). El luchador ligero recibe ~43% mas knockback. |
| **Conclusiones** | El peso funciona como mecanica defensiva: Titan sobrevive mas tiempo gracias a su mayor peso. |

---

## CP-10: Condiciones de KO

| Campo | Valor |
|---|---|
| **IdPrueba** | CP-10 |
| **Tipo de prueba** | Unitaria (Automatizada) |
| **Titulo** | Condiciones de KO: blast zone superior y umbral de dano |
| **Descripcion** | Verificar que un luchador es eliminado (KO) cuando supera la blast zone superior (y < -400) o cuando su dano alcanza el umbral de 300% |
| **Prerrequisitos** | Tener el proyecto con dependencias instaladas |
| **Pasos** | 1. Evaluar checkBlastZones(400, 50) → false (posicion y dano normales). 2. Evaluar checkBlastZones(-401, 0) → true (fuera de blast zone). 3. Evaluar checkBlastZones(-400, 0) → false (justo en el limite). 4. Evaluar checkBlastZones(400, 300) → true (dano en umbral). 5. Evaluar checkBlastZones(400, 299) → false (justo debajo del umbral). |
| **Resultados esperados** | KO solo se produce al superar la blast zone o alcanzar el umbral de dano |
| **Ambiente** | Node.js + Vitest (local) |
| **Importancia** | Critica |
| **Responsable** | Julian |
| **Asignado a** | Julian |
| **Estado** | Cerrado |
| **Resultados** | Todas las condiciones de borde funcionan correctamente. El sistema de KO es preciso. |
| **Conclusiones** | Las dos vias de KO (blast zone y umbral de dano) estan implementadas correctamente como valvula de seguridad para el escenario cerrado. |

---

## CP-11: Hitstun decay anti-infinito

| Campo | Valor |
|---|---|
| **IdPrueba** | CP-11 |
| **Tipo de prueba** | Unitaria (Automatizada) |
| **Titulo** | Hitstun: decay anti-infinito por combos consecutivos |
| **Descripcion** | Verificar que el hitstun disminuye con cada hit consecutivo en un combo, con un minimo del 40% del valor base, evitando combos infinitos |
| **Prerrequisitos** | Tener el proyecto con dependencias instaladas |
| **Pasos** | 1. Calcular hitstun para hit 1, 2, 3 con KB=80. 2. Verificar que hitstun(hit1) > hitstun(hit2) > hitstun(hit3). 3. Calcular hitstun para 100 hits consecutivos. 4. Verificar que el minimo es exactamente MAX_COMBO_DECAY (40%) del valor base. |
| **Resultados esperados** | El hitstun decrece progresivamente y nunca baja del 40% del valor base |
| **Ambiente** | Node.js + Vitest (local) |
| **Importancia** | Alta |
| **Responsable** | Julian |
| **Asignado a** | Julian |
| **Estado** | Cerrado |
| **Resultados** | Hitstun(hit1)=349ms, Hitstun(hit2)=296ms, Hitstun(hit3)=244ms, Hitstun(hit100)=140ms (40% minimo). |
| **Conclusiones** | El sistema anti-infinito funciona correctamente, impidiendo combos que atrapan al oponente indefinidamente. |

---

## CP-14: CPU - Estados inactivos no generan inputs

| Campo | Valor |
|---|---|
| **IdPrueba** | CP-14 |
| **Tipo de prueba** | Unitaria (Automatizada) |
| **Titulo** | CPU: estados inactivos no generan inputs |
| **Descripcion** | Verificar que cuando el CPU esta en estados no controlables (ko, respawning, attack_startup, attack_active, attack_recovery, shield_broken, dodge, air_dodge), no genera ningun input de movimiento ni ataque |
| **Prerrequisitos** | Tener el proyecto con dependencias instaladas |
| **Pasos** | 1. Para cada estado inactivo: crear un CPUController con el CPU en dicho estado. 2. Ejecutar update(16). 3. Verificar que todos los inputs (left, right, jump, light, heavy, special) son false. |
| **Resultados esperados** | En todos los 8 estados inactivos, ningun input se activa |
| **Ambiente** | Node.js + Vitest (local) |
| **Importancia** | Alta |
| **Responsable** | Julian |
| **Asignado a** | Julian |
| **Estado** | Cerrado |
| **Resultados** | Los 8 estados inactivos producen 0 inputs activos correctamente. |
| **Conclusiones** | La IA respeta las restricciones de estado del luchador, evitando acciones invalidas durante animaciones o estados especiales. |

---

## CP-20: API - Inyeccion de token Bearer

| Campo | Valor |
|---|---|
| **IdPrueba** | CP-20 |
| **Tipo de prueba** | Unitaria (Automatizada) |
| **Titulo** | API: inyeccion de token Bearer en headers |
| **Descripcion** | Verificar que las peticiones HTTP incluyen el header Authorization con el token JWT cuando el usuario esta autenticado, y que no lo incluyen cuando no lo esta |
| **Prerrequisitos** | Tener el proyecto con dependencias instaladas. Mock del modulo auth y fetch global. |
| **Pasos** | 1. Sin token: ejecutar apiRequest("/public"). Verificar que no hay header Authorization. 2. Con token "mi-jwt-token-123": ejecutar apiRequest("/protected"). Verificar que el header es "Bearer mi-jwt-token-123". |
| **Resultados esperados** | Sin token: no hay header Authorization. Con token: header contiene "Bearer {token}" |
| **Ambiente** | Node.js + Vitest (local) |
| **Importancia** | Critica |
| **Responsable** | Julian |
| **Asignado a** | Julian |
| **Estado** | Cerrado |
| **Resultados** | La inyeccion de token funciona correctamente en ambos escenarios. |
| **Conclusiones** | El cliente API gestiona la autenticacion de forma segura, incluyendo el token solo cuando existe. |

---

## CP-21: API - Manejo de errores HTTP

| Campo | Valor |
|---|---|
| **IdPrueba** | CP-21 |
| **Tipo de prueba** | Unitaria (Automatizada) |
| **Titulo** | API: manejo de errores 401, 404, 500 |
| **Descripcion** | Verificar que el cliente API lanza excepciones con el codigo de estado y mensaje del servidor cuando recibe respuestas de error |
| **Prerrequisitos** | Tener el proyecto con dependencias instaladas. Mock de fetch global. |
| **Pasos** | 1. Simular respuesta 401 "Unauthorized". Verificar que se lanza Error "API 401: Unauthorized". 2. Simular respuesta 404 "Not Found". Verificar "API 404". 3. Simular respuesta 500 "Internal Server Error". Verificar "API 500". |
| **Resultados esperados** | Cada codigo de error HTTP genera una excepcion con el codigo y mensaje correspondientes |
| **Ambiente** | Node.js + Vitest (local) |
| **Importancia** | Alta |
| **Responsable** | Julian |
| **Asignado a** | Julian |
| **Estado** | Cerrado |
| **Resultados** | Los 3 codigos de error (401, 404, 500) generan excepciones con el formato esperado. |
| **Conclusiones** | El manejo de errores es robusto y proporciona informacion util para el debugging. |

---

## CP-25: Combate completo contra CPU (Prueba manual)

| Campo | Valor |
|---|---|
| **IdPrueba** | CP-25 |
| **Tipo de prueba** | Funcional (Manual) |
| **Titulo** | Combate completo contra CPU con 3 stocks |
| **Descripcion** | Verificar que un combate completo contra el CPU funciona de principio a fin: seleccion de personaje, combate, KOs, y pantalla de resultados |
| **Prerrequisitos** | La aplicacion debe estar corriendo en modo desarrollo (`npm run dev`). Navegador Chrome o Firefox. |
| **Pasos** | 1. Navegar a la pantalla de Landing. 2. Seleccionar modo vs CPU. 3. Seleccionar un personaje (ej: Phantom). 4. Seleccionar un escenario. 5. Jugar el combate: atacar con F (light), G (heavy), R (special). 6. Verificar que el % de dano sube al recibir golpes. 7. Verificar que al hacer KO se reduce un stock. 8. Jugar hasta que un jugador pierda los 3 stocks. 9. Verificar que aparece la pantalla de resultados con el ganador. |
| **Resultados esperados** | El combate se desarrolla sin errores. El HUD muestra dano y stocks correctamente. La pantalla de resultados indica al ganador. |
| **Ambiente** | Navegador Chrome 124+, localhost:5173 |
| **Importancia** | Critica |
| **Adjuntos visuales** | Capturas de pantalla del combate y resultados |
| **Responsable** | Julian |
| **Asignado a** | Julian |
| **Estado** | Cerrado |
| **Resultados** | El combate se desarrollo completamente sin errores. Los KOs se registraron correctamente y la pantalla de resultados mostro al ganador. |
| **Conclusiones** | El flujo principal del juego funciona correctamente de principio a fin. |

---

## CP-26: Prueba de humo - La aplicacion carga sin errores

| Campo | Valor |
|---|---|
| **IdPrueba** | CP-26 |
| **Tipo de prueba** | Humo (Manual) |
| **Titulo** | La aplicacion carga sin errores en consola |
| **Descripcion** | Verificar que la aplicacion se inicia correctamente, muestra la pantalla de Landing, y no hay errores en la consola del navegador |
| **Prerrequisitos** | Node.js instalado. Dependencias instaladas (`npm install`). |
| **Pasos** | 1. Ejecutar `npm run dev` en la carpeta client. 2. Abrir http://localhost:5173 en el navegador. 3. Abrir DevTools (F12) > Consola. 4. Verificar que la pantalla de Landing se muestra correctamente. 5. Verificar que no hay errores (rojo) en la consola. |
| **Resultados esperados** | La aplicacion carga completamente, muestra la Landing page, y la consola no muestra errores |
| **Ambiente** | Navegador Chrome 124+, localhost:5173 |
| **Importancia** | Critica |
| **Responsable** | Julian |
| **Asignado a** | Julian |
| **Estado** | Cerrado |
| **Resultados** | La aplicacion carga correctamente en ~1.5s. No se observan errores en consola. |
| **Conclusiones** | La aplicacion pasa la prueba de humo basica. |
