<script lang="ts">
  import { router } from "../../lib/stores/router.svelte";
</script>

<div class="flex flex-col items-center justify-center h-full gap-8">
  <div class="text-center">
    <h1 class="text-7xl font-bold tracking-tight">
      WONBO
      <span class="text-red-500">KOMBO</span>
    </h1>
    <p class="text-gray-400 text-lg mt-2">Platform Fighter</p>
  </div>

  <div class="flex flex-col gap-3 w-72">
    <button
      class="bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-6 rounded-lg transition-colors text-xl"
      onclick={() => router.navigate("character_select")}
    >
      FIGHT! <span class="text-sm font-normal opacity-70">(local)</span>
    </button>

    <button
      class="bg-blue-700 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
      onclick={() => router.navigate("login")}
    >
      Online Multiplayer
    </button>

    <button
      class="bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg transition-colors"
      onclick={() => router.navigate("settings")}
    >
      Settings
    </button>
  </div>

  <div class="text-gray-600 text-xs mt-4 text-center space-y-0.5">
    <p>P1: WASD + F (light) · G (heavy) · R (special)</p>
    <p>P2: Arrows + J (light) · K (heavy) · L (special)</p>
    <p class="text-gray-700 mt-1">W / UP / SPACE = salto &nbsp;|&nbsp; doble salto en el aire</p>
  </div>
</div>
