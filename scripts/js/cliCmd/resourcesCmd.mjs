import {loadNetworkAndApiKey, sortByTextField} from "../utils/smallUtilFuncs.mjs";
import {TwingateApiClient} from "../TwingateApiClient.mjs";
import XLSX from "https://cdn.esm.sh/v58/xlsx@0.17.4/deno/xlsx.js";
import {Table} from "https://deno.land/x/cliffy/table/mod.ts";

import {Command} from "https://deno.land/x/cliffy/command/mod.ts";

const listCmdConfig = {
    "resources": {
        typeName: "Resource",
        fetchFn: "fetchAllResources",
        listFieldOpts: {
            groups: {
                ignore: true
            }
        }
    },
    "groups": {
        typeName: "Group",
        fetchFn: "fetchAllGroups",
        listFieldOpts: {
            users: {ignore: true},
            resources: {ignore: true}
        }
    },
    "users": {
        typeName: "User",
        fetchFn: "fetchAllUsers",
        listFieldOpts: {
        }
    },
    "networks": {
        typeName: "RemoteNetwork",
        fetchFn: "fetchAllRemoteNetworks",
        listFieldOpts: {
            resources: {ignore: true}
        }
    },
    "connectors": {
        typeName: "Connector",
        fetchFn: "fetchAllConnectors",
        listFieldOpts: {
        }
    }
}

function getListCommand(name) {
    let config = listCmdConfig[name];
    return new Command()
        .arguments("")
        .description("")
        .action(async (options) => {
            let networkName = null;
            let apiKey = null;
            ({networkName, apiKey} = await loadNetworkAndApiKey());
            let client = new TwingateApiClient(networkName, apiKey);

            const configForCli = {
                defaultConnectionFields: "LABEL_FIELD",
                fieldOpts: {
                    defaultObjectFieldSet: [TwingateApiClient.FieldSet.LABEL],
                    ...config.listFieldOpts
                },
                joinConnectionFields: ", ",
                recordTransformOpts: {
                    mapDateFields: true,
                    mapNodeToLabel: true,
                    mapEnumToDisplay: true,
                    flattenObjectFields: true
                }
            }
            let schema = TwingateApiClient.Schema[config.typeName];
            let records = await client[config.fetchFn](configForCli);
            if ( schema.labelField != null ) records = sortByTextField(records, schema.labelField);
            let ws = XLSX.utils.json_to_sheet(records);
            let [header, ...recordsArr] = XLSX.utils.sheet_to_json(ws, {raw: false, header: 1});

            let table = new Table()
                .header(header)
                .body(recordsArr)
                .border(true)
                .render()
            ;
        });
}

export const resourcesCmd = new Command()
    .arguments("")
    .description("")
    .command("list", getListCommand("resources"))
;


export const groupsCmd = new Command()
    .arguments("")
    .description("")
    .command("list", getListCommand("groups"))
;


export const usersCmd = new Command()
    .arguments("")
    .description("")
    .command("list", getListCommand("users"))
;

export const remoteNetworksCmd = new Command()
    .arguments("")
    .description("")
    .command("list", getListCommand("networks"))
;

export const connectorsCmd = new Command()
    .arguments("")
    .description("")
    .command("list", getListCommand("connectors"))
;
