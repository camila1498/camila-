export type RetentionGroup = { count: number; dueAt?: string; dueOn?: string | null };

export type RetentionCampaign = {
  id: string;
  name: string;
  formSlug: string;
  status: "closed" | "archived";
  closedAt: string;
  programEndedOn: string | null;
  rules: { notSelected: number; waitlist: number; participants: number };
  notSelected: RetentionGroup;
  waitlist: RetentionGroup;
  participants: RetentionGroup;
  exportedAt: string | null;
  purged: { deleted: number; anonymized: number };
};

export type RetentionRule = {
  form_slug: string;
  not_selected_months: number;
  waitlist_months: number;
  participant_months: number;
};

export const DEFAULT_RULES = { not_selected_months: 6, waitlist_months: 12, participant_months: 24 } as const;

/** Un grupo está vencido si su fecha límite ya pasó. */
export const isDue = (iso: string | null | undefined, now = Date.now()) => Boolean(iso) && Date.parse(iso!) <= now;
