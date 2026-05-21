import { config } from "dotenv";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { AppError } from "./errors/AppError";

config();

const defaultFrontendUrls = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];

function normalizeOrigin(origin: string): string | undefined {
  try {
    return new URL(origin.trim()).origin;
  } catch {
    return undefined;
  }
}

const configuredFrontendUrls = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",")
    .map(normalizeOrigin)
    .filter((origin): origin is string => Boolean(origin))
  : [];

const devFrontendUrls =
  process.env.NODE_ENV === "production" ? [] : defaultFrontendUrls;

const frontendUrls = Array.from(
  new Set([...configuredFrontendUrls, ...devFrontendUrls]),
);

export async function createFastifyApp() {
  const fastify = Fastify({
    logger: {
      level: "warn",
    },
  });

  fastify.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      reply.status(error.statusCode).send({ message: error.message });
      return;
    }

    if (typeof error === "object" && error !== null && "validation" in error) {
      reply.status(400).send({ message: "Dados invalidos." });
      return;
    }

    fastify.log.error(error);
    reply.status(500).send({ message: "Erro interno do servidor." });
  });

  await fastify.register(cors, {
    origin: frontendUrls,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  });

  fastify.get("/", async () => {
    return { status: "ok", service: "teste-autismo-backend" };
  });

  const [
    { authPlugin },
    { authRoutes },
    { healthRoutes },
    { questionariosRoutes },
    { testesRoutes },
    { usuariosRoutes },
    { administradoresRoutes },
    { servicosRoutes },
  ] = await Promise.all([
    import("./middlewares/auth"),
    import("./routes/auth"),
    import("./routes/health"),
    import("./routes/questionarios"),
    import("./routes/testes"),
    import("./routes/usuarios"),
    import("./routes/administradores"),
    import("./routes/servicos"),
  ]);

  await fastify.register(authPlugin);
  await fastify.register(authRoutes);
  await fastify.register(healthRoutes);
  await fastify.register(questionariosRoutes);
  await fastify.register(testesRoutes);
  await fastify.register(usuariosRoutes);
  await fastify.register(administradoresRoutes);
  await fastify.register(servicosRoutes);

  return fastify;
}
