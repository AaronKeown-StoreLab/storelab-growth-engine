# StoreLab LinkedIn Capture Extension

This is the first local bridge for the reliable LinkedIn workflow.

Why it exists: a LinkedIn URL alone usually does not expose the logged-in profile data to StoreLab's server. This extension reads the visible profile page in your browser and sends that evidence to `http://localhost:3000/api/research/captures`.

## Install locally

1. Open Chrome and go to `chrome://extensions`.
2. Enable Developer mode.
3. Choose Load unpacked.
4. Select this folder: `browser-extension/linkedin-capture`.
5. Open a LinkedIn profile page.
6. Click the StoreLab extension and choose Capture profile.
7. In StoreLab OS, click Load Browser Captures in the Research Session.

The app will show an editable AI recommendation before anything is added.