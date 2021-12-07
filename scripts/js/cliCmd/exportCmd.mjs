import {genFileNameFromNetworkName, loadNetworkAndApiKey, setLastConnectedOnUser} from "../utils/smallUtilFuncs.mjs";
import {TwingateApiClient} from "../TwingateApiClient.mjs";
import XLSX from "https://cdn.esm.sh/v58/xlsx@0.17.4/deno/xlsx.js";
import * as Colors from "https://deno.land/std/fmt/colors.ts";
import {Command} from "https://deno.land/x/cliffy/command/mod.ts";

export const exportCmd = new Command()
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


        setLastConnectedOnUser(allNodes);
        let wb = XLSX.utils.book_new();
        for (const [typeName, records] of Object.entries(allNodes)) {
            //if ( typeName !== "RemoteNetwork") continue;
            let ws = XLSX.utils.json_to_sheet(records);
            ws['!autofilter'] = {ref: ws["!ref"]};
            XLSX.utils.book_append_sheet(wb, ws, typeName);
        }
        let outputFileName = genFileNameFromNetworkName(networkName);
        await Deno.writeFile(`./${outputFileName}`, new Uint8Array(XLSX.write(wb, {type: "array"})));
        console.log(Colors.green(`Account exported to '${outputFileName}'`));
    });