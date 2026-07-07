const statusEl = document.getElementById("status");
const captureButton = document.getElementById("capture");

function setStatus(message) {
  statusEl.textContent = message;
}

async function currentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function captureVisibleProfile() {
  function cleanText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function textFrom(selector) {
    const element = document.querySelector(selector);
    return cleanText(element?.innerText || element?.textContent || "");
  }

  function visibleProfileText() {
    const main = document.querySelector("main") || document.body;
    const sections = Array.from(main.querySelectorAll("section, header, div"))
      .map((element) => cleanText(element.innerText || element.textContent || ""))
      .filter((value) => value.length > 12);
    const unique = Array.from(new Set(sections));

    return unique.join("\n").slice(0, 20000);
  }

  const name =
    textFrom("h1") ||
    cleanText(document.title.replace(/\| LinkedIn.*/i, "")) ||
    "LinkedIn profile";
  const headline =
    textFrom(".text-body-medium") ||
    textFrom("div[data-generated-suggestion-target]");
  const location = textFrom(".text-body-small.inline.t-black--light.break-words");
  const content = [
    `Profile name: ${name}`,
    headline ? `Headline: ${headline}` : "",
    location ? `Location: ${location}` : "",
    "Visible LinkedIn page text:",
    visibleProfileText(),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    url: window.location.href,
    title: name,
    content,
    capturedAt: new Date().toISOString(),
  };
}

captureButton.addEventListener("click", async () => {
  captureButton.disabled = true;
  setStatus("Reading visible LinkedIn profile...");

  try {
    const tab = await currentTab();

    if (!tab?.id || !tab.url?.includes("linkedin.com/in/")) {
      throw new Error("Open a LinkedIn profile page first.");
    }

    const [{ result: payload }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: captureVisibleProfile,
    });

    if (!payload?.content) {
      throw new Error("Could not read this profile page.");
    }

    setStatus("Sending to StoreLab...");

    const storelabResponse = await fetch("http://localhost:3000/api/research/captures", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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