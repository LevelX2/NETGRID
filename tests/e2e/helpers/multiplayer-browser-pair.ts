import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";

import { VIEWPORTS } from "./viewports";

export type MultiplayerBrowserPair = {
  host: Page;
  joiner: Page;
  hostContext: BrowserContext;
  joinerContext: BrowserContext;
  hostChannel: string;
  joinerChannel: string;
  close(): Promise<void>;
};

export async function launchMultiplayerBrowserPair(): Promise<MultiplayerBrowserPair> {
  const hostChannel = process.env.NETGRID_E2E_HOST_BROWSER_CHANNEL;
  const joinerChannel = process.env.NETGRID_E2E_JOINER_BROWSER_CHANNEL;
  if (Boolean(hostChannel) !== Boolean(joinerChannel)) {
    throw new Error(
      "NETGRID_E2E_HOST_BROWSER_CHANNEL and NETGRID_E2E_JOINER_BROWSER_CHANNEL must be set together",
    );
  }

  const hostBrowser = await launchBrowser(hostChannel);
  let joinerBrowser: Browser | undefined;
  try {
    joinerBrowser = await launchBrowser(joinerChannel);
    const hostContext = await hostBrowser.newContext({
      viewport: VIEWPORTS.desktop,
    });
    const joinerContext = await joinerBrowser.newContext({
      viewport: VIEWPORTS.desktop,
    });
    const host = await hostContext.newPage();
    const joiner = await joinerContext.newPage();
    return {
      host,
      joiner,
      hostContext,
      joinerContext,
      hostChannel: hostChannel ?? "bundled-chromium",
      joinerChannel: joinerChannel ?? "bundled-chromium",
      async close() {
        await Promise.allSettled([hostContext.close(), joinerContext.close()]);
        await Promise.allSettled([hostBrowser.close(), joinerBrowser?.close()]);
      },
    };
  } catch (error) {
    await Promise.allSettled([hostBrowser.close(), joinerBrowser?.close()]);
    throw error;
  }
}

async function launchBrowser(channel: string | undefined): Promise<Browser> {
  return chromium.launch({
    ...(channel ? { channel } : {}),
    headless: process.env.NETGRID_E2E_HEADED !== "1",
  });
}
