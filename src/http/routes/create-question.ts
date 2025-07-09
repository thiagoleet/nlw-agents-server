import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";
import { db } from "../../db/connection.ts";
import { schema } from "../../db/schema/index.ts";

export const createQuestionRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    "/rooms/:roomId/questions",
    {
      schema: {
        params: z.object({
          roomId: z.string().min(1, "Room ID is required"),
        }),
        body: z.object({
          question: z.string().min(1, "Question is required"),
        }),
      },
    },
    async (request, reply) => {
      const { question } = request.body;
      const { roomId } = request.params;

      const result = await db
        .insert(schema.questions)
        .values({
          question,
          roomId,
        })
        .returning();

      const insertedQuestion = result[0];

      if (!insertedQuestion) {
        throw new Error("Failed to create a new question");
      }

      return reply.status(201).send({
        questionId: insertedQuestion.id,
        message: "Question created successfully",
      });
    }
  );
};
