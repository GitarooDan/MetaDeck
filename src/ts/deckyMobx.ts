import * as localMobx from "mobx";

declare global {
	interface Window {
		mobx?: any;
		DFL?: {
			mobx?: any;
			MobX?: any;
		};
		__MetaDeckMobxConfigured?: boolean;
		__MetaDeckMobxSource?: "global" | "local";
	}
}

function getMobx(): any {
	const globalMobx = (window as any).mobx ?? (window as any).DFL?.mobx ?? (window as any).DFL?.MobX;
	if (globalMobx) {
		return globalMobx;
	}
	return localMobx;
}

type RunInAction = <T>(fn: () => T) => T;

const mobx = getMobx();

if (!(window as any).__MetaDeckMobxConfigured) {
	if (typeof mobx.configure === "function") {
		mobx.configure({isolateGlobalState: true, enforceActions: "never"});
	}
	(window as any).__MetaDeckMobxConfigured = true;
	(window as any).__MetaDeckMobxSource = ((window as any).mobx ?? (window as any).DFL?.mobx ?? (window as any).DFL?.MobX)
		? "global"
		: "local";
}

export const runInAction: RunInAction = mobx.runInAction;