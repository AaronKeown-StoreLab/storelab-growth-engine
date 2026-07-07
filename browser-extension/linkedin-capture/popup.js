const statusEl = document.getElementById("status");
const captureButton = document.getElementById("capture");

function setStatus(message) {
  statusEl.textContent = message;
}

async function currentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

captureButton.addEventListener("click", async () => {
  captureButton.disabled = true;
  setStatus("Reading visible LinkedIn profile...");

  try {
    const tab = await currentTab();

    if (!tab?.id || !tab.url?.includes("linkedin.com/in/")) {
      throw new Error("Open a LinkedIn profile page first.");
    }

    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "STORELAB_CAPTURE_PROFILE",
    });

    if (!response?.ok) {
      throw new Error("Could not read this profile page.");
    }

    setStatus("Sending to StoreLab...");

    const storelabResponse = await fetch("http://localhost:3000/api/research/captures", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(response.payload),
    });
    const data = await storelabResponse.json();

    if (!storelabResponse.ok) {
      throw new Error(data.error || "StoreLab rejected the capture.");
    }

    setStatus("Captured. Open StoreLab and load browser captures.");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Capture failed.");
  } finally {
    captureButton.disabled = false;
  }
});