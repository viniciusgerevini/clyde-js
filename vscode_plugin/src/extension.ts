import * as path from "path";
import { workspace, type ExtensionContext } from "vscode";

import {
  LanguageClient,
  type LanguageClientOptions,
  type ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient | undefined;

export async function activate(context: ExtensionContext) {
  let serverModule = context.asAbsolutePath(path.join("server_dist", "index.js"));

  let serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
  };

  let clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "clyde" }],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher("**/clyde.config.json"),
    },
  };

  client = new LanguageClient("clydels", "Clyde Language Server", serverOptions, clientOptions);

  await client.start();
}

export async function deactivate() {
  await client?.dispose();
  client = undefined;
}
