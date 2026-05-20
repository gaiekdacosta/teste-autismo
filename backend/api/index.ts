import type { IncomingMessage, ServerResponse } from "node:http";
import { buildApp } from "../src/app";

let appPromise: ReturnType<typeof buildApp> | undefined;

async function getApp() {
  appPromise ??= buildApp();
  const app = await appPromise;
  await app.ready();

  return app;
}

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  try {
    const app = await getApp();
    app.server.emit("request", request, response);
  } catch (error) {
    console.error("Failed to initialize backend function", error);

    if (!response.headersSent) {
      response.statusCode = 500;
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify({ message: "Erro interno do servidor." }));
    }
  }
}
