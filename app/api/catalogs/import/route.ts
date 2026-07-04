import { z } from "zod";
import { handleApiError, ok, requireApiUser } from "@/lib/api";
import { importArtistCatalog } from "@/lib/catalogs";

const jsonImportSchema = z.object({
  name: z.string().min(1).default("Imported artist catalog"),
  filename: z.string().optional(),
  content: z.string().min(1),
  source: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return ok({ error: "Missing file upload." }, { status: 400 });
      }

      const result = await importArtistCatalog({
        name: String(form.get("name") || file.name || "Imported artist catalog"),
        source: String(form.get("source") || file.name || "upload"),
        filename: file.name,
        content: await file.text(),
        createdById: user.userId,
      });

      return ok({
        catalogId: result.catalog.id,
        artistCount: result.artistCount,
      });
    }

    const body = jsonImportSchema.parse(await request.json());
    const result = await importArtistCatalog({
      ...body,
      createdById: user.userId,
    });

    return ok({
      catalogId: result.catalog.id,
      artistCount: result.artistCount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
