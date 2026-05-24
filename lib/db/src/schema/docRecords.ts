import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const docRecordsTable = pgTable("doc_records", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  docType: text("doc_type").notNull(),
  sourceType: text("source_type").notNull(),
  sourceRef: text("source_ref"),
  content: text("content").notNull(),
  language: text("language"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDocRecordSchema = createInsertSchema(docRecordsTable).omit({ id: true, createdAt: true });
export type InsertDocRecord = z.infer<typeof insertDocRecordSchema>;
export type DocRecord = typeof docRecordsTable.$inferSelect;
