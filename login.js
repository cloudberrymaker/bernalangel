

const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const form = document.getElementById("loginForm");

const formTitle = document.getElementById("formTitle");
const subtitle = document.getElementById("subtitle");

const nameGroup = document.getElementById("nameGroup");
const confirmGroup = document.getElementById("confirmGroup");

const readerName = document.getElementById("readerName");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");

const submitButton = document.getElementById("submitButton");
const formMessage = document.getElementById("formMessage");

const switchText = document.getElementById("switchText");
const switchMode = document.getElementById("switchMode");

const ACCOUNT_KEY = "museum_reader_account";
const SESSION_KEY = "museum_demo_session";

let currentMode = "login";


/* ==========================================
   SHOW MESSAGES
========================================== */

function showMessage(message, type = "error") {
  formMessage.textContent = message;
  formMessage.className = "form-message " + type;
}


/* ==========================================
   SWITCH BETWEEN LOG IN AND SIGN UP
========================================== */

function setMode(mode) {
  currentMode = mode;

  const isSignup = mode === "signup";

  loginTab.classList.toggle("active", !isSignup);
  signupTab.classList.toggle("active", isSignup);

  loginTab.setAttribute("aria-selected", String(!isSignup));
  signupTab.setAttribute("aria-selected", String(isSignup));

  nameGroup.hidden = !isSignup;
  confirmGroup.hidden = !isSignup;

  readerName.required = isSignup;
  confirmPassword.required = isSignup;

  password.autocomplete = isSignup
    ? "new-password"
    : "current-password";

  formTitle.textContent = isSignup
    ? "Begin Your Story"
    : "Welcome Back";

  subtitle.textContent = isSignup
    ? "Every beautiful story starts somewhere."
    : "Your next chapter is waiting.";

  submitButton.textContent = isSignup
    ? "Create My Account →"
    : "Log In →";

  switchText.firstChild.textContent = isSignup
    ? "Already part of our story? "
    : "New to our little corner? ";

  switchMode.textContent = isSignup
    ? "Log In"
    : "Create an account";

  form.reset();
  showMessage("", "");

  document.querySelectorAll("[data-toggle-password]")
    .forEach(button => {
      const input = document.getElementById(
        button.dataset.togglePassword
      );

      if (input) input.type = "password";

      button.textContent = "Show";
      button.setAttribute("aria-label", "Show password");
    });
}


/* ==========================================
   TAB EVENTS
========================================== */

loginTab.addEventListener("click", () => {
  setMode("login");
});

signupTab.addEventListener("click", () => {
  setMode("signup");
});

switchMode.addEventListener("click", () => {
  setMode(currentMode === "login" ? "signup" : "login");
});


/* ==========================================
   SHOW / HIDE PASSWORD
========================================== */

document.querySelectorAll("[data-toggle-password]")
  .forEach(button => {
    button.addEventListener("click", () => {
      const input = document.getElementById(
        button.dataset.togglePassword
      );

      if (!input) return;

      const show = input.type === "password";

      input.type = show ? "text" : "password";
      button.textContent = show ? "Hide" : "Show";

      button.setAttribute(
        "aria-label",
        show ? "Hide password" : "Show password"
      );
    });
  });


/* ==========================================
   READ SAVED ACCOUNT
========================================== */

function getAccount() {
  try {
    const saved = localStorage.getItem(ACCOUNT_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}


/* ==========================================
   PASSWORD HASH
   Prototype only, not server authentication
========================================== */

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(value, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + ":" + value);

  const digest = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  return bytesToHex(new Uint8Array(digest));
}


/* ==========================================
   SIGN UP
========================================== */

async function createAccount() {
  const nameValue = readerName.value.trim();
  const emailValue = email.value.trim().toLowerCase();
  const passwordValue = password.value;
  const confirmValue = confirmPassword.value;

  if (nameValue.length < 2) {
    showMessage("Please enter your reader name.");
    return;
  }

  if (!emailValue) {
    showMessage("Please enter your email address.");
    return;
  }

  if (passwordValue.length < 8) {
    showMessage("Use at least 8 characters for your password.");
    return;
  }

  if (passwordValue !== confirmValue) {
    showMessage("Your passwords do not match.");
    return;
  }

  if (getAccount()) {
    showMessage(
      "An account already exists in this browser. Please log in."
    );
    return;
  }

  const salt = bytesToHex(
    crypto.getRandomValues(new Uint8Array(16))
  );

  const passwordHash = await hashPassword(
    passwordValue,
    salt
  );

  const account = {
    name: nameValue,
    email: emailValue,
    salt,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  localStorage.setItem(
    ACCOUNT_KEY,
    JSON.stringify(account)
  );

  setMode("login");
  email.value = emailValue;

  showMessage(
    "Your account is ready! Log in to begin reading. ♡",
    "success"
  );
}


/* ==========================================
   LOG IN
========================================== */

async function loginAccount() {
  const emailValue = email.value.trim().toLowerCase();
  const passwordValue = password.value;

  const account = getAccount();

  if (!account) {
    showMessage(
      "No account found in this browser. Please sign up first."
    );
    return;
  }

  const enteredHash = await hashPassword(
    passwordValue,
    account.salt
  );

  if (
    emailValue !== account.email ||
    enteredHash !== account.passwordHash
  ) {
    showMessage(
      "Incorrect email or password. Please try again."
    );
    return;
  }

  sessionStorage.setItem(
    SESSION_KEY,
    account.name
  );

  window.location.href = "index.html";
}


/* ==========================================
   SUBMIT FORM
========================================== */

form.addEventListener("submit", async event => {
  event.preventDefault();

  submitButton.disabled = true;

  try {
    if (currentMode === "signup") {
      await createAccount();
    } else {
      await loginAccount();
    }
  } catch (error) {
    console.error(error);

    showMessage(
      "Something went wrong. Please try again."
    );
  } finally {
    submitButton.disabled = false;
  }
});


/* ==========================================
   INITIAL FORM
========================================== */

setMode("login");
