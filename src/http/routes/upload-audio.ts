import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";
import { db } from "../../db/connection.ts";
import { schema } from "../../db/schema/index.ts";
import { generateEmbedings, transcribeAudio } from "../../services/gemini.ts";

export const uploadAudioRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    "/rooms/:roomId/audio",
    {
      schema: {
        params: z.object({
          roomId: z.string().min(1, "Room ID is required"),
        }),
      },
    },
    async (request, reply) => {
      const { roomId } = request.params;
      const audio = await request.file();

      if (!audio) {
        return reply.status(400).send({ error: "Audio file is required" });
      }

      // 1. Transcrever o áudio
      const audioBuffer = await audio.toBuffer();
      const audioAsBase64 = audioBuffer.toString("base64");
      const transcription = await transcribeAudio(
        audioAsBase64,
        audio.mimetype
      );

      // 2. Gerar o vetor semântico / embeddings
      const embeddings = await generateEmbedings(transcription);

      // 3. Armazenar os vetores no banco de dados
      const results = await db
        .insert(schema.audioChunks)
        .values({
          roomId,
          transcription,
          embeddings,
        })
        .returning();

      const chunk = results[0];

      if (!chunk) {
        return reply.status(500).send({ error: "Failed to store audio chunk" });
      }

      return reply.status(201).send({
        id: chunk.id,
        roomId: chunk.roomId,
        transcription: chunk.transcription,
        createdAt: chunk.createdAt,
      });
    }
  );
};
