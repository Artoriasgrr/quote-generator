const quoteText = document.getElementById("quote");
const authorText = document.getElementById("author");
const newQuoteBtn = document.getElementById("new-quote");
const categoryLabel = document.getElementById("category");
const listenBtn = document.getElementById("listen-quote");
const shareBtn = document.getElementById("share-quote");
const listenIcon = document.getElementById("listen-icon");
const voiceSelect = document.getElementById("voice-select");
const copyBtn = document.getElementById("copy-quote");
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");

const API_URL = "https://api.api-ninjas.com/v1/quotes";
const API_KEY = ""; // 🔑 Add your API key here

let isPlaying = false;
let isPaused = false;
let utterance = null;

// --- 🌙 Theme Toggle Logic ---
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.documentElement.classList.add("dark");
  themeIcon.classList.replace("fa-moon", "fa-sun");
}

themeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  const isDark = document.documentElement.classList.contains("dark");
  themeIcon.classList.toggle("fa-moon", !isDark);
  themeIcon.classList.toggle("fa-sun", isDark);
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// --- 🔊 Quote Fetching Logic ---
function setListenIcon(isPlaying) {
  listenIcon.innerHTML = isPlaying
    ? '<i class="fa-solid fa-volume-xmark"></i>'
    : '<i class="fa-solid fa-volume-high"></i>';
}

async function fetchQuote() {
  quoteText.textContent = "Loading...";
  authorText.textContent = "";
  categoryLabel.textContent = "";
  try {
    const response = await fetch(API_URL, {
      headers: { "X-Api-Key": API_KEY },
    });
    if (!response.ok) throw new Error("Failed to fetch quote");
    const data = await response.json();
    const quote = data[0];
    quoteText.textContent = `"${quote.quote}"`;
    authorText.textContent = `- ${quote.author || "Unknown"}`;
    categoryLabel.textContent = quote.category
      ? quote.category.toUpperCase()
      : "GENERAL";

    listenBtn.disabled = false;
    shareBtn.disabled = false;
    setListenIcon(false);
    isPlaying = false;
    isPaused = false;
    if (utterance) window.speechSynthesis.cancel();
  } catch {
    quoteText.textContent = "Could not fetch quote. Please try again.";
    authorText.textContent = "";
    categoryLabel.textContent = "";
    listenBtn.disabled = true;
    shareBtn.disabled = true;
    setListenIcon(false);
  }
}

newQuoteBtn.addEventListener("click", () => {
  window.speechSynthesis.cancel();
  isPlaying = false;
  isPaused = false;
  setListenIcon(false);
  fetchQuote();
});

fetchQuote();

// --- 🗣️ Speech Functions ---
function populateVoices() {
  const voices = window.speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";
  voices.forEach((voice, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${voice.name} (${voice.lang})${voice.default ? " [default]" : ""}`;
    voiceSelect.appendChild(option);
  });
}

if ("speechSynthesis" in window) {
  populateVoices();
  window.speechSynthesis.onvoiceschanged = populateVoices;
}

function playQuoteWithSelectedVoice() {
  const text = `${quoteText.textContent} ${authorText.textContent}`;
  utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = voices[voiceSelect.value] || voices[0];
  utterance.onend = () => {
    isPlaying = false;
    isPaused = false;
    setListenIcon(false);
  };
  window.speechSynthesis.speak(utterance);
  isPlaying = true;
  setListenIcon(true);
}

listenBtn.addEventListener("click", () => {
  if (!isPlaying && !isPaused) playQuoteWithSelectedVoice();
  else if (isPlaying) {
    window.speechSynthesis.pause();
    isPaused = true;
    isPlaying = false;
    setListenIcon(false);
  } else if (isPaused) {
    window.speechSynthesis.resume();
    isPaused = false;
    isPlaying = true;
    setListenIcon(true);
  }
});

voiceSelect.addEventListener("change", () => {
  if (isPlaying || isPaused) {
    window.speechSynthesis.cancel();
    isPlaying = false;
    isPaused = false;
    setListenIcon(false);
    playQuoteWithSelectedVoice();
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && isPlaying) {
    window.speechSynthesis.pause();
  }
});

// --- 🐦 Share to Twitter ---
shareBtn.addEventListener("click", () => {
  const tweet = `${quoteText.textContent} ${authorText.textContent}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
  window.open(twitterUrl, "_blank");
});

// --- 📋 Copy to Clipboard ---
copyBtn.addEventListener("click", () => {
  const text = `${quoteText.textContent} ${authorText.textContent}`;
  navigator.clipboard.writeText(text);

  let popup = document.createElement("div");
  popup.innerHTML = `
    <i class="fa-solid fa-circle-check mr-2"></i>
    Copied to clipboard!
    <div class="w-36 h-1 bg-gray-500 rounded mt-2 overflow-hidden">
      <div id="copy-progress" class="h-full bg-gray-100" style="width: 0%; transition: width 3s linear;"></div>
    </div>`;
  popup.className =
    "fixed top-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 text-lg flex flex-col items-center opacity-100 min-w-[220px]";
  document.body.appendChild(popup);

  const progress = popup.querySelector("#copy-progress");
  void progress.offsetWidth;
  progress.style.width = "100%";
  setTimeout(() => popup.remove(), 3000);
});