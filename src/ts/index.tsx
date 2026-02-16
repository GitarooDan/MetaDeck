import "./deckyMobx";
import {
	definePlugin, Plugin, callable
} from "@decky/api";

import {
	name
} from "@decky/manifest"

import {
	version
} from "@decky/pkg"

import {FaDatabase} from "react-icons/fa";
import Logger from "./logger";
import {MetaDeckComponent} from "./MetaDeckComponent";
import {AppDetailsStore, AppStore} from "./SteamTypes";
import {Mounts} from "./System";
import {Fragment, ReactNode} from "react";
import {MetaDeckState, MetaDeckStateContext, MetaDeckStateContextProvider} from "./MetaDeckState";
import {EventBus} from "./events";
import {DialogButton, Navigation, toaster} from "@decky/ui";
import {BsGearFill} from "react-icons/bs";
import {SettingsComponent} from "./modules/SettingsComponent";
import {ProviderSettingsComponent} from "./modules/ProviderSettingsComponent";


console.warn("[MetaDeck DIAG] PLUGIN src/index.tsx loaded v2-assoc " + Date.now());


declare global
{
	let appStore: AppStore;
	let appDetailsStore: AppDetailsStore;

	let appDetailsCache: {
		SetCachedDataForApp(app_id: number, descriptions: string, number: number, descriptionsData: {
			strFullDescription: ReactNode;
			strSnippet: ReactNode
		} | {
			rgDevelopers: {
				strName: string,
				strURL: string
			}[],
			rgPublishers: {
				strName: string,
				strURL: string
			}[]
			rgFranchises: {
				strName: string,
				strURL: string
			}[]
		}): void;
	}

	// let collectionStore: CollectionStore;
	interface PluginLoader
	{
		plugins: Plugin[];
	}

	interface Window
	{
		DeckyPluginLoader: PluginLoader;

		MetaDeck__SECRET: {
			set bypassCounter(count: number)
		};
		MetaDeck: MetaDeckStateContext | undefined
	}
}

// const AppDetailsSections = findModuleChild((m) =>
// {
// 	if (typeof m!=='object') return;
// 	for (const prop in m)
// 	{
// 		if (
// 				m[prop]?.toString &&
// 				m[prop].toString().includes("bShowGameInfo")
// 		) return m[prop];
// 	}
// 	return;
// });

// const AppInfoContainer = findModuleChild((m) =>
// {
// 	if (typeof m!=='object') return;
// 	for (const prop in m)
// 	{
// 		if (
// 				m[prop]?.toString &&
// 				m[prop].toString().includes("m_contentRef")
// 		) return m[prop];
// 	}
// 	return;
// });


// noinspection JSUnusedGlobalSymbols
export default definePlugin(() => {
	const logger = new Logger("Index");
	const backendDiag = callable<[string], void>("log");
	const emitDiag = (message: string, payload?: unknown) => {
		const suffix = payload === undefined ? "" : ` ${JSON.stringify(payload)}`;
		const line = `${message}${suffix}`;
		console.warn("[MetaDeck DIAG]", line);
		void backendDiag(line).catch(() => {});
	};
	const eventBus = new EventBus();
	const mounts = new Mounts(eventBus, logger);
	const state = new MetaDeckState(eventBus, mounts);
	try
	{
		toaster.toast({
			title: "MetaDeck DIAG",
			body: "Frontend boot executed",
			duration: 4000,
		});
	} catch (e) {}

	try
	{
		emitDiag("boot OK");

		// 1) Can we see app types for non-steam shortcuts?
		try
		{
			const ovs = (globalThis as any)?.getAllNonSteamAppOverviews?.() ?? [];
						emitDiag("nonsteam overviews", { count: ovs.length });
			emitDiag("sample app_type", ovs.slice(0, 5).map((o: any) => ({ appid: o.appid, name: o.display_name, app_type: o.app_type })));
		} catch (e)
		{
			emitDiag("getAllNonSteamAppOverviews failed", String(e));
		}

		// 2) Do the hook targets exist?
		try
		{
			emitDiag("appDetailsStore keys", typeof appDetailsStore === "object" ? Object.keys(appDetailsStore).slice(0, 50) : typeof appDetailsStore);
			emitDiag("appDetailsStore.GetDescriptions typeof", typeof (appDetailsStore as any)?.GetDescriptions);
			emitDiag("appDetailsStore.GetAssociations typeof", typeof (appDetailsStore as any)?.GetAssociations);
		} catch (e)
		{
			emitDiag("appDetailsStore inspect failed", String(e));
		}

		try
		{
			const proto = (appStore as any)?.allApps?.[0]?.__proto__;
			emitDiag("appStore proto keys", proto ? Object.getOwnPropertyNames(proto).filter((k: string) => k.startsWith("BIs")).slice(0, 50) : "no-proto");
			emitDiag("BIsModOrShortcut typeof", typeof proto?.BIsModOrShortcut);
		} catch (e)
		{
			emitDiag("appStore proto inspect failed", String(e));
		}
	} catch (e)
	{
		emitDiag("boot diag failed", String(e));
	}

	window.MetaDeck__SECRET = {
		set bypassCounter(count: number)
		{
			state.modules.metadata.bypassBypass = count
		}
	}


	// const checkOnlineStatus = async () => {
	// 	try
	// 	{
	// 		const online = await fetchNoCors("https://example.com");
	// 		return online.ok && online.status >= 200 && online.status < 300; // either true or false
	// 	} catch (err)
	// 	{
	// 		return false; // definitely offline
	// 	}
	// }
	//
	// const waitForOnline = async () => {
	// 	while (!(await checkOnlineStatus()))
	// 	{
	// 		logger.debug("No internet connection, retrying...");
	// 		await sleep(1000);
	// 	}
	// }

	mounts.addPageMount("/metadeck/settings", () =>
		   <MetaDeckStateContextProvider metaDeckState={state}>
			   <SettingsComponent/>
		   </MetaDeckStateContextProvider>
	)

	mounts.addPageMount("/metadeck/:module", () =>
		   <MetaDeckStateContextProvider metaDeckState={state}>
			   <ProviderSettingsComponent/>
		   </MetaDeckStateContextProvider>
	)


	const unregister = mounts.register()

	return {
		name,
		version,
		content:
			   <MetaDeckStateContextProvider metaDeckState={state}>
				   <MetaDeckComponent/>
			   </MetaDeckStateContextProvider>,
		icon: <FaDatabase/>,
		titleView:
			   <Fragment>
				   <div style={{ marginRight: 'auto', flex: 0.9}}>{name}</div>
				   <DialogButton
						 style={{height: '28px', width: '40px', minWidth: 0, padding: '10px 12px'}}
						 onClick={() => {
							 Navigation.Navigate("/metadeck/settings")
						 }}
				   >
					   <BsGearFill style={{marginTop: '-4px', display: 'block'}}/>
				   </DialogButton>
			   </Fragment>,
		onDismount()
		{
			unregister();
		},
	};
});
