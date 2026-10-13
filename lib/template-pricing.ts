export const templatePricing = {
  "velvet-vows": { amount: 999, currency: "INR" },
} as const;

export type SupportedTemplateId = keyof typeof templatePricing;

export function getTemplatePrice(templateId: string) {
  return templatePricing[templateId as SupportedTemplateId] ?? null;
}
