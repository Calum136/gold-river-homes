import { formatCurrency } from "@/lib/calculator";
import { estimateStatement } from "@/lib/copy";
import { calculateConfiguratorPrice } from "@/lib/pricing";
import type { ConfiguratorState, PriceBreakdownItem } from "@/lib/pricing";
import { EstimateFigure, ExampleFigure, MoneyRange } from "./Figures";

function LineAmount({ item }: { item: PriceBreakdownItem }) {
  if (item.low !== undefined && item.high !== undefined) return <MoneyRange low={item.low} high={item.high} />;
  if (item.isExample) return <ExampleFigure amount={item.amount} />;
  return <EstimateFigure amount={item.amount} />;
}

// Every line the total adds up: site costs (and the contingency that follows
// them) as low to high ranges, the model, options and example lot as single
// labelled figures. The total shows its range with the mid estimate, which the
// monthly payment uses, emphasized, and the estimate statement sits beside it.
export default function CostBreakdown({ state }: { state: ConfiguratorState }) {
  const { items, totalCost, totalLow, totalHigh } = calculateConfiguratorPrice(state);

  return (
    <section aria-labelledby="cost-breakdown-heading">
      <h2 id="cost-breakdown-heading" className="font-display text-title text-text-primary">
        Cost breakdown
      </h2>
      <p className="mt-1 text-body-sm text-text-muted">
        Site costs are shown as a range. The mid estimate adds up the middle of each range.
      </p>

      <dl className="mt-4 divide-y divide-border border-y border-border">
        {items.map((item, i) => (
          // Labels can repeat (two option groups both named "Premium"), so the position joins the key.
          <div key={`${i}:${item.label}`} className="flex items-baseline justify-between gap-4 py-3">
            <dt className="min-w-0">
              <span className="block text-body-sm text-text-secondary">{item.label}</span>
              {item.desc && <span className="mt-0.5 block text-caption text-text-muted">{item.desc}</span>}
            </dt>
            <dd className="shrink-0 text-right">
              <LineAmount item={item} />
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6">
        <p className="text-eyebrow font-medium uppercase tracking-eyebrow text-text-muted">Estimated total</p>
        <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-accent text-figure-lg tabular-nums text-gold-bright">{formatCurrency(totalCost)}</span>
          <span className="text-caption text-text-muted">mid estimate</span>
        </p>
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-caption text-text-muted">
          Range
          <MoneyRange low={totalLow} high={totalHigh} />
        </p>
        <p className="mt-3 text-caption text-text-muted">{estimateStatement}</p>
      </div>
    </section>
  );
}
