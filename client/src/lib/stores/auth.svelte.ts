export interface UserData {
  id: string;
  username: string;
  email: string;
}

class AuthStore {
  token = $state<string | null>(null);
  refreshToken = $state<string | null>(null);
  user = $state<UserData | null>(null);
  isAuthenticated = $derived(this.token !== null);

  setAuth(token: string, refreshToken: string, user: UserData) {
    this.token = token;
    this.refreshToken = refreshToken;
    this.user = user;
  }

  clear() {
    this.token = null;
    this.refreshToken = null;
    this.user = null;
  }
}

export const auth = new AuthStore();
