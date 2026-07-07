if (!window.__STORELAB_LINKEDIN_CAPTURE_READY__) {
  window.__STORELAB_LINKEDIN_CAPTURE_READY__ = true;
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

  function captureProfile() {
  const name =
    textFrom("h1") ||
    cleanText(document.title.replace(/\| LinkedIn.*/i, "")) ||
    "LinkedIn profile";
  const headline = textFrom(".text-body-medium") || textFrom("div[data-generated-suggestion-target]");
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

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "STORELAB_CAPTURE_PROFILE") return false;

  sendResponse({ ok: true, payload: captureProfile() });
  return true;
});
}
