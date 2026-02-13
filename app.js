// --- DOM Elements ---
const quoteText = document.getElementById("quote");
const authorText = document.getElementById("author");
const newQuoteBtn = document.getElementById("new-quote");
const categoryLabel = document.getElementById("category");
const listenBtn = document.getElementById("listen-quote");
const shareBtn = document.getElementById("share-quote");
const listenIcon = document.getElementById("listen-icon");
const voiceSelect = document.getElementById("voice-select");
const copyBtn = document.getElementById("copy-quote");
const authorFilter = document.getElementById("author-filter");

const API_URL = "http://localhost:3000/quotes/random"; // adjust for deployment

let isPlaying = false;
let isPaused = false;
let utterance = null;

// --- Helper: Set Listen Icon ---
function setListenIcon(isPlaying) {
  listenIcon.innerHTML = isPlaying
    ? '<i class="fa-solid fa-volume-xmark"></i>'
    : '<i class="fa-solid fa-volume-high"></i>';
}

// --- Populate Authors Dropdown ---
async function populateAuthors() {
  try {
    const response = await fetch("http://localhost:3000/quotes");
    const allQuotes = await response.json();
    const authors = [...new Set(allQuotes.map(q => q.author || "Unknown"))];

    authors.forEach(author => {
      const option = document.createElement("option");
      option.value = author;
      option.textContent = author;
      authorFilter.appendChild(option);
    });
  } catch (error) {
    console.error("Failed to fetch authors:", error);
  }
}

// --- Fetch Quote (with optional author filter) ---
async function fetchQuote() {
  quoteText.textContent = "Loading...";
  authorText.textContent = "";
  const categoryRibbon = categoryLabel;
  categoryRibbon.textContent = "";

  try {
    const selectedAuthor = authorFilter.value;
    let quote;

    if (selectedAuthor) {
      const responseAll = await fetch("http://localhost:3000/quotes");
      const allQuotes = await responseAll.json();
      const filteredQuotes = allQuotes.filter(q => q.author === selectedAuthor);
      if (filteredQuotes.length === 0) throw new Error("No quotes for this author");
      const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
      quote = filteredQuotes[randomIndex];
      
    } else {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Failed to fetch quote");
      quote = await response.json();
    }

    quoteText.textContent = `"${quote.text}"`;
    authorText.textContent = `- ${quote.author || "Unknown"}`;
    categoryRibbon.textContent = quote.category
      ? quote.category.toUpperCase()
      : "GENERAL";

    listenBtn.disabled = false;
    shareBtn.disabled = false;
    setListenIcon(false);
    isPlaying = false;
    isPaused = false;

    if (utterance) {
      window.speechSynthesis.cancel();
      utterance = null;
    }
  } catch (error) {
    quoteText.textContent = "Could not fetch quote. Please try again.";
    authorText.textContent = "";
    categoryRibbon.textContent = "";
    listenBtn.disabled = true;
    shareBtn.disabled = true;
    setListenIcon(false);
    isPlaying = false;
    isPaused = false;

    if (utterance) {
      window.speechSynthesis.cancel();
      utterance = null;
    }
  }
}

// --- Voice Population ---
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

// --- Speech Functions ---
function playQuoteWithSelectedVoice() {
  const text = `${quoteText.textContent} ${authorText.textContent}`;
  utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = voices[voiceSelect.value] || voices[0];
  utterance.voice = selectedVoice;
  utterance.onend = () => {
    isPlaying = false;
    isPaused = false;
    setListenIcon(false);
  };
  window.speechSynthesis.speak(utterance);
  isPlaying = true;
  isPaused = false;
  setListenIcon(true);
}

function pauseSpeech() {
  window.speechSynthesis.pause();
  isPlaying = false;
  isPaused = true;
  setListenIcon(false);
}

function resumeSpeech() {
  window.speechSynthesis.resume();
  isPlaying = true;
  isPaused = false;
  setListenIcon(true);
}

// --- Event Listeners ---
newQuoteBtn.addEventListener("click", () => {
  window.speechSynthesis.cancel();
  isPlaying = false;
  isPaused = false;
  setListenIcon(false);
  fetchQuote();
});

authorFilter.addEventListener("change", () => {
  window.speechSynthesis.cancel();
  isPlaying = false;
  isPaused = false;
  setListenIcon(false);
  fetchQuote();
});

listenBtn.addEventListener("click", () => {
  if (!isPlaying && !isPaused) {
    playQuoteWithSelectedVoice();
  } else if (isPlaying) {
    pauseSpeech();
  } else if (isPaused) {
    resumeSpeech();
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
  if (document.hidden && isPlaying) pauseSpeech();
});

document.addEventListener("DOMContentLoaded", () => setListenIcon(false));

// --- Share to Twitter ---
shareBtn.addEventListener("click", () => {
  const tweet = `${quoteText.textContent} ${authorText.textContent}`;
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`, "_blank");
});

// --- Copy to Clipboard ---
copyBtn.addEventListener("click", () => {
  const text = `${quoteText.textContent} ${authorText.textContent}`;
  navigator.clipboard.writeText(text);

  let popup = document.createElement("div");
  popup.innerHTML = `
    <i class="fa-solid fa-circle-check mr-2"></i>
    Copied to clipboard!
    <div class="w-36 h-1 bg-gray-500 rounded mt-2 overflow-hidden">
      <div id="copy-progress" class="h-full bg-gray-100" style="width: 0%; transition: width 3s linear;"></div>
    </div>
  `;
  popup.className =
    "fixed top-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 text-lg flex flex-col items-center opacity-100 min-w-[220px]";
  document.body.appendChild(popup);

  const progress = popup.querySelector("#copy-progress");
  void progress.offsetWidth;
  progress.style.width = "100%";

  setTimeout(() => popup.remove(), 3000);
});

// --- Initialize ---
populateAuthors();
fetchQuote();
