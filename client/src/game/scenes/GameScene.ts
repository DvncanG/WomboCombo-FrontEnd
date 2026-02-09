import { Player } from "../entities/Player";
import { InputManager } from "../systems/InputManager";
import { PHYSICS, NETWORK } from "../config/physics";
import { socket } from "../../lib/network/socket";
import { gameStore } from "../../lib/stores/game.svelte";
import {
  registerGameScene,
  unregisterGameScene,
} from "../../lib/network/handler";
import type { IncomingMessage, GameStateMsg } from "../../lib/network/messages";

const MAP_WIDTH = 1280;
const MAP_HEIGHT = 720;
const PLATFORM_COLOR = 0x666666;

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private input_manager!: InputManager;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private lastInputSendTime = 0;

  constructor() {
    super({ key: "GameScene" });
  }

  create(): void {
    // World bounds
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Build placeholder level
    this.buildPlaceholderLevel();

    // Create local player
    this.player = new Player(this, 200, MAP_HEIGHT - 100);
    this.physics.add.collider(this.player.sprite, this.platforms);

    // Input
    this.input_manager = new InputManager(this);

    // Camera
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setBackgroundColor("#1a1a2e");

    // Register for network messages from handler
    registerGameScene(this.handleServerMessage.bind(this));

    // Update game store
    gameStore.phase = "playing";

    console.log("[GameScene] Created. Player ready.");
  }

  update(time: number, _delta: number): void {
    // 1. Update local player physics from input
    this.player.update(this.input_manager);

    // 2. Send input to server at configured rate
    if (time - this.lastInputSendTime >= NETWORK.INPUT_SEND_RATE) {
      const { tick, actions } = this.input_manager.getActions();
      if (actions.length > 0) {
        socket.send({ type: "player_input", tick, actions });
      }
      this.lastInputSendTime = time;
    }

    // 3. TODO: Update remote players (Phase 2)
    // 4. TODO: Update enemies (Phase 3)
  }

  /** Handle messages forwarded from the network handler */
  private handleServerMessage(msg: IncomingMessage): void {
    switch (msg.type) {
      case "game_state":
        this.handleGameState(msg);
        break;
      case "player_hit":
        // TODO: damage flash effect
        break;
      case "player_death":
        // TODO: death animation
        break;
      case "enemy_spawn":
        // TODO: create enemy sprite
        break;
      case "enemy_death":
        // TODO: death animation + destroy
        break;
      case "item_spawn":
        // TODO: create item sprite
        break;
      case "item_pickup":
        // TODO: pickup feedback
        break;
    }
  }

  private handleGameState(_msg: GameStateMsg): void {
    // Phase 2: update remote players
    // Phase 3: update enemies + items
    // For now, we only update HUD data (done in handler.ts)
  }

  /** Create placeholder platforms — a simple test level */
  private buildPlaceholderLevel(): void {
    this.platforms = this.physics.add.staticGroup();

    const gfx = this.add.graphics();

    // Ground
    this.createPlatform(gfx, 0, MAP_HEIGHT - 32, MAP_WIDTH, 32);

    // Floating platforms
    this.createPlatform(gfx, 200, MAP_HEIGHT - 180, 200, 16);
    this.createPlatform(gfx, 500, MAP_HEIGHT - 300, 200, 16);
    this.createPlatform(gfx, 100, MAP_HEIGHT - 420, 200, 16);
    this.createPlatform(gfx, 700, MAP_HEIGHT - 200, 250, 16);
    this.createPlatform(gfx, 950, MAP_HEIGHT - 350, 200, 16);

    gfx.destroy();
  }

  private createPlatform(
    gfx: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    const key = `plat_${x}_${y}_${w}_${h}`;
    if (!this.textures.exists(key)) {
      gfx.clear();
      gfx.fillStyle(PLATFORM_COLOR, 1);
      gfx.fillRect(0, 0, w, h);
      gfx.generateTexture(key, w, h);
    }
    const plat = this.platforms.create(x + w / 2, y + h / 2, key) as Phaser.Physics.Arcade.Sprite;
    plat.setDisplaySize(w, h);
    plat.refreshBody();
  }

  shutdown(): void {
    unregisterGameScene();
    this.player?.destroy();
    console.log("[GameScene] Shutdown.");
  }
}
