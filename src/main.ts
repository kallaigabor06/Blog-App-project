import './style.css';
import { BlogState } from './state/BlogState';
import { LoginView } from './views/LoginView';

/**
 * App inicializálása
 * 
 * 1. BlogState létrehozása (auth + adatkezelés)
 * 2. LoginView komponens létrehozása
 * 3. State listener hozzáadása: ha state változik, újra render
 * 4. Kezdeti render
 */
function initApp(): void {
    // 1. HTML konténer lekérése
    const appContainer = document.getElementById('app');
    if (!appContainer) {
        console.error('App konténer nem található!');
        return;
    }

    // 2. BlogState inicializálása
    // baseUrl: backend URL (3001-es port)
    const state = new BlogState('http://localhost:3001');

    // 3. LoginView inicializálása
    const loginView = new LoginView(state, appContainer);

    // 4. State listener: ha bármi megváltozik a state-ben, újra renderelünk
    state.subscribe(() => {
        if (state.isLoggedIn) {
            // Ha bejelentkezett: később ide jöhet a PostsListView
            appContainer.innerHTML = `
                <div class="dashboard">
                    <h1>Blog Dashboard</h1>
                    <p>Üdvözlünk, ${state.user?.nev}! (${state.user?.role})</p>
                    <button id="logout-btn">Kijelentkezés</button>
                </div>
            `;

            // Logout gomb kezelése
            const logoutBtn = appContainer.querySelector('#logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    await state.logout();
                });
            }
        } else {
            // Ha nincs bejelentkezve: login form
            loginView.render();
        }
    });

    // 5. Kezdeti render
    loginView.render();
}

// App indítása, amikor a DOM betöltődött
document.addEventListener('DOMContentLoaded', initApp);
