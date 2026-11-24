import * as fs from "node:fs";
import * as path from "node:path";

const LINE_1 =
  "At 11:52 p.m. on April 14th, when you're about to hit \"send\" on that email to your boss, close the laptop and go to bed—the \"FYI\" will read like a threat at 6 a.m.";
const LINE_2 =
  "That moment mattered more than any promotion, because the email got me a two-year reputation as \"the FYI guy,\" and I'm still closing that laptop in my head at 11:52.";

function countSentences(line: string): number {
  // Ignore periods inside time abbreviations (a.m. / p.m.) — they are not
  // sentence boundaries.
  const cleaned = line.replace(/[ap]\.m\./gi, "AMPM");
  return cleaned.split(/[.!?](?=\s|$)/).filter((s) => s.trim().length > 0).length;
}

function validate(entry: string): void {
  // Sealed gate: /output/entry.txt is UTF-8, 1-400 characters, exactly two lines.
  if (entry.length < 1 || entry.length > 400) {
    throw new Error(`entry length ${entry.length} is outside the sealed gate 1-400`);
  }
  const lines = entry.split("\n");
  if (lines.length !== 2) {
    throw new Error(`entry must be exactly 2 lines, got ${lines.length}`);
  }
  for (const [i, line] of lines.entries()) {
    if (line.trim().length === 0) throw new Error(`line ${i + 1} is empty`);
    if (line !== line.trim()) throw new Error(`line ${i + 1} has surrounding whitespace`);
    if (countSentences(line) !== 1) {
      throw new Error(`line ${i + 1} must be exactly one sentence`);
    }
    if (!line.endsWith(".")) throw new Error(`line ${i + 1} must end with a period`);
  }
  // Brief-aligned guards: line 1 is a warning about one specific moment
  // (it must name an exact time and tell past-self what to do); line 2 must
  // explain why that moment mattered (a lasting consequence), not a generic moral.
  if (!/\d{1,2}:\d{2}\s*[ap]\.m\./.test(lines[0])) {
    throw new Error("line 1 must name a specific time of day");
  }
  if (!/close the laptop/.test(lines[0])) {
    throw new Error("line 1 must give past-self a concrete action");
  }
  if (!/mattered/.test(lines[1])) {
    throw new Error("line 2 must state why the moment mattered");
  }
}

const entry = `${LINE_1}\n${LINE_2}`;
validate(entry);

const outDir = process.env.OUTPUT_DIR ?? "/output";
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "entry.txt");
fs.writeFileSync(outPath, entry, "utf8");

// Round-trip check: what was written must be byte-identical to what was validated.
const roundTrip = fs.readFileSync(outPath, "utf8");
if (roundTrip !== entry) throw new Error("round-trip mismatch: written entry differs");
console.log(`entry ok: ${entry.length} chars, 2 lines`);
