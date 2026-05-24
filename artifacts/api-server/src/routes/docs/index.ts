import { Router, type IRouter } from "express";
import { eq, desc, gte, sql } from "drizzle-orm";
import { db, docRecordsTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  GenerateDocBody,
  GetDocParams,
  DeleteDocParams,
  ListDocsResponse,
  GetDocResponse,
  GetDocStatsResponse,
  ListRecentDocsResponse,
} from "@workspace/api-zod";
import { logger } from "../../lib/logger";

const router: IRouter = Router();

// GET /docs — list all docs
router.get("/docs", async (_req, res): Promise<void> => {
  const docs = await db
    .select()
    .from(docRecordsTable)
    .orderBy(desc(docRecordsTable.createdAt));
  res.json(ListDocsResponse.parse(docs));
});

// GET /docs/stats — dashboard stats
router.get("/docs/stats", async (_req, res): Promise<void> => {
  const allDocs = await db.select().from(docRecordsTable);
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const byType: Record<string, number> = {};
  let thisWeek = 0;

  for (const doc of allDocs) {
    byType[doc.docType] = (byType[doc.docType] ?? 0) + 1;
    if (new Date(doc.createdAt) >= oneWeekAgo) thisWeek++;
  }

  const stats = { total: allDocs.length, byType, thisWeek };
  res.json(GetDocStatsResponse.parse(stats));
});

// GET /docs/recent — last 5 docs
router.get("/docs/recent", async (_req, res): Promise<void> => {
  const docs = await db
    .select()
    .from(docRecordsTable)
    .orderBy(desc(docRecordsTable.createdAt))
    .limit(5);
  res.json(ListRecentDocsResponse.parse(docs));
});

// GET /docs/:id — single doc
router.get("/docs/:id", async (req, res): Promise<void> => {
  const params = GetDocParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db
    .select()
    .from(docRecordsTable)
    .where(eq(docRecordsTable.id, params.data.id));

  if (!doc) {
    res.status(404).json({ error: "Doc not found" });
    return;
  }

  res.json(GetDocResponse.parse(doc));
});

// POST /docs — generate documentation using AI
router.post("/docs", async (req, res): Promise<void> => {
  const parsed = GenerateDocBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, docType, sourceType, sourceRef, codeContent, language } = parsed.data;

  // Build a prompt based on docType
  const docTypePrompts: Record<string, string> = {
    readme: "Generate a comprehensive README.md for this project. Include project overview, features, tech stack, installation steps, usage examples, and contribution guidelines.",
    api: "Generate detailed API documentation. For each function/endpoint, document: purpose, parameters (name, type, description), return values, and usage examples.",
    functions: "Analyze each function and class in the code. For each, document: purpose, parameters, return type, behavior, edge cases, and a usage example.",
    setup: "Generate step-by-step setup and installation instructions. Include prerequisites, environment variables, installation commands, configuration, and common troubleshooting.",
    changelog: "Analyze the code and generate a professional CHANGELOG.md following Keep a Changelog format. Identify added features, changes, fixes, and improvements.",
    overview: "Generate a high-level project overview. Include architecture diagram (as text/ascii), module structure, data flow, key design decisions, and future improvements.",
  };

  const systemPrompt = `You are an expert technical writer and software engineer. Generate professional, clear, and comprehensive technical documentation in Markdown format.
The output should be formatted as clean Markdown only — no preamble or explanation outside the documentation itself.`;

  const userPrompt = `${docTypePrompts[docType] ?? "Generate comprehensive technical documentation."}

${sourceType === "github" ? `GitHub Repository URL: ${sourceRef ?? "N/A"}` : ""}
${language ? `Primary Language: ${language}` : ""}
${codeContent ? `\n---\nCode to Document:\n\`\`\`${language ?? ""}\n${codeContent}\n\`\`\`` : ""}

Title: ${title}`;

  req.log.info({ docType, sourceType }, "Generating documentation with AI");

  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "# Documentation\n\nNo content generated.";

  const [doc] = await db
    .insert(docRecordsTable)
    .values({
      title,
      docType,
      sourceType,
      sourceRef: sourceRef ?? null,
      content,
      language: language ?? null,
    })
    .returning();

  res.status(201).json(GetDocResponse.parse(doc));
});

// DELETE /docs/:id
router.delete("/docs/:id", async (req, res): Promise<void> => {
  const params = DeleteDocParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db
    .delete(docRecordsTable)
    .where(eq(docRecordsTable.id, params.data.id))
    .returning();

  if (!doc) {
    res.status(404).json({ error: "Doc not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
