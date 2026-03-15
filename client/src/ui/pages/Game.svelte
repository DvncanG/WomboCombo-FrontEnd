<script lang="ts">
  import { onMount } from "svelte";
  import { createGame, destroyGame } from "../../game/PhaserGame";
  import { gameStore } from "../../lib/stores/game.svelte";
  import { router } from "../../lib/stores/router.svelte";
  import HUD from "../components/HUD.svelte";

  let containerEl: HTMLDivElement;

  onMount(() => {
    createGame(containerEl);

    return () => {
      destroyGame();
    };
  });

  function exitGame() {
    destroyGame();
    gameStore.reset();
    router.navigate("landing");
  }

  // Watch for results transition
  $effect(() => {
    if (gameStore.phase === "results") {
      destroyGame();
      router.navigate("results");
    }
  });
</script>

<div class="relative w-full h-full bg-black">
  <!-- Phaser canvas -->
  <div bind:this={containerEl} class="w-full h-full"></div>

  <!-- HUD overlay -->
  <HUD />

  <!-- Exit button -->
  <button
    class="absolute top-4 right-4 text-gray-400 hover:text-white text-sm bg-black/50 px-3 py-1 rounded pointer-events-auto"
    onclick={exitGame}
  >
    ESC Exit
  </button>
</div>
