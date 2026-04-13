<script lang="ts">
  import { router } from "../../lib/stores/router.svelte";
  import { lobby } from "../../lib/stores/lobby.svelte";
  import { socket } from "../../lib/network/socket";
  import { initMessageHandler } from "../../lib/network/handler";
  import { gameStore } from "../../lib/stores/game.svelte";
  import { settings } from "../../lib/stores/settings.svelte";

  let joinCode = $state("");
  let playerName = $state(settings.playerName || localStorage.getItem("wombo_name") || "Player");
  let error = $state("");
  let connecting = $state(false);

  const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:9001";

  function saveName() {
    localStorage.setItem("wombo_name", playerName.trim() || "Player");
  }

  function createRoom() {
    if (!playerName.trim()) { error = "Enter your name first"; return; }
    saveName();
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    lobby.setRoom({ roomId: "r1", joinCode: code });
    connectWS(code);
  }

  function joinRoom() {
    if (!joinCode.trim()) { error = "Enter a room code"; return; }
    if (!playerName.trim()) { error = "Enter your name first"; return; }
    saveName();
    lobby.setRoom({ roomId: "r-join", joinCode: joinCode.trim().toUpperCase() });
    connectWS(joinCode.trim().toUpperCase());
  }

  function connectWS(code: string) {
    connecting = true;
    error = "";
    initMessageHandler();
    // Include player name in query param so server knows who we are
    socket.connect(`${WS_URL}/ws?room=${code}&name=${encodeURIComponent(playerName)}`);
    gameStore.isCPU = false;
    gameStore.p1Name = playerName;
    router.navigate("room");
  }
</script>

<div class="flex flex-col items-center justify-center h-full gap-4 sm:gap-6 md:gap-8 p-4 landscape-compact landscape-scroll">
  <h2 class="text-2xl sm:text-3xl font-bold">Online Multiplayer</h2>

  <!-- Name input -->
  <div class="flex flex-col gap-1 w-full max-w-64 sm:max-w-80">
    <label class="text-sm text-gray-400">Your name</label>
    <input
      type="text"
      placeholder="Player name"
      bind:value={playerName}
      maxlength="16"
      class="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 text-sm sm:text-base"
    />
  </div>

  {#if error}
    <p class="text-red-400 text-sm">{error}</p>
  {/if}

  <div class="flex flex-col gap-3 sm:gap-4 w-full max-w-64 sm:max-w-80">
    <button
      class="bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 sm:py-3 rounded-lg transition-colors"
      onclick={createRoom}
      disabled={connecting}
    >
      Create Room
    </button>

    <div class="flex items-center gap-3">
      <div class="flex-1 border-t border-gray-700"></div>
      <span class="text-gray-500 text-sm">or</span>
      <div class="flex-1 border-t border-gray-700"></div>
    </div>

    <div class="flex gap-2">
      <input
        type="text"
        placeholder="Room code"
        bind:value={joinCode}
        maxlength="8"
        class="bg-gray-800 border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 flex-1 uppercase tracking-widest focus:outline-none focus:border-blue-500 text-sm sm:text-base"
      />
      <button
        class="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 sm:px-6 rounded-lg transition-colors"
        onclick={joinRoom}
        disabled={connecting}
      >
        Join
      </button>
    </div>
  </div>

  <button
    class="text-gray-500 hover:text-gray-300 text-sm"
    onclick={() => router.navigate("landing")}
  >
    Back
  </button>
</div>
