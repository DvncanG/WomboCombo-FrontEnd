<script lang="ts">
  import { router } from "../../lib/stores/router.svelte";
</script>

<div class="flex flex-col items-center justify-center h-full gap-8">
  <h1 class="text-6xl font-bold tracking-tight">
    SURVIVOR
    <span class="text-blue-400">ARENA</span>
  </h1>
  <p class="text-gray-400 text-lg">Co-op survival platformer</p>

  <div class="flex flex-col gap-3 w-64">
    <button
      class="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
      onclick={() => router.navigate("login")}
    >
      Play
    </button>
    <button
      class="bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg transition-colors"
      onclick={() => router.navigate("settings")}
    >
      Settings
    </button>
  </div>
</div>
