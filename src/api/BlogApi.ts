// ── Típus importálások a types.ts-ből ──────────────────────────────────────
// User: bejelentkezett felhasználó objektuma
// LoginResponse: login válasz (token + user)
// PostCreateInput: új poszt létrehozásához szükséges adatok
// Post: poszt teljes objektuma
import { User, LoginResponse, PostCreateInput, Post } from '../types'

/**
 * Az API szerver hibaválaszának típusa.
 * Pl: { error: "Nem vagy bejelentkezve!" }
 */
export type ApiError = { error: string };

/**
 * BlogApi osztály – TypeScript kliens a blog backend-hez.
 * 
 * Felelősségei:
 * 1. HTTP kérések küldése a backend felé
 * 2. Automatikus Authorization fejléc hozzáadása
 * 3. JSON válaszok feldolgozása és hibakezelés
 * 4. Típusosság biztosítása minden válaszhoz
 */
export class BlogApi {
    /**
     * Konstruktor
     * @param baseUrl - backend URL (pl: http://localhost:3001)
     * @param getToken - függvény, amely a tárolt tokent adja vissza
     */
    constructor(private baseUrl: string, private getToken: () => string | null) { }

    /**
     * Közös HTTP kérés függvény – minden API hívás ezen megy keresztül.
     * 
     * Folyamata:
     * 1. Token lekérése (ha van)
     * 2. Headers összeállítása (Content-Type + Authorization)
     * 3. Fetch küldése
     * 4. JSON válasz parssolása
     * 5. Hiba- vagy siker-ellenőrzés
     * 
     * @param path - API útvonal (pl: /api/login)
     * @param init - opcionális RequestInit (method, body stb.)
     * @returns Promise<T> - típusos válasz
     */
    private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
        // 1. Token lekérése a localStorage-ből (ha van)
        const token = this.getToken();

        // 2. Headers összeállítása
        const headers: Record<string, string> = {
            // Alap: azt mondjuk, hogy JSON-ben küldjük
            "Content-Type": "application/json",
            // Felül lehet írni további headereket az init-ből, ha vannak
            ...(init.headers as Record<string, string> || {})
        };

        // 3. Ha van token, Authorization fejléc hozzáadása
        // "Bearer <token>" formátum a standard
        if (token) headers.Authorization = "Bearer " + token;

        // 4. Tényleges fetch hívás
        // Összerakja az URL-t: baseUrl + path (pl: http://localhost:3001/api/login)
        const res = await fetch(this.baseUrl + path, { ...init, headers });
        
        // 5. JSON válasz parssolása (sikeres és hibás válaszok is JSON)
        const data = await res.json();

        // 6. Hiba-ellenőrzés: ha status nem 2xx (200-299)
        if (!res.ok) {
            // Dobunk egy Error-t az API üzenettel, vagy fallback üzenettel
            throw new Error((data as ApiError).error || "Hiba történt");
        }
        
        // 7. Sikeres válasz típusosítva visszaadása
        return data as T;
    }

    /**
     * Bejelentkezés – felhasználónév + jelszó alapján.
     * 
     * Backend végpont: POST /api/login
     * Teszt adat: { username: "admin", password: "jelszo" }
     * 
     * Válasz: { token: "abc123...", user: { id, username, role, nev } }
     * 
     * @param username - felhasználónév
     * @param password - jelszó
     * @returns Promise<LoginResponse> - token + user adatok
     */
    login(username: string, password: string) {
        return this.request<LoginResponse>("/api/login", {
            // POST metódus: az authentikációs endpoint felé küldjük az adatokat
            method: "POST",
            // Body-ban küldünk username + password JSON-ben
            body: JSON.stringify({ username, password })
        });
    }

    /**
     * Kijelentkezés – a tokent törlöm a backend-en.
     * 
     * Backend végpont: POST /api/logout
     * Authorization fejléc automatikusan kerül (a request függvénybe van beépítve)
     * 
     * Válasz: { message: "Sikeres kijelentkezés!" }
     * 
     * @returns Promise<{ message: string }> - sikertelen üzenet
     */
    logout() {
        return this.request<{ message: string }>("/api/logout", { method: "POST" });
    }

    /**
     * Az aktuálisan bejelentkezett felhasználó adatainak lekérése.
     * 
     * Backend végpont: GET /api/me
     * Kötelező: Authorization fejléc (érvényes token)
     * 
     * Válasz: { id, username, role, nev }
     * Hiba: 401 – nincs bejelentkezve
     * 
     * @returns Promise<User> - a jelenlegi user objektuma
     */
    me() {
        return this.request<User>("/api/me");
    }

    /**
     * Összes poszt lekérése (nyilvános végpont, nincs szükség authentikációra).
     * 
     * Backend végpont: GET /posts
     * Authorization: nem szükséges
     * 
     * Válasz: [ { id, title, content, categoryId }, ... ]
     * 
     * @returns Promise<Post[]> - poszt tömb
     */
    getPosts() {
        return this.request<Post[]>("/posts");
    }

    /**
     * Új poszt létrehozása (csak bejelentkezve és admin/adminisztrátor role).
     * 
     * Backend végpont: POST /posts
     * Kötelező: Authorization fejléc (érvényes token)
     * 
     * Input: { title: string, content: string, categoryId?: number }
     * Válasz: az újonnan létrehozott poszt teljes objektuma (id-vel)
     * 
     * Hibakezelés:
     * - 401: hiányzik a token (nem vagy bejelentkezve)
     * - 403: nincs megfelelő role (csak admin/adminisztrátor írhat)
     * 
     * @param input - { title, content, categoryId? }
     * @returns Promise<Post> - az új poszt teljes objektuma
     */
    createPost(input: PostCreateInput) {
        return this.request<Post>("/posts", {
            // POST: új erőforrás létrehozása
            method: "POST",
            // Body-ban a poszt adatai
            body: JSON.stringify(input)
            // Authorization: automatikusan hozzáadódik a request-ben
        });
    }

    deletePost(id: number) {
        return this.request<void>("/posts/" + id, { method: "DELETE" });
    }
}