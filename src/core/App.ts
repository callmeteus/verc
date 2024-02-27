import * as path from "path";
import { homedir } from "os";
import { Commands } from "./Command";
import { existsSync, readFileSync, writeFileSync } from "fs";

const FILE_HEADER = "# BEGIN VERDACCIO AUTO RC\n";
const FILE_FOOTER = "\n# END VERDACCIO AUTO RC";

export class App {
    /**
     * The user's .npmrc file path.
     */
    public static readonly NPMRCLocation = path.resolve(homedir(), ".npmrc");

    /**
     * The user's .varc file path.
     */
    public static readonly ConfigFileLocation = path.resolve(homedir(), ".varc");

    /**
     * Application main entry point.
     */
    public static async main() {
        const parsed = await Commands.parse();

        const cmd = parsed._[0];

        // If no command was given
        if (!cmd) {
            return Commands.showHelp();
        }

        // If it's the config command
        if (cmd === "config") {
            let config = {};

            // If there's no config file
            if (existsSync(App.ConfigFileLocation)) {
                config = require(App.ConfigFileLocation);
            }

            config[parsed.option] = parsed.value;

            writeFileSync(App.ConfigFileLocation, JSON.stringify(config));

            console.info("Configuration file updated.");
            return;
        } else
        // If it's the update command
        if (cmd === "update") {
            // If there's no config file
            if (!existsSync(App.ConfigFileLocation)) {
                // Warn the user and exit
                console.warn("varc isn't configured. Run `varc config` to setup.");

                process.exit(1);
            }

            return await new App().init();
        }

        return Commands.showHelp();
    }

    /**
     * The program configuration.
     */
    public config = JSON.parse(readFileSync(App.ConfigFileLocation, "utf-8"));

    /**
     * Initializes the application.
     */
    public async init() {
        console.info(".npmrc location is %s", App.NPMRCLocation);
        console.info("Verdaccio URL is %s", this.config.url);

        await this.updatePackageList();
    }

    /**
     * Updates the .npmrc package list.
     */
    private async updatePackageList() {
        const response = await fetch(`${this.config.url}/-/verdaccio/data/packages`).then((r) => r.json());

        const finalRules = new Set<string>();

        // Iterate over all received packages
        for (const pkg of response) {
            // If it starts with a scope
            if (pkg.name.startsWith("@")) {
                const scopeName = pkg.name.split("/")[0];
                const rule = `${scopeName}:registry=${this.config.url}`;

                if (!finalRules.has(rule)) {
                    console.info("Found scope %s", scopeName);

                    finalRules.add(rule);
                }
            }
        }    

        // Create the .npmrc file if it doesn't exists yet
        if (!existsSync(App.NPMRCLocation)) {
            writeFileSync(App.NPMRCLocation, "");
        }

        // Read the npmrc contents
        let contents = readFileSync(App.NPMRCLocation, "utf-8");

        // Generate the new rules contents
        const newRulesContents = [...finalRules].join("\n");

        let start = contents.indexOf(FILE_HEADER);
        let end = contents.indexOf(FILE_FOOTER);

        // If there's a start and end
        if (start !== -1 && end !== -1) {
            // Replace it
            contents = [
                contents.substring(0, start + FILE_HEADER.length),
                newRulesContents,
                contents.substring(end)
            ].join("");

            console.info(".npmrc contents was replaced");
        } else {
            // Append it
            contents += FILE_HEADER + newRulesContents + FILE_FOOTER + "\n";

            console.info(".npmrc contents was set");
        }

        // Write the file
        writeFileSync(App.NPMRCLocation, contents);

        console.info("Package list was updated");
    }
}