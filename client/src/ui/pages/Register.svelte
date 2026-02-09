<script lang="ts">
  import { router } from "../../lib/stores/router.svelte";

  let username = $state("");
  let email = $state("");
  let password = $state("");
  let error = $state("");
  let loading = $state(false);

  async function handleRegister() {
    error = "";
    loading = true;
    try {
      // TODO: api.post("/auth/register", { username, email, password });
      console.log("[Register] Placeholder:", username, email);
      router.navigate("login");
    } catch (e) {
      error = e instanceof Error ? e.message : "Registration failed";
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex flex-col items-center justify-center h-full gap-6">
  <h2 class="text-3xl font-bold">Create Account</h2>

  {#if error}
    <p class="text-red-400 text-sm">{error}</p>
  {/if}

  <div class="flex flex-col gap-4 w-80">
    <input
      type="text"
      placeholder="Username"
      bind:value={username}
      class="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
    />
    <input
      type="email"
      placeholder="Email"
      bind:value={email}
      class="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
    />
    <input
      type="password"
      placeholder="Password"
      bind:value={password}
      class="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
    />

    <button
      class="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
      disabled={loading || !username || !email || !password}
      onclick={handleRegister}
    >
      {loading ? "Creating..." : "Register"}
    </button>

    <button
      class="text-sm text-gray-400 hover:text-white"
      onclick={() => router.navigate("login")}
    >
      Already have an account? Login
    </button>
  </div>
</div>
