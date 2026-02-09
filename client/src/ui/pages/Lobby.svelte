<script lang="ts">
  import { router } from "../../lib/stores/router.svelte";
  import { auth } from "../../lib/stores/auth.svelte";
  import { lobby } from "../../lib/stores/lobby.svelte";
  import { socket } from "../../lib/network/socket";
  import { initMessageHandler } from "../../lib/network/handler";

  let joinCode = $state("");
  let error = $state("");

  const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:9001";

  function createRoom() {
    // TODO: POST /api/rooms → get room_id + join_code
    // Then connect to game server WS
    const fakeCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    lobby.setRoom({ roomId: "r1", joinCode: fakeCode });
    connectWS(fakeCode);
  }

  function joinRoom() {
    if (!joinCode.trim()) return;
    lobby.setRoom({ roomId: "r-join", joinCode: joinCode.trim() });
    connectWS(joinCode.trim());
  }

  function connectWS(code: string) {
    initMessageHandler();
    socket.connect(`${WS_URL}/ws?room=${code}&token=${auth.token}`);
    router.navigate("room");
  }
</script>

<div class="flex flex-col items-center justify-center h-full gap-8">
  <h2 class="text-3xl font-bold">Lobby</h2>
  <p class="text-gray-400">Welcome, {auth.user?.username ?? "Player"}</p>

  {#if error}
    <p class="text-red-400 text-sm">{error}</p>
  {/if}

  <div class="flex flex-col gap-4 w-80">
    <button
      class="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition-colors"
      onclick={createRoom}
    >
      Create Room
    </button>

    <div class="flex gap-2">
      <input
        type="text"
        placeholder="Room code"
        bind:value={joinCode}
        class="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 flex-1 uppercase focus:outline-none focus:border-blue-500"
      />
      <button
        class="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 rounded-lg transition-colors"
        onclick={joinRoom}
      >
        Join
      </button>
    </div>

    <button
      class="text-sm text-gray-400 hover:text-white mt-4"
      onclick={() => { auth.clear(); router.navigate("landing"); }}
    >
      Logout
    </button>
  </div>
</div>
