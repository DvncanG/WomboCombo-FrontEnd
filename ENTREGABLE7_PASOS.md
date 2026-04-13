# Entregable 7 — Guía paso a paso (WomboKombo)

Objetivo: desplegar el juego, grabar el video del +1 punto y redactar el PDF final
`DAW_MP12_Grupo_N_Entregable7.pdf`.

Fecha estimada total: 10-15 h repartidas en las fases de abajo.

---

## FASE 0 — Preparación (30 min)

### 0.1. Verificar que el proyecto compila en local
```bash
cd client
npm install
npm run build
```
- Debe generar `client/dist/` sin errores.
- Si falla: arreglar antes de continuar (imports rotos, tipos TS, etc.).

### 0.2. Probar el juego en local
```bash
npm run dev
```
Abrir la URL que muestre Vite y verificar: landing → lobby → partida → KO.

### 0.3. Limpiar el repo
- Revisar `.gitignore`: `node_modules/`, `dist/`, `.env`.
- Confirmar que no hay secretos en el código.
- Commit de lo pendiente en `dev`.

---

## FASE 1 — Docker en local (45 min)

### 1.1. Revisar el Dockerfile
Archivo: `client/Dockerfile`. Ya existe y es multi-stage (Node build → Nginx).

**Importante**: el `COPY client/...` indica que debe construirse **desde la raíz del repo**, no desde `client/`.

### 1.2. Construir la imagen
Desde la raíz `WomboKombo-Front/`:
```bash
docker build -f client/Dockerfile -t wombokombo:local .
```

### 1.3. Ejecutar el contenedor
```bash
docker run --rm -p 8080:80 wombokombo:local
```
Abrir `http://localhost:8080` y jugar una partida completa.

### 1.4. Si falla
- Error de build de Vite → revisar logs y corregir.
- Pantalla en blanco → abrir DevTools, mirar consola (rutas de assets, SPA fallback).
- Guardar una captura de la consola si todo va bien: servirá para el PDF.

---

## FASE 2 — Elegir proveedor y desplegar (2 h)

**Recomendación: Railway** (acepta Dockerfile, HTTPS y dominio gratis, deploy automático desde GitHub).

Alternativas:
- **Render**: muy similar, plan free.
- **Fly.io**: más control, algo más técnico.
- **Vercel/Netlify**: solo si descartas Docker y subes el `dist/` estático.

### 2.1. Crear cuenta en Railway
1. `railway.app` → Login con GitHub.
2. New Project → Deploy from GitHub repo → seleccionar `WomboKombo-Front`.

### 2.2. Configurar el build
- Root directory: dejar en `/` (raíz).
- Dockerfile path: `client/Dockerfile`.
- Railway detecta `EXPOSE 80` automáticamente.

### 2.3. Primer deploy
- Railway construye y despliega automáticamente.
- Revisar los logs del build hasta que aparezca `deployed`.
- Settings → Networking → **Generate Domain** → obtendrás algo como
  `wombokombo-production.up.railway.app`.

### 2.4. Verificar en producción
Abrir la URL pública y jugar una partida. Sacar captura de la pantalla del juego en vivo.

### 2.5. Registrar incidencias del despliegue
Ir apuntando en un `.txt` cualquier problema y cómo lo resolviste. Eso es material directo para el
apartado **"Solución de incidencias al desplegar"** del PDF.

---

## FASE 3 — Entorno de QA / Staging (1 h)

### 3.1. Crear un segundo service en Railway
- New Service → mismo repo → rama `dev` en lugar de `main`.
- Settings → Networking → Generate Domain → `wombokombo-staging.up.railway.app`.

### 3.2. Flujo de trabajo QA
- `dev` → se despliega automáticamente en **staging**.
- `main` → se despliega automáticamente en **producción**.
- PR de `dev` a `main` solo después de validar en staging.

### 3.3. Checklist de smoke tests (para el PDF)
Lista de cosas que deben funcionar antes de promover a prod:
- [ ] Carga la landing
- [ ] Se puede crear partida
- [ ] Selección de personaje funciona
- [ ] Controles responden
- [ ] Colisiones y daño
- [ ] Condición de victoria/KO
- [ ] Reinicio/volver al menú
- [ ] Sin errores en consola

### 3.4. Tests automáticos
Documentar en el PDF que ya tenéis Vitest con:
- `client/src/game/config/fighters.test.ts`
- `client/src/game/config/physics.test.ts`
- `client/src/game/entities/Fighter.test.ts`
- `client/src/game/integration.test.ts`

Comando: `npm test` desde `client/`.

---

## FASE 4 — Grabar el video (+1 punto) (1 h)

### 4.1. Preparar
- Instalar **OBS Studio** (o usar Win+G si prefieres rápido).
- Cerrar pestañas y notificaciones.
- Preparar un guion de 2-4 min.

### 4.2. Guion sugerido (leerlo en voz en off)
1. **Intro (10s)**: "Soy [nombre], proyecto WomboKombo, voy a mostrar el despliegue a producción."
2. **Código (20s)**: mostrar VSCode con el repo y abrir `client/Dockerfile`, explicarlo en 2 frases.
3. **Build local (30s)**: `docker build` + `docker run` + mostrar localhost:8080 funcionando.
4. **Push a main (20s)**: `git push origin main` desde la terminal.
5. **Railway (60s)**: abrir el panel, ver el build en vivo, esperar a "deployed".
6. **Producción (40s)**: abrir la URL pública, jugar una partida corta, mostrar KO.
7. **Outro (10s)**: "Despliegue completado, gracias."

### 4.3. Grabar
- Resolución 1080p, 30 fps.
- Exportar como **MP4**.
- Nombre exacto: `DAW_MP12_Grupo_N_Entregable7[OPCIONAL].mp4`
  (sustituir `N` por tu número de grupo).

### 4.4. Revisar
Verlo entero antes de darlo por bueno. Si algo no se oye o no se ve, regrabar la sección.

---

## FASE 5 — Capturas para el manual (30 min)

Con la app en producción, sacar capturas de:
- Landing (`Landing.svelte`)
- Lobby / selección de partida (`Lobby.svelte`)
- Selección de personaje
- Pantalla de pelea con HUD de vida
- Pantalla de KO / victoria
- Pantalla de controles (si existe)

Guardar en `client/docs/screenshots/` para tenerlas a mano.

---

## FASE 6 — Redactar el PDF (4-6 h)

Nombre exacto: `DAW_MP12_Grupo_N_Entregable7.pdf`.
Usar **Google Docs** o **Word** y exportar a PDF al final.

### 6.1. Portada (obligatoria — 10% de la nota)
- Logo IFP (descargar del Campus)
- Logo WomboKombo (o título estilizado)
- Módulo: **MP12 Proyecto**
- Nombre del proyecto: **WomboKombo**
- Tutor/es: [nombre]
- Alumnos **ordenados alfabéticamente por apellido**
- Año: **2026**

### 6.2. Índice
Tabla de contenidos con los apartados siguientes.

### 6.3. Documento de despliegue a producción *(verde, 90%)*
Contenido:
- Arquitectura del proyecto (frontend Svelte + Phaser, build con Vite)
- Explicación del `Dockerfile` línea por línea (multi-stage: Node build → Nginx)
- Por qué Nginx y por qué el SPA fallback (`try_files ... /index.html`)
- Proveedor elegido: **Railway** y motivos
- Pasos reales que seguiste en Railway (con capturas del panel)
- CI/CD: push a `main` → deploy automático
- Variables de entorno (si las hay) y cómo se configuran en Railway
- Dominio y HTTPS automático
- Incidencias encontradas y cómo se resolvieron *(usa tu `.txt` de notas)*
- Procedimiento de rollback (Railway → Deployments → Redeploy anterior)

### 6.4. Entorno de pruebas / QA en producción
- Qué es staging y por qué existe
- Cómo se creó el segundo service en Railway
- Flujo `dev` → staging, `main` → prod
- Checklist de smoke tests (el de la fase 3.3)
- Tests automáticos de Vitest y cómo se ejecutan
- Criterios para promover de staging a producción

### 6.5. Plan de pruebas beta con el cliente
- Objetivo: validar jugabilidad, usabilidad y estabilidad con usuarios reales
- Tareas que el cliente realizará:
  1. Entrar a la URL
  2. Crear partida / unirse
  3. Seleccionar personaje
  4. Jugar al menos 3 rondas
  5. Probar distintos controles
  6. Forzar un KO
- Formulario de feedback (Google Forms) con preguntas:
  - Facilidad de uso (1-5)
  - Diversión (1-5)
  - Bugs encontrados (texto libre)
  - Sugerencias (texto libre)
- Calendario: fecha sesión, recogida, iteración
- Criterios de aceptación (ej. 0 bugs críticos, ≥4/5 en diversión)

### 6.6. Seguimiento de la aplicación tras el despliegue
- Monitorización: **UptimeRobot** (gratis, te avisa si cae)
- Logs: Railway dashboard → logs en vivo
- Analítica: **Plausible** o **Google Analytics** (visitas, país, sesiones)
- SEO: meta tags en `client/index.html`, Open Graph, favicon
- Indicadores de calidad (KPIs):
  - Uptime %
  - Tiempo de carga inicial
  - Nº de partidas/día
  - Nº de errores en consola
- Gestión de incidencias: **GitHub Issues** con labels `bug`, `priority:high`, etc.
- Procedimiento de cambios: Issue → rama → PR → review → staging → prod
- Mantenimiento:
  - Actualizaciones de dependencias (Dependabot)
  - Parches de seguridad
  - Backlog de mejoras

### 6.7. Manual o guía de usuario final
Con las capturas de la fase 5:
- **Introducción**: qué es WomboKombo
- **Cómo acceder**: URL pública
- **Crear/unirse a partida**
- **Selección de personaje**: lista de luchadores y diferencias
- **Controles**: tabla con teclas (movimiento, ataque, salto, bloqueo…)
- **Mecánicas**: vida, daño, KO, victoria
- **FAQ**: problemas comunes
- **Créditos**

### 6.8. Conclusiones
Breve cierre: qué se ha aprendido, estado del proyecto, próximos pasos.

---

## FASE 7 — Entrega final (30 min)

### 7.1. Comprobaciones
- [ ] PDF se llama exactamente `DAW_MP12_Grupo_N_Entregable7.pdf`
- [ ] Video (si lo entregas) se llama `DAW_MP12_Grupo_N_Entregable7[OPCIONAL].mp4`
- [ ] Portada con todos los elementos solicitados
- [ ] Sin faltas de ortografía (pasar corrector)
- [ ] Todas las capturas se ven nítidas
- [ ] La URL de producción está activa
- [ ] Minuta del grupo entregada en el espacio de trabajo
- [ ] Entrada en el Blog/Porfolio del grupo sobre la implementación

### 7.2. Subir al Campus
Antes del **plazo indicado por tu tutor** (revisar, porque el PDF dice 2025 pero es plantilla).

---

## Orden recomendado por día

- **Día 1 (2-3 h)**: Fases 0, 1 y 2 — dejar desplegado en Railway.
- **Día 2 (2 h)**: Fases 3, 4 y 5 — staging, video y capturas.
- **Día 3-4 (4-6 h)**: Fase 6 — redactar el PDF.
- **Día 5 (30 min)**: Fase 7 — revisión y entrega.

---

## Checklist rápida de la rúbrica

| Ítem | Peso | Dónde |
|---|---|---|
| Nombre de ficheros correcto | ✔ | Fase 7.1 |
| Portada completa | 10% | Fase 6.1 |
| Formato y ortografía | 10% | Todo el PDF |
| Minuta | ✔ | Espacio de trabajo |
| Blog/Porfolio | Verde | Espacio de trabajo |
| Documento de despliegue | Verde | Fase 6.3 |
| Documento QA en producción | Verde | Fase 6.4 |
| Plan de pruebas beta | Verde | Fase 6.5 |
| Seguimiento aplicación | Verde | Fase 6.6 |
| Manual de usuario | Verde | Fase 6.7 |
| Video despliegue | +1 punto | Fase 4 |
