import { formatCurrency } from "@/lib/calculator";
import type { SelectionPrice } from "@/lib/selections";
import { PriceDelta } from "@/components/configurator/ui/ChoiceRow";

const FIGURE = "whitespace-nowrap font-accent text-figure-sm tabular-nums text-text-primary";

/** "$12,000 – $30,000", read aloud as "$12,000 to $30,000". */
export function MoneyRange({ low, high, className = FIGURE }: { low: number; high: number; className?: string }) {
  return (
    <span className={className}>
      {formatCurrency(low)}
      <span aria-hidden> – </span>
      <span className="sr-only"> to </span>
      {formatCurrency(high)}
    </span>
  );
}

/** A single estimate figure with its quiet "est." marker. */
export function EstimateFigure({ amount }: { amount: number }) {
  return (
    <span className={FIGURE}>
      {formatCurrency(amount)}{" "}
      <span className="font-body text-caption font-normal text-text-muted">est.</span>
    </span>
  );
}

/** An example lot's price, labelled as an example. */
export function ExampleFigure({ amount }: { amount: number }) {
  return (
    <span className="whitespace-nowrap">
      <span className="text-caption text-text-muted">Example price </span>
      <span className={FIGURE}>{formatCurrency(amount)}</span>
    </span>
  );
}

/** The price beside a decision on the review page. */
export function SelectionPriceText({ price }: { price: SelectionPrice }) {
  switch (price.kind) {
    case "delta":
      return <PriceDelta amount={price.amount} />;
    case "estimate":
      return <EstimateFigure amount={price.amount} />;
    case "example":
      return <ExampleFigure amount={price.amount} />;
    case "range":
      return <MoneyRange low={price.low} high={price.high} />;
    case "none":
      return price.note ? <span className="text-caption text-text-muted">{price.note}</span> : null;
  }
}
