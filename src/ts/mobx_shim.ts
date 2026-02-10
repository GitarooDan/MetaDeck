// src/ts/mobx_shim.ts
// Pure re-export shim to avoid ESM TDZ/circular-init issues.
// MobX is bundled, and we configure isolation after import.

export * from "mobx";
export { default } from "mobx";

import * as mobxNS from "mobx";

// Configure isolation if available (MobX 6+)
try {
  const anyMobx: any = mobxNS as any;
  if (typeof anyMobx.configure === "function") {
    anyMobx.configure({ isolateGlobalState: true, enforceActions: "never" });
  }
} catch (_) {}
