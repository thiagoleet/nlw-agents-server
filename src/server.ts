import { fastify } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { fastifyCors } from "@fastify/cors";
import { env } from "./env.ts";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.register(fastifyCors, {
  origin: "http:/localhost:5173",
});

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

// Health check route
app.get("/health", () => {
  return { status: "ok" };
});

app
  .listen({ port: env.PORT })
  .then(() => {
    console.log("HTTP server running on http://localhost:3333");
  })
  .catch((err) => {
    console.error("Error starting server:", err);
    process.exit(1);
  });
