import { extractText, getDocumentProxy } from "unpdf";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);

    // 1. Extract form field values first (for fillable PDFs like FedEx Commercial Invoices)
    let formFieldText = "";
    try {
      const doc = await getDocumentProxy(new Uint8Array(pdfBytes));
      const fieldEntries: string[] = [];

      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const annotations = await page.getAnnotations();

        for (const ann of annotations) {
          const val = ann.fieldValue;
          if (val && typeof val === "string" && val.trim() && val !== "Off") {
            const name = (ann.fieldName as string) || "Field";
            // Replace \r with newline for readability
            fieldEntries.push(`${name}: ${val.replace(/\r/g, "\n").trim()}`);
          }
        }
      }

      if (fieldEntries.length > 0) {
        formFieldText =
          "\n\n--- FORM FIELD DATA (extracted from fillable PDF fields) ---\n" +
          fieldEntries.join("\n");
      }

      await doc.destroy();
    } catch {
      // Form field extraction is best-effort
    }

    // 2. Extract static text layer
    const { text: rawText, totalPages } = await extractText(new Uint8Array(pdfBytes));
    const staticText = Array.isArray(rawText) ? rawText.join("\n\n") : String(rawText);

    const fullText = staticText + formFieldText;

    return Response.json({
      text: fullText,
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
