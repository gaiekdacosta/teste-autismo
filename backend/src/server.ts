import { createFastifyApp } from "./createFastifyApp";

const port = Number(process.env.PORT ?? 3000);

async function start(): Promise<void> {
  try {
    const fastify = await createFastifyApp();

    await fastify.listen({
      port,
      host: "0.0.0.0",
    });

    console.log(`Servidor rodando na porta: ${port}`);
    console.log(`Local: http://localhost:${port}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

void start();
