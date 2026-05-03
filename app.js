// Dog of the Moment — fetches a random dog photo from the Dog CEO API.
// The breed selector lets you switch between several popular breeds.

const API_BASE = "https://dog.ceo/api/breed";

const card = document.querySelector(".card");
const img = document.getElementById("dog");
const errorEl = document.querySelector(".card__error");
const counterEl = document.getElementById("counter");
const button = document.getElementById("next");
const breedSelect = document.getElementById("breed");

// Per-breed counters so each breed starts at #1 and counts up independently.
const counts = new Map();
let inFlight = false;
// Token to invalidate stale fetches when the user changes breed mid-load.
let requestToken = 0;

function currentBreed() {
  return breedSelect.value;
}

function currentBreedLabel() {
  const opt = breedSelect.options[breedSelect.selectedIndex];
  return opt?.dataset.label ?? opt?.textContent ?? "Dog";
}

/**
 * Fetch a random image URL for the given breed path (e.g. "beagle" or "retriever/golden").
 * Throws on network or API failure.
 */
async function fetchDogUrl(breedPath) {
  const res = await fetch(`${API_BASE}/${breedPath}/images/random`, { cache: "no-store" });
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
  breedSelect.disabled = busy;
}

function showError() {
  errorEl.hidden = false;
  img.classList.remove("is-loaded");
}

function hideError() {
  errorEl.hidden = true;
}

function updateCounter(label, n) {
  counterEl.textContent = `${label} #${n}`;
}

async function loadNextDog() {
  if (inFlight) return;
  inFlight = true;
  const myToken = ++requestToken;
  const breedPath = currentBreed();
  const label = currentBreedLabel();

  hideError();
  setBusy(true);
  img.classList.remove("is-loaded");

  try {
    const url = await fetchDogUrl(breedPath);
    await preload(url);
    // Bail out if the user changed breed while we were loading.
    if (myToken !== requestToken) return;
    img.src = url;
    img.alt = `A random ${label}`;
    img.classList.add("is-loaded");
    const next = (counts.get(breedPath) ?? 0) + 1;
    counts.set(breedPath, next);
    updateCounter(label, next);
  } catch (err) {
    if (myToken !== requestToken) return;
    console.error("Dog load failed:", err);
    showError();
  } finally {
    if (myToken === requestToken) {
      setBusy(false);
    }
    inFlight = false;
  }
}

button.addEventListener("click", loadNextDog);

breedSelect.addEventListener("change", () => {
  // Invalidate any in-flight request for the previous breed and load fresh.
  requestToken++;
  inFlight = false;
  loadNextDog();
});

// Keyboard convenience: spacebar / right arrow advances when not focused on
// the button or the breed selector.
document.addEventListener("keydown", (e) => {
  const active = document.activeElement;
  const isInteractive = active === button || active === breedSelect;
  const isShortcut = (e.key === " " || e.key === "ArrowRight") && !isInteractive;
  if (isShortcut) {
    e.preventDefault();
    loadNextDog();
  }
});

// Initial load.
loadNextDog();
