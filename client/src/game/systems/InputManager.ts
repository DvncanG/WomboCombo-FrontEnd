import type { PlayerAction } from "../../lib/network/messages";

interface KeyBindings {
  left: Phaser.Input.Keyboard.Key[];
  right: Phaser.Input.Keyboard.Key[];
  jump: Phaser.Input.Keyboard.Key[];
  crouch: Phaser.Input.Keyboard.Key[];
  interact: Phaser.Input.Keyboard.Key[];
  useItem: Phaser.Input.Keyboard.Key[];
}

export class InputManager {
  private bindings: KeyBindings;
  private localTick = 0;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;

    this.bindings = {
      left: [
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      ],
      right: [
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      ],
      jump: [
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      ],
      crouch: [
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      ],
      interact: [kb.addKey(Phaser.Input.Keyboard.KeyCodes.E)],
      useItem: [kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q)],
    };
  }

  private isDown(keys: Phaser.Input.Keyboard.Key[]): boolean {
    return keys.some((k) => k.isDown);
  }

  /** Returns current actions array and increments local tick */
  getActions(): { tick: number; actions: PlayerAction[] } {
    const actions: PlayerAction[] = [];

    if (this.isDown(this.bindings.left)) actions.push("left");
    if (this.isDown(this.bindings.right)) actions.push("right");
    if (this.isDown(this.bindings.jump)) actions.push("jump");
    if (this.isDown(this.bindings.crouch)) actions.push("crouch");
    if (this.isDown(this.bindings.interact)) actions.push("interact");
    if (this.isDown(this.bindings.useItem)) actions.push("use_item");

    return { tick: this.localTick++, actions };
  }

  /** Check individual movement keys for Player physics */
  get left(): boolean {
    return this.isDown(this.bindings.left);
  }
  get right(): boolean {
    return this.isDown(this.bindings.right);
  }
  get jump(): boolean {
    return this.isDown(this.bindings.jump);
  }
  get crouch(): boolean {
    return this.isDown(this.bindings.crouch);
  }
}
