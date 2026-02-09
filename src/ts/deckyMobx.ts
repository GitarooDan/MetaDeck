declare global {
	interface Window {
		mobx?: any;
		__MetaDeckMobxConfigured?: boolean;
	}
}

function getMobx(): any {
	const m = (window as any).mobx;
	if (!m) {
		throw new Error("[MetaDeck] window.mobx is not available. Decky did not provide MobX globally.");
	}
	return m;
}

type RunInAction = <T>(fn: () => T) => T;

const mobx = getMobx();

if (!(window as any).__MetaDeckMobxConfigured) {
	if (typeof mobx.configure === "function") {
		mobx.configure({isolateGlobalState: true, enforceActions: "never"});
	}
	(window as any).__MetaDeckMobxConfigured = true;
}

export const runInAction: RunInAction = mobx.runInAction;