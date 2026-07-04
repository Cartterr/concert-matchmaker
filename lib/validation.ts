import { z } from "zod";

export const httpUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  }, "URL must use http or https.");

export function optionalHttpUrl() {
  return z
    .union([httpUrlSchema, z.literal(""), z.null()])
    .optional()
    .transform((value) => (value ? value : undefined));
}
