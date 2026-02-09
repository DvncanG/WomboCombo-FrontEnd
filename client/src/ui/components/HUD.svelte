<script lang="ts">
  import { gameStore } from "../../lib/stores/game.svelte";

  let healthPercent = $derived(
    Math.max(0, Math.min(100, (gameStore.health / gameStore.maxHealth) * 100))
  );

  let healthColor = $derived(
    healthPercent > 60 ? "bg-green-500" : healthPercent > 30 ? "bg-yellow-500" : "bg-red-500"
  );

  let timeDisplay = $derived(Math.ceil(gameStore.timeLeft));
</script>

<!-- Top bar HUD -->
<div class="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none">
  <!-- Left: Health -->
  <div class="flex flex-col gap-1">
    <div class="bg-black/60 rounded-lg px-3 py-2 backdrop-blur-sm">
      <div class="text-xs text-gray-400 mb-1">HP</div>
      <div class="w-32 h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          class={`h-full rounded-full transition-all duration-200 ${healthColor}`}
          style="width: {healthPercent}%"
        ></div>
      </div>
      <div class="text-xs text-gray-300 mt-1">
        {gameStore.health} / {gameStore.maxHealth}
      </div>
    </div>
  </div>

  <!-- Center: Timer + Round -->
  <div class="bg-black/60 rounded-lg px-4 py-2 text-center backdrop-blur-sm">
    <div class="text-xs text-gray-400">Round {gameStore.round}</div>
    <div class="text-2xl font-bold font-mono" class:text-red-400={timeDisplay <= 10}>
      {timeDisplay}
    </div>
  </div>

  <!-- Right: Score + Gold -->
  <div class="bg-black/60 rounded-lg px-3 py-2 text-right backdrop-blur-sm">
    <div class="text-xs text-gray-400">Score</div>
    <div class="text-lg font-bold">{gameStore.score}</div>
    <div class="text-xs text-yellow-400 mt-1">🪙 {gameStore.gold}</div>
  </div>
</div>
