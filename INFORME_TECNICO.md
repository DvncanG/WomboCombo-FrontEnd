# WomboCombo - Informe Técnico del Proyecto

## 1. Descripción General

**WomboCombo** es un juego de lucha 2D multijugador tipo *platform fighter* desarrollado como aplicación web. El proyecto implementa una arquitectura cliente-servidor completa con tres capas diferenciadas: un frontend interactivo construido con Svelte y Phaser, un backend REST en Go y una base de datos PostgreSQL, todo orquestado mediante Docker Compose.

El juego ofrece combate local 1v1 (jugador vs jugador o jugador vs CPU) con tres personajes jugables, cada uno con estadísticas, ataques y estilos de juego diferenciados. El sistema online permite registro de usuarios, autenticación con JWT y gestión de salas de juego.

---

## 2. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────┐
│                   Docker Compose                     │
│                                                      │
│  ┌──────────┐    ┌──────────────┐    ┌───────────┐  │
│  │ Frontend  │───▶│   Backend    │───▶│ PostgreSQL│  │
│  │  :8080    │    │    :3000     │    │   :5432   │  │
│  │  Nginx    │    │   Go Echo    │    │           │  │
│  │ Svelte+   │    │   REST API   │    │ wombocombo│  │
│  │ Phaser    │    │   JWT Auth   │    │    db     │  │
│  └──────────┘    └──────────────┘    └───────────┘  │
│       │                                              │
│       │  proxy /api/* ──▶ backend:3000               │
└─────────────────────────────────────────────────────┘
```

El frontend sirve la aplicación estática a través de Nginx, que además actúa como **proxy inverso**: todas las peticiones a `/api/*` se redirigen internamente al backend Go en el puerto 3000. Esto permite que el navegador trabaje contra un único origen (puerto 8080), evitando problemas de CORS.

---

## 3. Stack Tecnológico

### 3.1 Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Svelte** | 5.x | Framework UI con sintaxis reactiva (runes: `$state`, `$derived`) |
| **Phaser** | 3.80 | Motor de juego 2D (renderizado, físicas, sprites, animaciones) |
| **TypeScript** | 5.6 | Tipado estático con modo strict |
| **Vite** | 6.x | Bundler y servidor de desarrollo |
| **Tailwind CSS** | 4.x | Framework de utilidades CSS |

### 3.2 Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Go** | 1.22 | Lenguaje del servidor |
| **Echo** | 4.12 | Framework HTTP de alto rendimiento |
| **lib/pq** | 1.10 | Driver PostgreSQL nativo para Go |
| **golang-jwt** | 5.2 | Generación y validación de tokens JWT |
| **bcrypt** | - | Hash seguro de contraseñas |

### 3.3 Infraestructura

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **PostgreSQL** | 16 | Base de datos relacional |
| **Nginx** | Alpine | Servidor web y proxy inverso |
| **Docker Compose** | - | Orquestación de contenedores |

---

## 4. Estructura del Proyecto

```
WomboCombo-FrontEnd/
├── client/                          # Frontend
│   ├── src/
│   │   ├── game/                    # Motor de juego (Phaser)
│   │   │   ├── config/             # Configuración de juego
│   │   │   │   ├── fighters.ts     # Definición de personajes (282 líneas)
│   │   │   │   ├── physics.ts      # Constantes físicas
│   │   │   │   ├── animations.ts   # Mapeo de animaciones
│   │   │   │   └── enemies.ts      # Configuración visual de enemigos
│   │   │   ├── entities/           # Entidades del juego
│   │   │   │   ├── Fighter.ts      # Luchador principal (456 líneas)
│   │   │   │   ├── Player.ts       # Jugador de red
│   │   │   │   └── RemotePlayer.ts # Jugador remoto
│   │   │   ├── scenes/             # Escenas de Phaser
│   │   │   │   ├── BootScene.ts    # Carga de assets
│   │   │   │   ├── ArenaScene.ts   # Escena de combate (447 líneas)
│   │   │   │   └── GameScene.ts    # Escena multijugador
│   │   │   ├── systems/            # Sistemas de input
│   │   │   │   ├── FighterInputManager.ts
│   │   │   │   ├── CPUController.ts
│   │   │   │   └── InputManager.ts
│   │   │   └── PhaserGame.ts       # Ciclo de vida del juego
│   │   ├── lib/                     # Librerías compartidas
│   │   │   ├── api/client.ts       # Cliente HTTP (fetch wrapper)
│   │   │   ├── network/            # WebSocket (socket, handler, messages)
│   │   │   └── stores/             # Estado reactivo (Svelte 5 runes)
│   │   │       ├── auth.svelte.ts
│   │   │       ├── game.svelte.ts
│   │   │       ├── lobby.svelte.ts
│   │   │       ├── router.svelte.ts
│   │   │       └── settings.svelte.ts
│   │   └── ui/                      # Interfaz de usuario
│   │       ├── components/HUD.svelte
│   │       └── pages/              # 10 páginas (Landing, Login, Register,
│   │                                #   Lobby, Room, CharacterSelect,
│   │                                #   StageSelect, Game, Results, Settings)
│   ├── public/assets/               # Assets del juego
│   │   ├── backgrounds/            # 4 fondos de ciudad
│   │   └── sprites/gangsters/      # 30 spritesheets (10 por personaje)
│   ├── nginx.conf                   # Configuración del proxy
│   └── Dockerfile                   # Build multi-stage (Node → Nginx)
│
├── server/                          # Backend
│   ├── main.go                      # Punto de entrada y rutas
│   ├── db/db.go                     # Conexión y migraciones PostgreSQL
│   ├── middleware/jwt.go            # Autenticación JWT
│   ├── handlers/
│   │   ├── auth.go                  # Registro, login, perfil
│   │   └── rooms.go                 # CRUD de salas
│   ├── go.mod / go.sum
│   └── Dockerfile                   # Build multi-stage (Go → Alpine)
│
└── docker-compose.yml               # Orquestación de servicios
```

**Total: 39 archivos fuente** (22 TypeScript + 12 Svelte + 5 stores)

---

## 5. Base de Datos

### 5.1 Modelo Entidad-Relación

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│    users     │       │    rooms     │       │  room_players    │
├──────────────┤       ├──────────────┤       ├──────────────────┤
│ id (PK)      │◀──┐   │ id (PK)      │◀──┐   │ room_id (PK,FK) │
│ username (UQ)│   │   │ code (UQ)    │   ├──│ user_id (PK,FK) │
│ email (UQ)   │   ├──│ host_id (FK) │   │   │ joined_at       │
│ password_hash│   │   │ name         │   │   └──────────────────┘
│ display_name │   │   │ max_players  │   │
│ created_at   │   │   │ is_public    │   │
└──────────────┘   │   │ status       │   │
                   │   │ created_at   │   │
                   │   └──────────────┘   │
                   │                      │
                   └──────────────────────┘
```

### 5.2 Descripción de Tablas

**users** - Almacena las cuentas de usuario registradas.
- `password_hash`: Contraseña hasheada con bcrypt (coste 10).
- `username` y `email`: Campos únicos para evitar duplicados.

**rooms** - Representa las salas de juego.
- `code`: Código alfanumérico de 6 caracteres generado aleatoriamente para compartir entre jugadores.
- `status`: Estado de la sala (`waiting`, `closed`).
- `host_id`: Referencia al usuario creador de la sala.

**room_players** - Tabla de relación N:M entre usuarios y salas.
- Clave primaria compuesta `(room_id, user_id)` que previene duplicados.
- `ON DELETE CASCADE` en room_id asegura limpieza automática al eliminar una sala.

### 5.3 Migraciones

Las tablas se crean automáticamente al iniciar el servidor mediante sentencias `CREATE TABLE IF NOT EXISTS`, lo que permite un despliegue sin pasos manuales de migración.

---

## 6. API REST

### 6.1 Autenticación

El sistema utiliza **JSON Web Tokens (JWT)** con algoritmo HS256. Cada token incluye el `user_id` y `username` en su payload, con una expiración de 24 horas.

| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| `POST` | `/api/auth/register` | No | Registra un nuevo usuario |
| `POST` | `/api/auth/login` | No | Inicia sesión y devuelve token |
| `GET` | `/api/auth/me` | JWT | Devuelve el perfil del usuario autenticado |

**Registro** - Recibe `username`, `email` y `password`. Valida longitud mínima de contraseña (4 caracteres), hashea con bcrypt, inserta en la base de datos y devuelve un token JWT junto con los datos del usuario.

**Login** - Recibe `email` y `password`. Busca al usuario por email, compara el hash con bcrypt y, si es válido, genera y devuelve un token JWT.

### 6.2 Gestión de Salas

| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| `GET` | `/api/rooms` | No | Lista salas públicas en espera (máx. 20) |
| `GET` | `/api/rooms/:code` | No | Detalle de sala con lista de jugadores |
| `POST` | `/api/rooms` | JWT | Crea una nueva sala |
| `POST` | `/api/rooms/:code/join` | JWT | Unirse a una sala existente |
| `POST` | `/api/rooms/:code/leave` | JWT | Abandonar una sala |

**Crear sala** - Genera un código aleatorio de 6 caracteres, crea la sala en la base de datos y añade automáticamente al creador como primer jugador.

**Unirse a sala** - Valida que la sala esté en estado `waiting` y que no esté llena antes de permitir la unión. Usa `ON CONFLICT DO NOTHING` para prevenir inserciones duplicadas.

**Abandonar sala** - Si el host abandona la sala, esta se cierra automáticamente cambiando su estado a `closed`.

### 6.3 Health Check

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/health` | Devuelve `{"status": "ok"}` para monitorización |

---

## 7. Sistema de Juego

### 7.1 Motor de Combate

El sistema de combate está implementado sobre Phaser 3 con una **máquina de estados finitos** de 14 estados por luchador:

```
idle → walking → running
  ↓                  ↓
jumping → falling → double_jumping
  ↓
crouching
  ↓
attack_startup → attack_active → attack_recovery
                      ↓
                   hitstun → launched → ko
```

**Fases de ataque:**
1. **Startup** - Tiempo de preparación antes de que el golpe sea activo.
2. **Active** - La hitbox está activa y puede causar daño.
3. **Recovery** - Periodo de recuperación donde el luchador es vulnerable.

**Sistema de hitbox:** Cada ataque genera un rectángulo invisible con dimensiones y offset específicos. La detección de colisiones se realiza por intersección de rectángulos entre la hitbox del atacante y el hurtbox del defensor.

**Knockback:** La fuerza de retroceso se calcula como `knockback / peso`, aplicada con un ángulo definido por ataque. Los personajes más ligeros reciben más retroceso.

**Hitstun:** Duración de aturdimiento calculada como `200ms + (8ms × daño)`, durante la cual el jugador golpeado no puede actuar.

**Combos:** Se registran golpes consecutivos dentro de una ventana de 1200ms. El contador se muestra en pantalla durante la pelea.

### 7.2 Personajes Jugables

El juego incluye tres personajes con estilos de juego diferenciados:

| Stat | Blaze | Phantom | Titan |
|------|-------|---------|-------|
| **Velocidad** | 265 (rápido) | 385 (el más rápido) | 155 (lento) |
| **Peso** | 0.65 (ligero) | 1.0 (normal) | 1.65 (pesado) |
| **Fuerza de salto** | -530 | -510 | -430 |
| **Daño ligero** | 5 | 5 | 9 |
| **Daño pesado** | 14 | 14 | 26 |
| **Especial** | Disparo de rifle (14 dmg, largo alcance) | Teletransporte + golpe (12 dmg) | Barrido giratorio (17 dmg) |

- **Blaze** - Personaje equilibrado con un potente ataque especial a distancia. Ideal para jugadores que prefieren mantener distancia.
- **Phantom** - El personaje más rápido del juego. Su especial le permite teletransportarse hacia el oponente, ideal para un estilo de juego agresivo.
- **Titan** - El más lento pero con el mayor daño por golpe. Su peso elevado hace que sea difícil de desplazar con knockback.

### 7.3 Inteligencia Artificial (CPU)

El modo contra CPU implementa un `CPUController` con:
- Toma de decisiones basada en distancia al oponente.
- Cooldowns entre acciones para simular tiempos de reacción humanos.
- Selección de ataques según el rango (ligero a corta distancia, especial a larga).

### 7.4 Sistema de Rondas

Los combates se disputan al **mejor de 3 rondas** con un temporizador de 99 segundos por ronda. Si el tiempo se agota, gana el jugador con más vida restante. El HUD muestra barras de vida con código de colores (verde >50%, amarillo 25-50%, rojo <25%).

---

## 8. Interfaz de Usuario

La navegación de la aplicación se gestiona mediante un **router reactivo** implementado con Svelte 5 runes, sin dependencia de librerías externas.

### 8.1 Flujo de Navegación

```
Landing (menú principal)
  ├── FIGHT! (local)
  │     └── CharacterSelect (P1 y P2 eligen personaje, Tab alterna CPU)
  │           └── StageSelect (selección de escenario)
  │                 └── Game (canvas Phaser + HUD)
  │                       └── Results (estadísticas del combate)
  │
  ├── Online Multiplayer
  │     └── Login / Register
  │           └── Lobby (crear o unirse a sala)
  │                 └── Room (sala de espera con lista de jugadores)
  │
  └── Settings (volumen, nombre, FPS)
```

### 8.2 Gestión de Estado

Se utilizan **5 stores reactivos** implementados como clases con Svelte 5 runes:

| Store | Responsabilidad |
|-------|----------------|
| `authStore` | Token JWT, datos de usuario, estado de autenticación |
| `gameStore` | Vida de jugadores, rondas, timer, fase del juego, combos |
| `lobbyStore` | Jugadores en sala, información de la room, chat |
| `router` | Página actual y parámetros de navegación |
| `settings` | Volumen, nombre del jugador, mostrar FPS |

---

## 9. Despliegue con Docker

### 9.1 Servicios

El proyecto se despliega con un solo comando: `docker compose up --build -d`

| Servicio | Imagen Base | Puerto | Descripción |
|----------|-------------|--------|-------------|
| **db** | postgres:16-alpine | 5432 | Base de datos con volumen persistente |
| **backend** | golang:1.22-alpine → alpine:3.20 | 3000 | API REST (build multi-stage) |
| **frontend** | node:20-alpine → nginx:alpine | 8080 | SPA + proxy inverso (build multi-stage) |

### 9.2 Builds Multi-Stage

Tanto el frontend como el backend utilizan builds Docker multi-stage para minimizar el tamaño de las imágenes finales:

- **Frontend**: Se compila con Node.js y se sirve con Nginx (~30MB final).
- **Backend**: Se compila con Go y se ejecuta sobre Alpine (~15MB final).

### 9.3 Proxy Inverso

Nginx actúa como proxy inverso, redirigiendo las peticiones `/api/*` al backend:

```nginx
location /api/ {
    proxy_pass http://backend:3000;
}
```

Esto permite que toda la aplicación opere bajo un único punto de entrada (puerto 8080).

### 9.4 Dependencias entre Servicios

El backend espera a que PostgreSQL esté healthy (verificado por `pg_isready`) antes de iniciar. El frontend es independiente y puede arrancar en paralelo.

---

## 10. Seguridad

- **Contraseñas**: Hasheadas con bcrypt antes de almacenarse. Nunca se transmiten ni almacenan en texto plano.
- **Autenticación**: JWT con firma HS256 y expiración de 24 horas.
- **Validación de entrada**: Se verifica la presencia de campos obligatorios y longitudes mínimas en registro.
- **Protección de duplicados**: Restricciones `UNIQUE` a nivel de base de datos en username y email.
- **Integridad referencial**: Foreign keys con `ON DELETE CASCADE` para mantener consistencia.

---

## 11. Cómo Ejecutar el Proyecto

### Requisitos Previos
- Docker Desktop instalado y en ejecución.

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd WomboCombo-FrontEnd

# 2. Levantar todos los servicios
docker compose up --build -d

# 3. Acceder a la aplicación
# Frontend:  http://localhost:8080
# API:       http://localhost:8080/api/health
# DB:        localhost:5432 (user: postgres, pass: postgres)

# 4. Parar los servicios
docker compose down
```

### Verificación Rápida

```bash
# Health check
curl http://localhost:8080/api/health
# → {"status":"ok"}

# Registrar usuario
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"1234"}'
# → {"token":"eyJ...","user":{...}}
```
