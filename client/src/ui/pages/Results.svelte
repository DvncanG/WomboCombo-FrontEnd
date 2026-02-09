<script lang="ts">
  import { router } from "../../lib/stores/router.svelte";
  import { gameStore } from "../../lib/stores/game.svelte";
</script>

<div class="flex flex-col items-center justify-center h-full gap-6">
  <h2 class="text-4xl font-bold">Game Over</h2>

  <div class="bg-gray-800 rounded-lg p-6 w-96">
    <div class="flex justify-between py-2 border-b border-gray-700">
      <span class="text-gray-400">Score</span>
      <span class="font-bold">{gameStore.score}</span>
    </div>
    <div class="flex justify-between py-2 border-b border-gray-700">
      <span class="text-gray-400">Rounds</span>
      <span class="font-bold">{gameStore.round}</span>
    </div>
    <div class="flex justify-between py-2">
      <span class="text-gray-400">Gold earned</span>
      <span class="font-bold text-yellow-400">{gameStore.gold}</span>
    </div>
  </div>

  <button
    class="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg transition-colors"
    onclick={() => { gameStore.reset(); router.navigate("lobby"); }}
  >
    Back to Lobby
  </button>
</div>
