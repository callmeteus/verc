import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

export const Commands = yargs(
    hideBin(process.argv)
)
    .command("update", "Updates the current package list")

    .command("config set [option] [value]", "Sets a the varc configuration", (cmd) => 
        cmd
            .positional("option", {
                describe: "The option name",
                requiresArg: true
            })
            .positional("value", {
                describe: "The option value",
                requiresArg: true
            })
    );