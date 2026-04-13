<script lang="ts">
  import { router } from "../../lib/stores/router.svelte";
  import { auth } from "../../lib/stores/auth.svelte";
  import { api } from "../../lib/api/client";

  let email = $state("");
  let password = $state("");
  let error = $state("");
  let loading = $state(false);

  async function handleLogin() {
    error = "";
    loading = true;

    try {
      const res = await api.post<{ token: string; user: any }>("/auth/login", { email, password });
      auth.setAuth(res.token, res.user);
      router.navigate("lobby");
    } catch (e) {
      error = e instanceof Error ? e.message : "Login failed";
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex flex-col items-center justify-center h-full gap-4 sm:gap-6 p-4 landscape-compact">
  <h2 class="text-2xl sm:text-3xl font-bold">Login</h2>

  {#if error}
    <p class="text-red-400 text-sm">{error}</p>
  {/if}

  <div class="flex flex-col gap-3 sm:gap-4 w-full max-w-64 sm:max-w-80">
    <input
      type="email"
      placeholder="Email"
      bind:value={email}
      class="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 sm:py-3 focus:outline-none focus:border-blue-500 text-sm sm:text-base"
    />
    <input
      type="password"
      placeholder="Password"
      bind:value={password}
      class="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 sm:py-3 focus:outline-none focus:border-blue-500 text-sm sm:text-base"
    />

    <button
      class="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white font-bold py-2.5 sm:py-3 rounded-lg transition-colors"
      disabled={loading || !email || !password}
      onclick={handleLogin}
    >
      {loading ? "Logging in..." : "Login"}
    </button>

    <div class="flex justify-between text-sm text-gray-400">
      <button class="hover:text-white" onclick={() => router.navigate("register")}>
        Create account
      </button>
      <button class="hover:text-white" onclick={() => router.navigate("landing")}>
        Back
      </button>
    </div>
  </div>
</div>
