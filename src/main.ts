// Necessary to prevent JSONStream from listening to process.stdin and crashing on keyboard input.
// See https://github.com/apocas/dockerode/issues/426 for details.
process.title = "browser";

import "source-map-support/register";
import "./commands/create-cluster";
import "./commands/create-deployment";
import "./commands/destroy-cluster";
import "./commands/destroy-deployment";
import "./commands/status";

import * as console from "./service/console";
import * as program from "commander";

// TODO: Make sure this stays in sync with package.json.
const VERSION = "0.0.4";

program.version(VERSION);

program.command("*").action(cmd => {
  console.logError(`Unknown command: ${cmd}.`);
  process.exit(1);
});

program.parse(process.argv);
