// Beagle of the Moment — fetches a random beagle photo from the Dog CEO API.

const API_URL = "https://dog.ceo/api/breed/beagle/images/random";

const card = document.querySelector(".card");
const img = document.getElementById("beagle");
const errorEl = document.querySelector(".card__error");
const counterEl = document.getElementById("counter");
const button = document.getElementById("next");

let count = 0;
let inFlight = false;

/**
 * Fetch a random beagle URL from the Dog CEO API.
 * Throws on network or API failure.
 */
async function fetchBeagleUrl() {
  const res = await fetch(API_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== "success" || typeof data.message !== "string") {
    throw new Error("Unexpected API response");
  }
  return data.message;
}

/**
 * Preload an image so we can swap it in only once it's ready.
 * Resolves with the URL when loaded; rejects on error.
 */
function preload(url) {
  return new Promise((resolve, reject) => {
    const probe = new Image();
    probe.onload = () => resolve(url);
    probe.onerror = () => reject(new Error("Image failed to load"));
    probe.src = url;
  });
}

function setBusy(busy) {
  card.setAttribute("aria-busy", busy ? "true" : "false");
  button.classList.toggle("is-loading", busy);
  button.disabled = busy;
}

function showError() {
  errorEl.hidden = false;
  img.classList.remove("is-loaded");
}

function hideError() {
  errorEl.hidden = true;
}

async function loadNextBeagle() {
  if (inFlight) return;
  inFlight = true;
  hideError();
  setBusy(true);
  img.classList.remove("is-loaded");

  try {
    const url = await fetchBeagleUrl();
    await preload(url);
    img.src = url;
    img.classList.add("is-loaded");
    count += 1;
    counterEl.textContent = `Beagle #${count}`;
  } catch (err) {
    console.error("Beagle load failed:", err);
    showError();
  } finally {
    setBusy(false);
    inFlight = false;
  }
}

button.addEventListener("click", loadNextBeagle);

// Keyboard convenience: spacebar / right arrow advances when not focused on the button.
document.addEventListener("keydown", (e) => {
  const isShortcut =
    (e.key === " " || e.key === "ArrowRight") && document.activeElement !== button;
  if (isShortcut) {
    e.preventDefault();
    loadNextBeagle();
  }
});

// Initial load.
loadNextBeagle();
