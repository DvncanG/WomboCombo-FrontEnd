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
      gameStore.reset();
    };
  });

  function exitGame() {
    destroyGame();
    gameStore.reset();
    router.navigate("lobby");
  }
</script>

<!-- Full-screen game container with HUD overlay -->
<div class="relative w-full h-full">
  <!-- Phaser canvas mounts here -->
  <div bind:this={containerEl} class="w-full h-full"></div>

  <!-- Svelte HUD overlay (always on top of canvas) -->
  {#if gameStore.phase === "playing" || gameStore.phase === "dead"}
    <HUD />
  {/if}

  <!-- Dead overlay -->
  {#if gameStore.phase === "dead"}
    <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
      <div class="text-center">
        <h2 class="text-4xl font-bold text-red-500 mb-2">YOU DIED</h2>
        <p class="text-gray-300">Waiting for teammates...</p>
      </div>
    </div>
  {/if}

  <!-- Escape / back button -->
  <button
    class="absolute top-4 right-4 text-gray-400 hover:text-white text-sm bg-black/50 px-3 py-1 rounded"
    onclick={exitGame}
  >
    ESC Exit
  </button>
</div>
