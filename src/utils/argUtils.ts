import { parseArgs } from 'node:util';
import type { ParseArgsOptionsConfig } from 'node:util';

const options: ParseArgsOptionsConfig = {
  name: {
    type: "string",
    short: "n",
    default: "codeGen",
  },
  help: {
    type: "boolean",
    short: "h",
    default: false,
  },
};

type CommandLineInfo = {
  specPath?: string,
  name: string,
  help: boolean,
}

export function getCommandLineInfo(): CommandLineInfo {
  const args = process.argv.slice(2);
  const { values, positionals } = parseArgs({ options, args, allowPositionals: true });
  return {
    specPath: positionals.length === 0 ? undefined : positionals[0],
    name: String(values.name),
    help: Boolean(values.help),
  };
}

