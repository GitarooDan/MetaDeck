import {FC, Fragment, useEffect, useState} from "react";
import {APIServer} from "./IGDBMetadataProvider";
import {DialogButton, Dropdown, DropdownOption, Field, Focusable, TextField} from "@decky/ui";
import {FaPlus, FaTrash} from "react-icons/fa";
import {fetchNoCors} from "@decky/api";
import Logger from "../../../../logger";

const logger = new Logger("IGDBApiServerComponent");
const OFFICIAL_API_SERVER_TIMEOUT_MS = 5000;

async function getOfficialApiServers(): Promise<APIServer[]>
{
	const timeoutPromise = new Promise<never>((_, reject) => {
		setTimeout(() => reject(new Error("Timed out fetching official API servers")), OFFICIAL_API_SERVER_TIMEOUT_MS);
	});
	const response = await Promise.race([
		fetchNoCors("https://raw.githubusercontent.com/EmuDeck/MetaDeck/refs/heads/main/api_servers.json"),
		timeoutPromise
	]);
	const servers = await (response as Response).json() as Record<string, string>;
	return Object.entries(servers).map(([name, url]) => ({name, url}));
}

export const IGDBApiServerComponent: FC<{
	server: APIServer | undefined,
	customServers: APIServer[],
	onServerChange: (server: APIServer | undefined) => void,
	onCustomServersChange: (servers: APIServer[]) => void,
}> = ({server, customServers, onServerChange, onCustomServersChange}) => {
	const [serverOptions, setServerOptions] = useState<DropdownOption[]>([])

	const [name, setName] = useState<string>("")
	const [url, setUrl] = useState<string>("")

	useEffect(() => {
		(async () => {
			let officialServers: APIServer[] = [];
			try
			{
				officialServers = await getOfficialApiServers();
			} catch (e)
			{
				logger.warn("Failed to load official API server list, using custom/current servers only", e)
			}

			const currentServer = server ? [server] : [];
			setServerOptions(officialServers
				.concat(customServers)
				.concat(currentServer)
				.filter((serverValue, idx, arr) => arr.findIndex((candidate) => candidate.url === serverValue.url) === idx)
				.map((serverValue) => ({
					label: `${serverValue.name} (${serverValue.url})`,
					data: serverValue
				} as DropdownOption)))
		})()
	}, [customServers, server]);

	return <Fragment>
		<Field
			   label={"API Server"}
			   description={"Sets the API server that requests are sent through"}
			   childrenLayout={"below"}
			   bottomSeparator={"thick"}
		>
			<Dropdown
				   rgOptions={serverOptions}
				   selectedOption={server}
				   onChange={(value) => {
					   onServerChange(value.data)
				   }}
				   renderButtonValue={() => (server?.name ?? "")}
			/>
		</Field>
		<Field
			   label={"Custom API Servers"}
			   description={"Add custom API servers not on the official list, or that are run locally"}
			   childrenLayout={"below"}
			   bottomSeparator={"thick"}
		>
			<Focusable
				   style={{
					   display: "flex",
					   marginLeft: "auto",
					   height: "66px"
				   }}
			>
				<div style={{height: '66px', minWidth: '60px', marginRight: '10px', flexGrow: "2"}}>
					<TextField
						   label={"Name"}
						   value={name}
						   onChange={(e) => (setName(e.target.value))}
					/>
				</div>
				<div style={{height: '66px', minWidth: '60px', marginRight: '10px', flexGrow: "2"}}>
					<TextField
						   label={"Url"}
						   value={url}
						   onChange={(e) => (setUrl(e.target.value))}
					/>
				</div>
				<DialogButton
					   style={{
						   height: '40px',
						   width: '40px',
						   marginTop: '24px',
						   padding: '10px 12px',
						   minWidth: '40px',
						   display: 'flex',
						   flexDirection: 'column',
						   justifyContent: 'center',
					   }}
					   onClick={() => {
						   onCustomServersChange(customServers.concat([{name, url}]))
					   }}
				>
					<FaPlus/>
				</DialogButton>
			</Focusable>
		</Field>
		{
			customServers.map((customServer) =>
				   <Field
						 label={customServer.name}
						 childrenLayout={"inline"}
						 bottomSeparator={"standard"}
				   >
					   <Focusable
							 style={{
								 display: "flex",
								 marginLeft: "auto",
								 height: "40px",
								 alignItems: "center"
							 }}
					   >
						   <div style={{
							   height: '40px',
							   minWidth: '60px',
							   marginRight: '10px',
							   flexGrow: "2"
						   }}>
							   {customServer.url}
						   </div>
						   <DialogButton
								 style={{
									 height: '40px',
									 width: '40px',
									 padding: '10px 12px',
									 minWidth: '40px',
									 display: 'flex',
									 flexDirection: 'column',
									 justifyContent: 'center',
								 }}
								 onClick={() => {
									 if (server === customServer) onServerChange(undefined)
									 onCustomServersChange(customServers.filter((value) => value !== customServer))
								 }}
						   >
							   <FaTrash/>
						   </DialogButton>
					   </Focusable>
				   </Field>
			)
		}
	</Fragment>
}