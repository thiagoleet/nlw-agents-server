import { and, eq, sql } from "drizzle-orm";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";
import { db } from "../../db/connection.ts";
import { schema } from "../../db/schema/index.ts";
import { generateAnswer, generateEmbedings } from "../../services/gemini.ts";

const SIMILARITY_THRESHOLD = 0.7;

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

      const embeddings = await generateEmbedings(question);
      const embeddingsAsString = `[${embeddings.join(",")}]`;

      const chunks = await db
        .select({
          id: schema.audioChunks.id,
          transcription: schema.audioChunks.transcription,
          similarity: sql<number>`1 - (${schema.audioChunks.embeddings} <=> ${embeddingsAsString}::vector)`,
        })
        .from(schema.audioChunks)
        .where(
          and(
            eq(schema.audioChunks.roomId, roomId),
            sql`1 - (${schema.audioChunks.embeddings} <=> ${embeddingsAsString}::vector) > ${SIMILARITY_THRESHOLD}`
          )
        )
        .orderBy(
          sql`${schema.audioChunks.embeddings} <=> ${embeddingsAsString}::vector`
        )
        .limit(5);

      let answer: string | null = null;

      if (chunks.length > 0) {
        const transcriptions = chunks.map((chunk) => chunk.transcription);
        answer = await generateAnswer(question, transcriptions);
      }

      const result = await db
        .insert(schema.questions)
        .values({
          question,
          roomId,
          answer,
        })
        .returning();

      const insertedQuestion = result[0];

      if (!insertedQuestion) {
        throw new Error("Failed to create a new question");
      }

      return reply.status(201).send({
        questionId: insertedQuestion.id,
        message: "Question created successfully",
        answer: insertedQuestion.answer,
      });
    }
  );
};
