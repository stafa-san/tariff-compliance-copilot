import { extractText } from "unpdf";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const { text, totalPages } = await extractText(new Uint8Array(arrayBuffer));

    return Response.json({
      text,
      pages: totalPages,
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
