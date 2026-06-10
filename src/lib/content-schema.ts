import { z } from "zod";

/**
 * Single source of truth for the memorial page's content shape.
 * Every section component, admin form, and persistence call imports
 * types/validation from here — never redefine these shapes elsewhere.
 */

export const logoSchema = z.object({
  imageUrl: z.string().default(""),
  title: z.string().default(""),
});

export const sliderImageSchema = z.object({
  imageUrl: z.string().default(""),
  caption: z.string().default(""),
});

export const articleSchema = z.object({
  title: z.string().default(""),
  sourceName: z.string().default(""),
  url: z.string().default(""),
  imageUrl: z.string().default(""),
});

export const socialLinksSchema = z.object({
  whatsapp: z.string().default(""),
  instagram: z.string().default(""),
  facebook: z.string().default(""),
});

export const contactSchema = z.object({
  name: z.string().default(""),
  phone: z.string().default(""),
  email: z.string().default(""),
  link: z.string().default(""),
});

// Nested objects must default via a function that re-parses `{}` through the
// section schema — a bare `.default({})` would skip the section schema's own
// field-level defaults and leave e.g. `logo` as `{}` instead of `{ imageUrl: "", title: "" }`.
export const contentSchema = z.object({
  logo: logoSchema.default(() => logoSchema.parse({})),
  slider: z.array(sliderImageSchema).default([]),
  story: z.string().default(""),
  articles: z.array(articleSchema).default([]),
  social: socialLinksSchema.default(() => socialLinksSchema.parse({})),
  contact: contactSchema.default(() => contactSchema.parse({})),
});

export type Logo = z.infer<typeof logoSchema>;
export type SliderImage = z.infer<typeof sliderImageSchema>;
export type Article = z.infer<typeof articleSchema>;
export type SocialLinks = z.infer<typeof socialLinksSchema>;
export type ContactInfo = z.infer<typeof contactSchema>;
export type ContentDocument = z.infer<typeof contentSchema>;
