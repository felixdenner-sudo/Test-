const storageKey = "unsichere-login-demo-accounts-v1";

const loginArea = document.querySelector("#login-area");
const registerArea = document.querySelector("#register-area");
const privateArea = document.querySelector("#private-area");

const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const message = document.querySelector("#message");

// Gespeicherte Testkonten aus dem Browser lesen.
function loadAccounts() {
    const saved = localStorage.getItem(storageKey);
    const accounts = saved ? JSON.parse(saved) : [];

    const valid =
        Array.isArray(accounts) &&
        accounts.every(account =>
            account !== null &&
            typeof account === "object" &&
            typeof account.email === "string" &&
            typeof account.password === "string"
        );

    if (!valid) {
        throw new Error("Ungültige gespeicherte Konten");
    }

    return accounts;
}

// Nur den gewünschten Bereich anzeigen.
function showArea(area) {
    loginArea.hidden = area !== loginArea;
    registerArea.hidden = area !== registerArea;
    privateArea.hidden = area !== privateArea;
    message.textContent = "";
}

// Zur Registrierung wechseln.
document.querySelector("#show-register").addEventListener("click", () => {
    loginForm.reset();
    showArea(registerArea);
});

// Zur Anmeldung wechseln.
document.querySelector("#show-login").addEventListener("click", () => {
    registerForm.reset();
    showArea(loginArea);
});

// Einen neuen Testaccount erstellen.
registerForm.addEventListener("submit", event => {
    event.preventDefault();

    const email = document.querySelector("#register-email")
        .value.trim().toLowerCase();

    const password = document.querySelector("#register-password").value;
    const confirmation = document.querySelector("#register-confirm").value;

    if (password.length < 8) {
        message.textContent = "Bitte verwende mindestens 8 Zeichen.";
        return;
    }

    if (password !== confirmation) {
        message.textContent = "Die Passwörter stimmen nicht überein.";
        return;
    }

    try {
        const accounts = loadAccounts();

        if (accounts.some(account => account.email === email)) {
            message.textContent =
                "Für diese E-Mail-Adresse gibt es bereits einen Account.";
            return;
        }

        // UNSICHER: Das Passwort wird im Klartext gespeichert.
        accounts.push({ email, password });
        localStorage.setItem(storageKey, JSON.stringify(accounts));

        registerForm.reset();
        showArea(loginArea);

        document.querySelector("#login-email").value = email;
        message.textContent =
            "Account erstellt! Du kannst dich jetzt anmelden.";
    } catch {
        message.textContent =
            "Die Konten konnten nicht gelesen oder gespeichert werden. " +
            "Möglicherweise blockiert dein Browser den lokalen Speicher.";
    }
});

// Mit einem gespeicherten Testaccount anmelden.
loginForm.addEventListener("submit", event => {
    event.preventDefault();

    const email = document.querySelector("#login-email")
        .value.trim().toLowerCase();

    const password = document.querySelector("#login-password").value;

    try {
        const accounts = loadAccounts();

        const account = accounts.find(account =>
            account.email === email && account.password === password
        );

        if (!account) {
            message.textContent =
                "E-Mail-Adresse oder Passwort ist falsch.";
            return;
        }

        loginForm.reset();
        showArea(privateArea);

        // E-Mail als Text einfügen, nicht als HTML.
        document.querySelector("#welcome").textContent =
            "Willkommen, " + account.email + "!";
    } catch {
        message.textContent =
            "Die gespeicherten Konten konnten nicht gelesen werden.";
    }
});

// Abmelden.
document.querySelector("#logout").addEventListener("click", () => {
    document.querySelector("#welcome").textContent = "";
    showArea(loginArea);
});