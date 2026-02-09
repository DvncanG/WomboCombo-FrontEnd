<script lang="ts">
  import { router } from "../../lib/stores/router.svelte";
  import { settings } from "../../lib/stores/settings.svelte";
</script>

<div class="flex flex-col items-center justify-center h-full gap-6">
  <h2 class="text-3xl font-bold">Settings</h2>

  <div class="flex flex-col gap-4 w-80">
    <label class="flex flex-col gap-1">
      <span class="text-sm text-gray-400">Player Name</span>
      <input
        type="text"
        bind:value={settings.playerName}
        class="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
      />
    </label>

    <label class="flex flex-col gap-1">
      <span class="text-sm text-gray-400">Music Volume: {Math.round(settings.musicVolume * 100)}%</span>
      <input type="range" min="0" max="1" step="0.05" bind:value={settings.musicVolume} />
    </label>

    <label class="flex flex-col gap-1">
      <span class="text-sm text-gray-400">SFX Volume: {Math.round(settings.sfxVolume * 100)}%</span>
      <input type="range" min="0" max="1" step="0.05" bind:value={settings.sfxVolume} />
    </label>

    <label class="flex items-center gap-2">
      <input type="checkbox" bind:checked={settings.showFps} />
      <span class="text-sm text-gray-400">Show FPS</span>
    </label>
  </div>

  <button
    class="text-gray-400 hover:text-white text-sm mt-4"
    onclick={() => router.navigate("landing")}
  >
    ← Back
  </button>
</div>
