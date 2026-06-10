import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p", "br",
  "h1", "h2", "h3",
  "strong", "b", "em", "i", "u",
  "ul", "ol", "li",
  "a",
  "blockquote",
  "hr",
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "target", "rel"],
};

// Only http/https/mailto links allowed — blocks javascript: and data: URLs in <a href>
const ALLOWED_SCHEMES = ["http", "https", "mailto"];

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ALLOWED_SCHEMES,
    // Enforce noopener noreferrer on all target="_blank" links
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          ...(attribs.target === "_blank"
            ? { rel: "noopener noreferrer" }
            : {}),
        },
      }),
    },
  });
}
