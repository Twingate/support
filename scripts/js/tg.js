import * as Colors from "https://deno.land/std/fmt/colors.ts";
import {encryptData, decryptData} from "./crypto.mjs";
import {exists as fileExists} from "https://deno.land/std/fs/mod.ts"
import {
    prompt,
    Input as InputPrompt,
    Secret as SecretPrompt,
    Toggle as TogglePrompt
} from "https://deno.land/x/cliffy/prompt/mod.ts";
import {Command} from "https://deno.land/x/cliffy/command/mod.ts";


import {TwingateApiClient} from "./TwingateApiClient.mjs";
import XLSX from 'https://esm.sh/xlsx';


const genFileName = (networkName, extension = "xlsx") => {
    const
        d = new Date(),
        date = d.toISOString().split('T')[0],
        time = (d.toTimeString().split(' ')[0]).replaceAll(":", "-");
    return `${networkName}-${date}_${time}.${extension}`;
}


async function loadNetworkAndApiKey(networkName = null) {
    const keyFile = ".tgkeys";
    let apiKey = null, saveConfig = false;
    const keyFilePath = `./${keyFile}`,
        networkNamePrompt = {
            name: "networkName", message: `Enter Twingate network name:`,
            hint: `For example, '${Colors.red("acme")}' for '${Colors.red("acme")}.twingate.com'`, type: InputPrompt,
            validate: async (networkName) => ((await TwingateApiClient.testNetworkValid(networkName)) ? true : `Network not found: '${networkName}'.`)
        },
        apiKeyPrompt = {name: "apiKey", message: `Enter API key:`, type: SecretPrompt},
        saveConfigConfirmation = {
            name: "saveConfig",
            message: `Save network and API key to file?`,
            hint: `Will be saved to '${Colors.yellow(keyFile)}'.`,
            type: TogglePrompt
        }
    ;

    try {
        if (false === await fileExists(keyFilePath)) throw new Error("Keyfile does not exist");
        let confFileData = await decryptData(await Deno.readFile(keyFilePath));
        let keyConf = JSON.parse(confFileData);
        networkName = networkName || keyConf["networkName"];
        if (networkName == null) throw new Error("Network missing");
        let apiKey = keyConf.apiKeys[networkName];
        if (apiKey == null) throw new Error("API key missing in config.");
        return {networkName, apiKey};
    } catch (e) {
        if ( networkName != null ) networkNamePrompt.default = networkName;
        ({networkName} = await prompt([networkNamePrompt]));
        ({apiKey} = await prompt([{ ...apiKeyPrompt,
            validate: async (apiKey) => ((await TwingateApiClient.testApiKeyValid(networkName, apiKey)) ? true : `API key not valid.`)
        }]));
        ({saveConfig} = await prompt([saveConfigConfirmation]));

        if (saveConfig === true) {
            let keyConf = {
                networkName,
                apiKeys: {
                    [networkName]: apiKey
                },
                _version: TwingateApiClient.VERSION
            }
            await Deno.writeFile(keyFilePath, await encryptData(JSON.stringify(keyConf)));
            console.info("Configuration file saved.");
        }
        return {networkName, apiKey};
    }
}


async function main(args) {

    const exportCmd = new Command()
        .arguments("")
        .description("Export a twingate account to Excel XLSX format")
        .action(async (options) => {
            let networkName = null;
            let apiKey = null;
            ({networkName, apiKey} = await loadNetworkAndApiKey());
            let client = new TwingateApiClient(networkName, apiKey);

            const configForExport = {
                defaultConnectionFields: "LABEL_FIELD",
                fieldOpts: {
                    defaultObjectFieldSet: [TwingateApiClient.FieldSet.LABEL]
                },
                joinConnectionFields: ", ",
                recordTransformOpts: {
                    mapDateFields: true,
                    mapNodeToLabel: true,
                    mapEnumToDisplay: true,
                    flattenObjectFields: true
                }
            }
            const allNodes = await client.fetchAll(configForExport);

            function setLastConnectedOnUser(nodeObj) {
                const MIN_DATE = new Date(-8640000000000000);
                const lastConnectedMap = new Map();
                nodeObj.Device
                    .filter(d => d.lastConnectedAt != null)
                    .forEach(d => d.lastConnectedAt = new Date(d.lastConnectedAt))
                ;
                let devices = nodeObj.Device.sort((a, b) => {
                    a = a.lastConnectedAt || MIN_DATE;
                    b = b.lastConnectedAt || MIN_DATE;
                    return b.getTime() - a.getTime();
                });
                devices.forEach((d) => {
                    if (!lastConnectedMap.has(d.userLabel)) lastConnectedMap.set(d.userLabel, d.lastConnectedAt)
                });

                for (const user of allNodes.User) user.lastConnectedAt = lastConnectedMap.get(user.email);
            }

            setLastConnectedOnUser(allNodes);
            let wb = XLSX.utils.book_new();
            for (const [typeName, records] of Object.entries(allNodes)) {
                //if ( typeName !== "RemoteNetwork") continue;
                let ws = XLSX.utils.json_to_sheet(records);
                ws['!autofilter'] = {ref: ws["!ref"]};
                XLSX.utils.book_append_sheet(wb, ws, typeName);
            }
            let outputFileName = genFileName(networkName);
            await Deno.writeFile(`./${outputFileName}`, new Uint8Array(XLSX.write(wb, {type: "array"})));
            console.log(Colors.green(`Account exported to '${outputFileName}'`));

        });

    await new Command()
        .name("tg")
        .version(TwingateApiClient.VERSION)
        .description("CLI interface for Twingate networks")
        .command("export", exportCmd)
        .parse(Deno.args);
    return;

}

try {
    await main(Deno.args);
} catch (e) {
    console.error(`Exception: ${e}`);
}