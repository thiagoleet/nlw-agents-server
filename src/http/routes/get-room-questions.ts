import { desc, eq } from "drizzle-orm";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";
import { db } from "../../db/connection.ts";
import { schema } from "../../db/schema/index.ts";

export const getRoomQuestionsRoute: FastifyPluginCallbackZod = (app) => {
  app.get(
    "/rooms/:roomId/questions",
    {
      schema: {
        params: z.object({
          roomId: z.string().min(1, "Room ID is required"),
        }),
      },
    },
    async (request, reply) => {
      const { roomId } = request.params;

      const results = await db
        .select({
          id: schema.questions.id,
          question: schema.questions.question,
          answer: schema.questions.answer,
          createdAt: schema.questions.createdAt,
          roomId: schema.questions.roomId,
        })
        .from(schema.questions)
        .where(eq(schema.questions.roomId, roomId))
        .orderBy(desc(schema.questions.createdAt));

      if (results.length === 0) {
        return reply.status(404).send({
          data: [],
          message: "No questions found for this room",
          total: 0,
        });
      }

      return {
        data: results,
        message: "Questions retrieved successfully",
        total: results.length,
      };
    }
  );
};
