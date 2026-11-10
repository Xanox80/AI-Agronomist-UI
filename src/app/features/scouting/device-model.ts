interface ClientHintsNavigator {
  userAgent: string;
  userAgentData?: { getHighEntropyValues(hints: string[]): Promise<{ model?: string }> };
}

const ANDROID_MODEL = /Android [\d.]+; ([^;)]+?)(?: Build\/|[;)])/;

/** Phone model for FR-5: the client hint where supported, else the Android user-agent token; undefined elsewhere. */
export async function resolveDeviceModel(nav: ClientHintsNavigator = navigator): Promise<string | undefined> {
  try {
    const hinted = (await nav.userAgentData?.getHighEntropyValues(['model']))?.model;
    if (hinted) return hinted;
  } catch {
    // hint refused: fall back to the user agent
  }
  return ANDROID_MODEL.exec(nav.userAgent)?.[1].trim() || undefined;
}
