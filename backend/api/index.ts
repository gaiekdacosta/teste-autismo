import type { IncomingMessage, ServerResponse } from "node:http";
import { createFastifyApp } from "../src/createFastifyApp";

type InjectMethod =
  | "DELETE"
  | "GET"
  | "HEAD"
  | "PATCH"
  | "POST"
  | "PUT"
  | "OPTIONS";

let appPromise: ReturnType<typeof createFastifyApp> | undefined;

async function getApp() {
  appPromise ??= createFastifyApp();
  const app = await appPromise;
  await app.ready();

  return app;
}

async function readRequestBody(request: IncomingMessage): Promise<Buffer | undefined> {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }

  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return chunks.length > 0 ? Buffer.concat(chunks) : undefined;
}

function getRequestMethod(method?: string): InjectMethod {
  const normalizedMethod = method?.toUpperCase();

  if (
    normalizedMethod === "DELETE" ||
    normalizedMethod === "GET" ||
    normalizedMethod === "HEAD" ||
    normalizedMethod === "PATCH" ||
    normalizedMethod === "POST" ||
    normalizedMethod === "PUT" ||
    normalizedMethod === "OPTIONS"
  ) {
    return normalizedMethod;
  }

  return "GET";
}

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  try {
    const app = await getApp();
    const result = await Promise.resolve(app.inject({
      method: getRequestMethod(request.method),
      url: request.url ?? "/",
      headers: request.headers,
      payload: await readRequestBody(request),
    }));

    response.statusCode = result.statusCode;

    for (const [name, value] of Object.entries(result.headers)) {
      if (value !== undefined) {
        response.setHeader(name, value);
      }
    }

    response.end(result.body);
  } catch (error) {
    console.error("Failed to initialize backend function", error);

    if (!response.headersSent) {
      response.statusCode = 500;
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify({ message: "Erro interno do servidor." }));
    }
  }
}
