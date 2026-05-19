import { config } from "dotenv";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { AppError } from "./errors/AppError";
import { authPlugin } from "./middlewares/auth";
import { authRoutes } from "./routes/auth";
import { healthRoutes } from "./routes/health";
import { questionariosRoutes } from "./routes/questionarios";
import { testesRoutes } from "./routes/testes";
import { usuariosRoutes } from "./routes/usuarios";
import { administradoresRoutes } from "./routes/administradores";
import { servicosRoutes } from "./routes/servicos";

config();

const port = Number(process.env.PORT ?? 3000);
const defaultFrontendUrls = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];
const configuredFrontendUrls = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
  : [];
const devFrontendUrls =
  process.env.NODE_ENV === "production" ? [] : defaultFrontendUrls;
const frontendUrls = Array.from(
  new Set([...configuredFrontendUrls, ...devFrontendUrls]),
);

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

async function start(): Promise<void> {
  try {
    await fastify.register(cors, {
      origin: frontendUrls,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    });

    await fastify.register(authPlugin);
    await fastify.register(authRoutes);
    await fastify.register(healthRoutes);
    await fastify.register(questionariosRoutes);
    await fastify.register(testesRoutes);
    await fastify.register(usuariosRoutes);
    await fastify.register(administradoresRoutes);
    await fastify.register(servicosRoutes);

    await fastify.listen({
      port,
      host: "0.0.0.0",
    });

    console.log(`Servidor rodando na porta: ${port}`);
    console.log(`Local: http://localhost:${port}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

void start();
