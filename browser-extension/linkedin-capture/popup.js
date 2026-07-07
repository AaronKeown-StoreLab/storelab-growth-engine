const statusEl = document.getElementById("status");
const captureButton = document.getElementById("capture");
const openButton = document.getElementById("open-storelab");
const previewEl = document.getElementById("preview");
const previewNameEl = document.getElementById("previewName");
const previewHeadlineEl = document.getElementById("previewHeadline");

function setStatus(message) {
  statusEl.textContent = message;
}

function showPreview(payload) {
  previewNameEl.textContent = payload.title || "LinkedIn profile";
  previewHeadlineEl.textContent = payload.headline || payload.location || "Ready for AI review";
  previewEl.style.display = "block";
}

async function currentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function requestProfileCapture(tabId) {
  try {
    return await chrome.tabs.sendMessage(tabId, {
      type: "STORELAB_CAPTURE_PROFILE",
    });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });

    return chrome.tabs.sendMessage(tabId, {
      type: "STORELAB_CAPTURE_PROFILE",
    });
  }
}

async function postToStoreLab(payload) {
  const response = await fetch("http://localhost:3000/api/research/captures", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "StoreLab rejected the capture.");
  }

  return data;
}

captureButton.addEventListener("click", async () => {
  captureButton.disabled = true;
  setStatus("Reading this LinkedIn profile...");

  try {
    const tab = await currentTab();

    if (!tab?.id || !tab.url?.includes("linkedin.com/in/")) {
      throw new Error("Open a LinkedIn profile page first.");
    }

    const result = await requestProfileCapture(tab.id);
    const payload = result?.payload;

    if (!payload?.content) {
      throw new Error("Could not read this profile page.");
    }

    showPreview(payload);
    setStatus("Sending profile to StoreLab...");

    await postToStoreLab(payload);
    setStatus("Captured. Open StoreLab and load browser captures.");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Capture failed.");
  } finally {
    captureButton.disabled = false;
  }
});

openButton.addEventListener("click", () => {
  void chrome.tabs.create({ url: "http://localhost:3000/" });
});
