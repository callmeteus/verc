import { existsSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import * as path from "path";
import { Commands } from "./Command";

const FILE_HEADER = "# BEGIN VERDACCIO AUTO RC\n";
const FILE_FOOTER = "\n# END VERDACCIO AUTO RC";

export class App {
    /**
     * The user's .npmrc file path.
     */
    public static readonly NPM_RC_PATH = path.resolve(homedir(), ".npmrc");

    /**
     * The user's .verc file path.
     */
    public static readonly CONFIG_FILE_PATH = path.resolve(homedir(), ".verc");

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
            if (existsSync(App.CONFIG_FILE_PATH)) {
                config = JSON.parse(readFileSync(App.CONFIG_FILE_PATH, "utf-8"));
            }

            config[parsed.option as string] = parsed.value;

            writeFileSync(App.CONFIG_FILE_PATH, JSON.stringify(config));

            console.info("Configuration file updated.");
            return;
        } else
        // If it's the update command
        if (cmd === "update") {
            // If there's no config file
            if (!existsSync(App.CONFIG_FILE_PATH)) {
                // Warn the user and exit
                console.warn("verc isn't configured. Run `verc config` to setup.");

                process.exit(1);
            }

            return await new App().init();
        }

        return Commands.showHelp();
    }

    /**
     * The program configuration.
     */
    public config = JSON.parse(readFileSync(App.CONFIG_FILE_PATH, "utf-8"));

    /**
     * Initializes the application.
     */
    public async init() {
        console.info(".npmrc location is %s", App.NPM_RC_PATH);
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
        if (!existsSync(App.NPM_RC_PATH)) {
            writeFileSync(App.NPM_RC_PATH, "");
        }

        // Read the npmrc contents
        let contents = readFileSync(App.NPM_RC_PATH, "utf-8");

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
        writeFileSync(App.NPM_RC_PATH, contents);

        console.info("Package list was updated");
    }
}