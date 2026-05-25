import { Router, type IRouter } from "express";
import healthRouter from "./health";
import docsRouter from "./docs";
import openaiRouter from "./openai";

const router: Router = Router();

router.use(healthRouter);
router.use(docsRouter);
router.use(openaiRouter);

export default router;
