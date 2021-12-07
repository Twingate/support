import * as Colors from "https://deno.land/std/fmt/colors.ts";
import {Command} from "https://deno.land/x/cliffy/command/mod.ts";
import {TwingateApiClient} from "./TwingateApiClient.mjs";
import {connectorsCmd, exportCmd, groupsCmd, remoteNetworksCmd, resourcesCmd, usersCmd} from "./cliCmd/cmd.mjs";
async function main(args) {



    await new Command()
        .name("tg")
        .version(TwingateApiClient.VERSION)
        .description("CLI interface for Twingate networks")
        .command("export", exportCmd)
        .command("resources", resourcesCmd)
        .command("groups", groupsCmd)
        .command("users", usersCmd)
        .command("networks", remoteNetworksCmd)
        .command("connectors", connectorsCmd)
        .parse(Deno.args);

}

try {
    await main(Deno.args);
} catch (e) {
    console.error(`Exception: ${e.stack||e}`);
}