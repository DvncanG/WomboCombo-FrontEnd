export interface UserData {
  id: number;
  username: string;
  email: string;
  display_name: string;
}

class AuthStore {
  token = $state<string | null>(null);
  user = $state<UserData | null>(null);
  isAuthenticated = $derived(this.token !== null);

  setAuth(token: string, user: UserData) {
    this.token = token;
    this.user = user;
  }

  clear() {
    this.token = null;
    this.user = null;
  }
}

export const auth = new AuthStore();
