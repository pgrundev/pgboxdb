// Worker entry for pgboxdb.com/install and pgboxdb.com/llms.txt.
// Wrangler bundles llms.txt as a text module (its default rule for *.txt).
import llmsTxt from "./llms.txt";
import { createWorker } from "./install-worker.js";

export default createWorker(llmsTxt);
