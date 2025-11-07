const browserAppData = chrome;

const inspectFile = "inspect.js";
const activeIcon = "icons/active-64.png";
const defaultIcon = "icons/default-64.png";

function isSupportedProtocolAndFileType(urlString) {
  if (!urlString) {
    return false;
  }
  const supportedProtocols = ["https:", "http:", "file:"];
  const notSupportedFiles = ["xml", "pdf", "rss"];

  try {
    const url = new URL(urlString);
    const extension = url.pathname.split(".").pop().toLowerCase();

    return (
      supportedProtocols.includes(url.protocol) &&
      !notSupportedFiles.includes(extension)
    );
  } catch (e) {
    return false;
  }
}

async function toggleInspect(tabId, actionType, iconPath) {
  try {
    if (actionType === "activate") {
      await browserAppData.scripting.executeScript({
        target: { tabId: tabId },
        files: [inspectFile],
      });
    }

    await browserAppData.tabs.sendMessage(tabId, { action: actionType });

    await browserAppData.action.setIcon({ tabId: tabId, path: iconPath });

    const badgeText = actionType === "activate" ? "ON" : "";
    await browserAppData.action.setBadgeText({ tabId: tabId, text: badgeText });
  } catch (e) {
    console.error("XPath Error toggling script:", e.message);
  }
}

async function toggle(tab) {
  if (!tab.id || !isSupportedProtocolAndFileType(tab.url)) {
    return;
  }

  const currentBadge = await browserAppData.action.getBadgeText({
    tabId: tab.id,
  });

  if (currentBadge === "ON") {
    toggleInspect(tab.id, "deactivate", defaultIcon);
  } else {
    toggleInspect(tab.id, "activate", activeIcon);
  }
}

async function onTabUpdated(tabId, changeInfo, tab) {
  if (
    changeInfo.status === "loading" &&
    tab.url &&
    isSupportedProtocolAndFileType(tab.url)
  ) {
    try {
      await browserAppData.action.setBadgeText({ tabId: tabId, text: "" });
      await browserAppData.action.setIcon({ tabId: tabId, path: defaultIcon });
    } catch (e) {}
  }
}

browserAppData.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-xpath") {
    const [tab] = await browserAppData.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab) {
      toggle(tab);
    }
  }
});

browserAppData.tabs.onUpdated.addListener(onTabUpdated);

browserAppData.action.onClicked.addListener(toggle);
