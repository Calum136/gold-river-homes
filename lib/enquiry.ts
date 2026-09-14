import { calculateMortgage, formatCurrency, formatMortgageAssumption } from "./calculator";
import { homeModels } from "./defaults";
import { calculateConfiguratorPrice } from "./pricing";
import type { ConfiguratorState } from "./pricing";
import { allSelections } from "./selections";
import type { SelectionDetail } from "./selections";

// ============================================
// Gold River's contact details, and the enquiry email: a mailto: link carrying
// the whole configuration as plain text plus the share link, which restores it
// exactly. Some mail clients truncate long mailto: links, so the link is kept
// within MAILTO_BUDGET characters; the share link carries every detail.
// ============================================

export const GOLD_RIVER_CONTACT = {
  address: "219 NS-12, Chester Basin NS",
  phone: "902-273-3033",
  phoneHref: "tel:+19022733033",
  email: "info@goldriverhomes.ca",
} as const;

export const MAILTO_BUDGET = 1800;

/** Longest saved name put in the subject; a longer one is shortened with an ellipsis. */
const SUBJECT_NAME_LIMIT = 60;

function shorten(text: string, limit: number): string {
  const chars = Array.from(text.trim());
  return chars.length <= limit ? chars.join("") : `${chars.slice(0, limit - 1).join("").trimEnd()}…`;
}

/** "Home configuration: Bali", plus " — <saved name>" when the configuration has one. */
export function enquirySubject(
  state: ConfiguratorState,
  savedName?: string | null,
  nameLimit: number = SUBJECT_NAME_LIMIT
): string {
  const model = homeModels.find((m) => m.id === state.modelId);
  const subject = model ? `Home configuration: ${model.name}` : "Home configuration";
  const name = savedName?.trim();
  return name ? `${subject} — ${shorten(name, nameLimit)}` : subject;
}

function selectionLine(selection: SelectionDetail): string {
  const { label, value, price } = selection;
  if (price.kind === "example") return `${label}: ${value} (example price ${formatCurrency(price.amount)})`;
  if (price.kind === "estimate") return `${label}: ${value} (est. ${formatCurrency(price.amount)})`;
  return `${label}: ${value}`;
}

/** The plain-text body: every selection, the total range, the monthly estimate and the share link. */
export function enquiryBody(state: ConfiguratorState, link: string, { greeting = true } = {}): string {
  const { totalCost, totalLow, totalHigh } = calculateConfiguratorPrice(state);
  const mortgage = calculateMortgage(totalCost, state.mortgage);
  return [
    ...(greeting ? ["Hello Gold River Homes,", "", "I'd like to talk about this home configuration.", ""] : []),
    ...allSelections(state).map(selectionLine),
    "",
    `Estimated total: ${formatCurrency(totalLow)} to ${formatCurrency(totalHigh)} (mid estimate ${formatCurrency(totalCost)})`,
    `Estimated monthly payment: ${formatCurrency(Math.round(mortgage.monthlyPayment))}/mo ${formatMortgageAssumption(mortgage, state.mortgage)}`,
    "",
    `Full configuration: ${link}`,
  ].join("\n");
}

// Line breaks as CRLF, as RFC 6068 asks of mailto: bodies.
const encodeMailtoPart = (text: string) => encodeURIComponent(text).replace(/%0A/g, "%0D%0A");

function mailto(subject: string, body: string): string {
  return `mailto:${GOLD_RIVER_CONTACT.email}?subject=${encodeMailtoPart(subject)}&body=${encodeMailtoPart(body)}`;
}

// Ways to fit the budget, tried in order: the full email, then without the
// greeting, then with a long saved name shortened. A selection, the figures
// and the share link are never dropped.
const FITS: ReadonlyArray<{ greeting: boolean; nameLimit: number }> = [
  { greeting: true, nameLimit: SUBJECT_NAME_LIMIT },
  { greeting: false, nameLimit: SUBJECT_NAME_LIMIT },
  { greeting: false, nameLimit: 24 },
  { greeting: false, nameLimit: 12 },
];

/** The "Email Gold River" link, within MAILTO_BUDGET characters. */
export function enquiryMailto(state: ConfiguratorState, savedName: string | null | undefined, link: string): string {
  let href = "";
  for (const { greeting, nameLimit } of FITS) {
    href = mailto(enquirySubject(state, savedName, nameLimit), enquiryBody(state, link, { greeting }));
    if (href.length <= MAILTO_BUDGET) break;
  }
  return href;
}
