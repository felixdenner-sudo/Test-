const storageKey = "unsichere-login-demo-accounts-v1";

const sessionKey = "login-demo-session-v1";
const plans = {
    "5": { name: "5 Minuten", price: "Einmal Abwaschen" },
    "15": { name: "15 Minuten", price: "Zweimal Abwaschen" },
    "30": { name: "30 Minuten", price: "Den Rest der Woche Abwaschen" }
};
const params = new URLSearchParams(window.location.search);
const planId = params.get("tarif");
const plan = Object.hasOwn(plans, planId) ? plans[planId] : null;

function currentEmail() {
    const email = sessionStorage.getItem(sessionKey);
    return email && loadAccounts().some(account => account.email === email) ? email : null;
}

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

if (loginForm) {
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

        sessionStorage.setItem(sessionKey, account.email);
        loginForm.reset();
        if (params.get("weiter") === "kaufen" && plan) {
            window.location.href = "kaufen.html?tarif=" + encodeURIComponent(planId);
            return;
        }
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
    sessionStorage.removeItem(sessionKey);
    document.querySelector("#welcome").textContent = "";
    showArea(loginArea);
});
try {
    const email = currentEmail();
    if (email) {
        showArea(privateArea);
        document.querySelector("#welcome").textContent = "Willkommen, " + email + "!";
        if (params.get("weiter") === "kaufen" && plan) {
            window.location.replace("kaufen.html?tarif=" + encodeURIComponent(planId));
        }
    } else if (params.get("weiter") === "kaufen") {
        message.textContent = "Bitte melde dich an, um deinen Kauf zu bestätigen. Deine Tarifauswahl bleibt erhalten.";
    }
} catch {
    message.textContent = "Der Browserspeicher ist nicht verfügbar. Bitte erlaube ihn für die Anmeldung.";
}
}

const purchaseForm = document.querySelector("#purchase-form");
if (purchaseForm) {
    const status = document.querySelector("#purchase-status");
    const button = document.querySelector("#confirm-purchase");
    const loginLink = document.querySelector("#purchase-login");
    const emailLabel = document.querySelector("#purchase-email");
    let sending = false;
    let completed = false;

    function checkLogin() {
        const email = currentEmail();
        loginLink.hidden = Boolean(email);
        button.hidden = !email;
        emailLabel.textContent = email ? "E-Mail-Adresse: " + email : "";
        if (!email) status.textContent = "Bitte melde dich an, bevor du den Kauf bestätigst.";
        return email;
    }

    if (!plan) {
        status.textContent = "Bitte wähle zuerst auf der Startseite einen Tarif aus.";
        button.hidden = true;
    } else {
        document.querySelector("#purchase-plan").textContent = plan.name + " – " + plan.price;
        loginLink.href = "einloggen.html?weiter=kaufen&tarif=" + encodeURIComponent(planId);
        try {
            checkLogin();
        } catch {
            button.hidden = true;
            status.textContent = "Die Anmeldung konnte nicht gelesen werden. Bitte erlaube den Browserspeicher und melde dich erneut an.";
            loginLink.hidden = false;
        }
    }

    purchaseForm.addEventListener("submit", async event => {
        event.preventDefault();
        if (!plan || sending || completed) return;
        try {
            const email = checkLogin();
            if (!email) return;
            sending = true;
            button.disabled = true;
            status.textContent = "Deine Kaufbestätigung wird gesendet …";
            const response = await fetch("https://formspree.io/f/xgavprye", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({
                    email,
                    tarif: plan.name,
                    gegenleistung: plan.price,
                    message: "Kaufbestätigung: " + email + " hat den Tarif " + plan.name + " (" + plan.price + ") ausgewählt und bestätigt."
                })
            });
            if (!response.ok) throw new Error("Übermittlung fehlgeschlagen");
            completed = true;
            button.hidden = true;
            status.textContent = "Danke für deinen Einkauf! Deine Kaufbestätigung wurde erfolgreich übermittelt.";
        } catch {
            status.textContent = "Die Kaufbestätigung konnte nicht gesendet werden. Bitte prüfe deine Verbindung und Anmeldung und versuche es erneut.";
        } finally {
            sending = false;
            button.disabled = completed;
        }
    });
}
