const quoteText = document.getElementById("quote");
const authorText = document.getElementById("author");
const newQuoteBtn = document.getElementById("new-quote");
const categoryLabel = document.getElementById("category");
const listenBtn = document.getElementById("listen-quote");
const shareBtn = document.getElementById("share-quote");
const listenIcon = document.getElementById("listen-icon");
const voiceSelect = document.getElementById("voice-select");
const copyBtn = document.getElementById("copy-quote");

const API_URL = "https://api.api-ninjas.com/v1/quotes";
const API_KEY = ""; // Update with your API KEY

let isPlaying = false;
let isPaused = false;
let utterance = null;

function setListenIcon(isPlaying) {
  listenIcon.innerHTML = isPlaying
    ? '<i class="fa-solid fa-volume-xmark"></i>'
    : '<i class="fa-solid fa-volume-high"></i>';
}

async function fetchQuote() {
  quoteText.textContent = "Loading...";
  authorText.textContent = "";
  const categoryRibbon = document.getElementById("category");
  categoryRibbon.textContent = "";
  try {
    const response = await fetch(API_URL, {
      headers: {
        "X-Api-Key": API_KEY,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch quote");
    const data = await response.json();
    const quote = data[0];
    quoteText.textContent = `"${quote.quote}"`;
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

newQuoteBtn.addEventListener("click", () => {
  window.speechSynthesis.cancel();
  isPlaying = false;
  isPaused = false;
  setListenIcon(false);
  fetchQuote();
});

// Fetch a quote on initial load
fetchQuote();

function populateVoices() {
  const voices = window.speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";
  voices.forEach((voice, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${voice.name} (${voice.lang})${voice.default ? " [default]" : ""
      }`;
    voiceSelect.appendChild(option);
  });
}

if ("speechSynthesis" in window) {
  populateVoices();
  window.speechSynthesis.onvoiceschanged = populateVoices;
}

// --- Unified Speech Functions ---
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

// --- Listen Button ---
listenBtn.addEventListener("click", () => {
  if (!isPlaying && !isPaused) {
    playQuoteWithSelectedVoice();
  } else if (isPlaying) {
    pauseSpeech();
  } else if (isPaused) {
    resumeSpeech();
  }
});

// --- Voice Change: Replay if playing/paused ---
voiceSelect.addEventListener("change", () => {
  if (isPlaying || isPaused) {
    window.speechSynthesis.cancel();
    isPlaying = false;
    isPaused = false;
    setListenIcon(false);
    playQuoteWithSelectedVoice();
  }
});

// --- Pause on Tab Hide ---
document.addEventListener("visibilitychange", () => {
  if (document.hidden && isPlaying) {
    pauseSpeech();
  }
});

document.addEventListener("DOMContentLoaded", () => setListenIcon(false));

// --- Share to Twitter ---
shareBtn.addEventListener("click", () => {
  const quote = quoteText.textContent;
  const author = authorText.textContent;
  const tweet = `${quote} ${author}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    tweet
  )}`;
  window.open(twitterUrl, "_blank");
});

// --- Copy to Clipboard with Timed Popup ---
copyBtn.addEventListener("click", () => {
  const quote = quoteText.textContent;
  const author = authorText.textContent;
  const text = `${quote} ${author}`;
  navigator.clipboard.writeText(text);

  // Create popup
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

  // Animate progress bar immediately
  const progress = popup.querySelector("#copy-progress");
  void progress.offsetWidth; // Force reflow
  progress.style.width = "100%"; // Start animation

  // Remove popup immediately (no fade)
  setTimeout(() => {
    popup.remove();
  }, 3000); // Remove after 3 second or even less if needed
});