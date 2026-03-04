import { PDFParse } from "pdf-parse";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();

    return Response.json({
      text: result.text,
      pages: result.pages.length,
      fileName: file.name,
    });
  } catch (err) {
    console.error("[extract-pdf] Failed:", err);
    return Response.json(
      { error: "Failed to extract text from PDF" },
      { status: 500 },
    );
  }
}
