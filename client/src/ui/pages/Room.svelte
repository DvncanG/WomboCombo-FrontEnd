<script lang="ts">
  import { router } from "../../lib/stores/router.svelte";
  import { lobby } from "../../lib/stores/lobby.svelte";
  import { auth } from "../../lib/stores/auth.svelte";
  import { api } from "../../lib/api/client";

  interface RoomDetailResponse {
    room: { id: number; code: string; name: string; host_id: number; max_players: number; status: string };
    host_name: string;
    players: Array<{ id: number; username: string; display_name: string; joined_at: string }>;
  }

  let roomPlayers = $state<RoomDetailResponse["players"]>([]);
  let roomInfo = $state<RoomDetailResponse["room"] | null>(null);
  let pollTimer: ReturnType<typeof setInterval> | undefined;

  async function loadRoom() {
    if (!lobby.room?.joinCode) return;
    try {
      const res = await api.get<RoomDetailResponse>(`/rooms/${lobby.room.joinCode}`);
      roomPlayers = res.players ?? [];
      roomInfo = res.room;
    } catch { /* ignore */ }
  }

  // Poll room state every 3 seconds
  $effect(() => {
    loadRoom();
    pollTimer = setInterval(loadRoom, 3000);
    return () => clearInterval(pollTimer);
  });

  async function leaveRoom() {
    if (lobby.room?.joinCode) {
      try {
        await api.post(`/rooms/${lobby.room.joinCode}/leave`, {});
      } catch { /* ignore */ }
    }
    lobby.clear();
    router.navigate("lobby");
  }

  function copyCode() {
    if (lobby.room?.joinCode) {
      navigator.clipboard.writeText(lobby.room.joinCode);
    }
  }
</script>

<div class="flex flex-col items-center justify-center h-full gap-6">
  <!-- Room code (shareable) -->
  <div class="text-center">
    <h2 class="text-2xl font-bold mb-2">Room</h2>
    {#if lobby.room}
      <div class="flex items-center gap-2 justify-center">
        <span class="bg-gray-700 px-5 py-2 rounded-lg font-mono text-2xl tracking-widest text-yellow-300">
          {lobby.room.joinCode}
        </span>
        <button
          class="text-gray-400 hover:text-white text-sm bg-gray-700 px-3 py-2 rounded-lg"
          onclick={copyCode}
          title="Copy code"
        >
          Copy
        </button>
      </div>
      <p class="text-gray-500 text-xs mt-1">Share this code with your opponent</p>
    {/if}
  </div>

  <!-- Room info -->
  {#if roomInfo}
    <p class="text-gray-400 text-sm">{roomInfo.name}</p>
  {/if}

  <!-- Player list -->
  <div class="bg-gray-800 rounded-xl p-4 w-96">
    <h3 class="text-sm text-gray-400 mb-3">Players ({roomPlayers.length}/{roomInfo?.max_players ?? 2})</h3>
    {#if roomPlayers.length === 0}
      <p class="text-gray-500 text-sm italic">Waiting for players...</p>
    {:else}
      {#each roomPlayers as player}
        <div class="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
          <span class="font-medium">{player.display_name || player.username}</span>
          <span class="text-gray-500 text-xs">{player.id === roomInfo?.host_id ? "HOST" : "Player"}</span>
        </div>
      {/each}
    {/if}

    {#if roomPlayers.length >= (roomInfo?.max_players ?? 2)}
      <div class="mt-3 text-center text-green-400 text-sm animate-pulse font-bold">
        Room full! Ready to fight
      </div>
    {/if}
  </div>

  <!-- Actions -->
  <div class="flex gap-3">
    <button
      class="bg-gray-600 hover:bg-gray-500 text-white py-2 px-6 rounded-lg transition-colors"
      onclick={leaveRoom}
    >
      Leave
    </button>
  </div>
</div>
