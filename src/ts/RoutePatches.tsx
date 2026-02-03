import {Mountable} from "./System";
import {RoutePatch, routerHook} from "@decky/api";

export function routePatch(path: string, patch: RoutePatch): Mountable {
	// Wrap patch so we can log route hits (matches the local dist/index.js DIAG behaviour)
	const wrapped: RoutePatch = (props: any) => {
		try {
			const appid =
				props?.match?.params?.appid ??
				props?.params?.appid ??
				"unknown";
			console.log("[MetaDeck DIAG] routePatch hit", path, "appid=", appid);
		} catch {
			// no-op
		}
		return patch(props);
	};

	return {
		mount() {
			routerHook.addPatch(path, wrapped);
		},
		dismount() {
			routerHook.removePatch(path, wrapped);
		},
	};
}
