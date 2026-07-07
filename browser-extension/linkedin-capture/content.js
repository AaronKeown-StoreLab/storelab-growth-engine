if (!window.__STORELAB_LINKEDIN_CAPTURE_READY__) {
  window.__STORELAB_LINKEDIN_CAPTURE_READY__ = true;

  function cleanText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function readableText(value) {
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .split(/\r?\n/g)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join("\n");
  }

  function textFrom(selector) {
    const element = document.querySelector(selector);
    return cleanText(element?.innerText || element?.textContent || "");
  }

  function linesFrom(selector) {
    return Array.from(document.querySelectorAll(selector))
      .map((element) => cleanText(element.innerText || element.textContent || ""))
      .filter((value) => value.length > 2);
  }

  function uniqueLines(values) {
    return Array.from(new Set(values)).filter(Boolean);
  }

  function visibleProfileText() {
    const main = document.querySelector("main") || document.body;
    const sections = Array.from(main.querySelectorAll("section, header"))
      .map((element) => readableText(element.innerText || element.textContent || ""))
      .filter((value) => value.length > 12);

    return uniqueLines(sections).join("\n").slice(0, 22000);
  }

  function sectionTextByHeading(heading) {
    const main = document.querySelector("main") || document.body;
    const lowerHeading = heading.toLowerCase();

    return Array.from(main.querySelectorAll("section"))
      .map((element) => readableText(element.innerText || element.textContent || ""))
      .find((value) => {
        const firstLine = value.split("\n")[0]?.toLowerCase() || "";
        return firstLine === lowerHeading || value.toLowerCase().startsWith(`${lowerHeading}\n`);
      }) || "";
  }

  function captureProfile() {
    const name =
      textFrom("h1") ||
      cleanText(document.title.replace(/\| LinkedIn.*/i, "")) ||
      "LinkedIn profile";
    const headline =
      textFrom(".text-body-medium") ||
      textFrom("div[data-generated-suggestion-target]");
    const location = textFrom(".text-body-small.inline.t-black--light.break-words");
    const companyHints = uniqueLines([
      ...linesFrom('a[href*="/company/"]'),
      ...linesFrom('button[aria-label*="Current company"]'),
    ]).slice(0, 6);
    const educationHints = uniqueLines(linesFrom('a[href*="/school/"]')).slice(0, 4);
    const experience = sectionTextByHeading("Experience");
    const content = [
      `Person LinkedIn URL: ${window.location.href}`,
      `Profile name: ${name}`,
      headline ? `Headline: ${headline}` : "",
      location ? `Location: ${location}` : "",
      companyHints.length ? `Company clues: ${companyHints.join(" | ")}` : "",
      educationHints.length ? `Education clues: ${educationHints.join(" | ")}` : "",
      experience ? `Experience section:\n${experience}` : "",
      "Visible LinkedIn page text:",
      visibleProfileText(),
    ]
      .filter(Boolean)
      .join("\n");

    return {
      url: window.location.href,
      title: name,
      headline,
      location,
      companyHints,
      experience,
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

