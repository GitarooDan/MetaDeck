import * as mobx from "mobx";

let mobxIsolationInitialized = false;

export function initMobxIsolation(): void
{
	if (!mobxIsolationInitialized)
	{
		mobx.configure({isolateGlobalState: true});
		mobxIsolationInitialized = true;
	}
}

initMobxIsolation();

export * from "mobx";