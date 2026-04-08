import { BlogApi } from '../api/BlogApi';
import { User } from '../types';

/**
 * BlogState – az alkalmazás teljes auth + blog adatállapotát kezeli.
 * 
 * Felelősségei:
 * 1. Login/Logout kezelése
 * 2. Token tárolása localStorage-ben
 * 3. Aktuális user párol követése
 * 4. Poszt lista kezelése
 * 5. UI re-render triggering
 */
export class BlogState {
    // Private adatok
    private api: BlogApi;
    private currentUser: User | null = null;
    private posts: any[] = [];
    private loading = false;
    private error: string | null = null;
    private listeners: Set<() => void> = new Set();

    // Private segédfüggvény: token lekérése localStorage-ből
    private getToken = (): string | null => {
        return localStorage.getItem('token');
    };

    constructor(baseUrl: string) {
        // API kliens inicializálása
        this.api = new BlogApi(baseUrl, this.getToken);
        
        // App indításakor: ha van token, megpróbáljuk betölteni a user adatait
        this.loadMeIfTokenExists();
    }

    // ── Publikus getter metódusok ──────────────────────────────────────────

    /**
     * Az aktuálisan bejelentkezett user, vagy null ha nincs
     */
    get user(): User | null {
        return this.currentUser;
    }

    /**
     * Összes poszt
     */
    get allPosts() {
        return this.posts;
    }

    /**
     * Loading állapot (pl. "Betöltés...")
     */
    get isLoading(): boolean {
        return this.loading;
    }

    /**
     * Utolsó hiba üzenete, vagy null
     */
    get lastError(): string | null {
        return this.error;
    }

    /**
     * Van-e bejelentkezve?
     */
    get isLoggedIn(): boolean {
        return this.currentUser !== null;
    }

    // ── State listener management ──────────────────────────────────────────

    /**
     * Observer pattern: UI komponensek feliratkoznak az state változásokra.
     * Amikor meghívódik a notify(), minden listener újrarenderelődik.
     * 
     * @param callback - függvény, amit meghívunk, ha state változik
     */
    subscribe(callback: () => void): void {
        this.listeners.add(callback);
    }

    /**
     * Feliratkozás törlése
     */
    unsubscribe(callback: () => void): void {
        this.listeners.delete(callback);
    }

    /**
     * Privatban szólít: értesít minden listeners-t, hogy újra kell renderelni
     */
    private notify(): void {
        this.listeners.forEach(callback => callback());
    }

    // ── Login / Logout ─────────────────────────────────────────────────────

    /**
     * Bejelentkezés username + password alapján
     */
    async login(username: string, password: string): Promise<void> {
        try {
            this.loading = true;
            this.error = null;

            // API hívás
            const response = await this.api.login(username, password);

            // Token mentése localStorage-be
            localStorage.setItem('token', response.token);

            // User tárolása state-ben
            this.currentUser = response.user;

            // UI update
            this.notify();
        } catch (err: any) {
            this.error = err.message || 'Bejelentkezés sikertelen!';
            this.notify();
            throw err;
        } finally {
            this.loading = false;
        }
    }

    /**
     * Kijelentkezés
     */
    async logout(): Promise<void> {
        try {
            this.loading = true;
            this.error = null;

            // API hívás logout-ra
            await this.api.logout();

            // Token törlése localStorage-ből
            localStorage.removeItem('token');

            // User és poszt lista nullázása
            this.currentUser = null;
            this.posts = [];

            // UI update
            this.notify();
        } catch (err: any) {
            this.error = err.message || 'Kijelentkezés sikertelen!';
            this.notify();
            throw err;
        } finally {
            this.loading = false;
            this.notify();
        }
    }

    // ── User loaded check ──────────────────────────────────────────────────

    /**
     * App indításakor: ha van token, betöltjük az aktuális user adatait
     */
    private async loadMeIfTokenExists(): Promise<void> {
        const token = this.getToken();
        if (!token) return; // Nincs token, nincs mit betölteni

        try {
            this.loading = true;
            const user = await this.api.me();
            this.currentUser = user;
            this.notify();
        } catch (err) {
            // Token érvénytelen, törlöm
            localStorage.removeItem('token');
            this.currentUser = null;
        } finally {
            this.loading = false;
        }
    }

    // ── Posts kezelése ─────────────────────────────────────────────────────

    /**
     * Összes poszt betöltése (publikus, nem szükséges login)
     */
    async loadPosts(): Promise<void> {
        try {
            this.loading = true;
            this.error = null;

            this.posts = await this.api.getPosts();
            this.notify();
        } catch (err: any) {
            this.error = err.message || 'Poszt betöltés sikertelen!';
            this.notify();
            throw err;
        } finally {
            this.loading = false;
        }
    }

    /**
     * Új poszt létrehozása
     */
    async createPost(title: string, content: string, categoryId?: number): Promise<any> {
        try {
            this.loading = true;
            this.error = null;

            const newPost = await this.api.createPost({ title, content, categoryId });

            // Új poszt hozzáadása a listához
            this.posts.push(newPost);
            this.notify();

            return newPost;
        } catch (err: any) {
            this.error = err.message || 'Poszt létrehozás sikertelen!';
            this.notify();
            throw err;
        } finally {
            this.loading = false;
        }
    }

    /**
     * Poszt törlése (csak admin)
     */
    async deletePost(id: number): Promise<void> {
        try {
            this.loading = true;
            this.error = null;

            await this.api.deletePost(id);

            // Poszt eltávolítása a listából
            this.posts = this.posts.filter(p => p.id !== id);
            this.notify();
        } catch (err: any) {
            this.error = err.message || 'Poszt törlés sikertelen!';
            this.notify();
            throw err;
        } finally {
            this.loading = false;
        }
    }
}
