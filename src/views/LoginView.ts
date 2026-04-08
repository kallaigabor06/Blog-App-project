import { BlogState } from '../state/BlogState';

/**
 * LoginView – a bejelentkezési forma HTML-je és logikája
 * 
 * Felelőssége:
 * 1. Bejelentkezési forma megjelenítése (username, password, submit gomb)
 * 2. Form submit kezelése
 * 3. Error üzenet megjelenítése
 * 4. Loading state kezelése
 */
export class LoginView {
    private state: BlogState;
    private container: HTMLElement;

    constructor(state: BlogState, container: HTMLElement) {
        this.state = state;
        this.container = container;
    }

    /**
     * A teljes login form HTML-jét generálja és megjelenítésére kerül
     */
    render(): void {
        const isLoading = this.state.isLoading;
        const error = this.state.lastError;

        this.container.innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <h1>Blog Alkalmazás</h1>
                    <h2>Bejelentkezés</h2>
                    
                    <form id="login-form">
                        <!-- Felhasználónév mező -->
                        <div class="form-group">
                            <label for="username">Felhasználónév:</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                placeholder="Felhasználónév"
                                ${isLoading ? 'disabled' : ''}
                                required
                            />
                        </div>

                        <!-- Jelszó mező -->
                        <div class="form-group">
                            <label for="password">Jelszó:</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Jelszó"
                                ${isLoading ? 'disabled' : ''}
                                required
                            />
                        </div>

                        <!-- Error üzenet -->
                        ${error ? `<div class="error-message">${error}</div>` : ''}

                        <!-- Submit gomb -->
                        <button
                            type="submit"
                            ${isLoading ? 'disabled' : ''}
                            class="btn-submit"
                        >
                            ${isLoading ? 'Betöltés...' : 'Bejelentkezés'}
                        </button>
                    </form>

                    <!-- Teszt adat hint -->
                    <div class="hint">
                        <p><strong>Teszt adat:</strong></p>
                        <p>Felhasználónév: <code>admin / adminisztrator</code></p>
                        <p>Jelszó: <code>admin123 / jelszo123</code></p>
                    </div>
                </div>
            </div>
        `;

        // Form submit esemény kezelése
        const form = this.container.querySelector('#login-form') as HTMLFormElement;
        form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    /**
     * Form submit kezelése
     */
    private async handleSubmit(e: Event): Promise<void> {
        e.preventDefault();

        // Mezők lekérése
        const usernameInput = this.container.querySelector('#username') as HTMLInputElement;
        const passwordInput = this.container.querySelector('#password') as HTMLInputElement;

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            alert('Adjon meg felhasználónevet és jelszót!');
            return;
        }

        try {
            // BlogState login metódusa meghívása
            await this.state.login(username, password);
            // Sikeres login után a main.ts által triggert kapva újra fog renderelni
        } catch (err) {
            // Hiba már van a state-ben, ez az okozza a re-render-t
        }
    }
}
