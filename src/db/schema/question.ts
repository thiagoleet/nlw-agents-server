import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { rooms } from "./room.ts";

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id")
    .references(() => rooms.id)
    .notNull(),
  question: text("question").notNull(),
  answer: text("answer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
