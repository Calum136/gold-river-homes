"use client";

import { useState, useMemo } from "react";
import QuestionCard from "@/components/calculator/QuestionCard";
import ChoiceCard from "@/components/calculator/ChoiceCard";
import CostLineItem from "@/components/calculator/CostLineItem";
import CostBreakdownChart from "@/components/calculator/CostBreakdownChart";
import ResultsPanel from "@/components/calculator/ResultsPanel";
import MortgageInputs from "@/components/calculator/MortgageInputs";
import {
  calculateTotalCost,
  calculateMortgage,
  formatCurrency,
  CostBreakdown,
} from "@/lib/calculator";
import {
  homeModels,
  homeCategories,
  finishCategories,
  extensionOptions,
  waterCosts,
  sewerCosts,
  foundationCosts,
  siteEstimates,
  mortgageDefaults,
  WaterType,
  SewerType,
  FoundationType,
  LandSituation,
  HomeCategory,
} from "@/lib/defaults";

const energyRating = (insulation: string, roofing: string) => {
  if (insulation === "premium") return { grade: "A", label: "Excellent", color: "#6BAE8B" };
  if (insulation === "enhanced" && roofing === "metal") return { grade: "B+", label: "Very Good", color: "#9BAE6B" };
  if (insulation === "enhanced") return { grade: "B", label: "Good", color: "#C4A35A" };
  if (roofing === "metal") return { grade: "C+", label: "Above Average", color: "#C4882A" };
  return { grade: "C", label: "Standard", color: "#9B8B7A" };
};

export default function CalculatorPage() {
  // Category & model selection
  const [selectedCategory, setSelectedCategory] = useState<HomeCategory>("mini");
  const [selectedModel, setSelectedModel] = useState<string>("zenith-ct");
  const [customPrice, setCustomPrice] = useState(200000);

  // Finishes
  const [finishes, setFinishes] = useState<Record<string, string>>({
    insulation: "standard",
    siding: "vinyl-horizontal",
    roofing: "shingles",
    flooring: "standard",
    countertops: "laminate",
  });

  // Extensions
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>([]);

  // Site questions
  const [landSituation, setLandSituation] = useState<LandSituation>("gold-river");
  const [landPrice, setLandPrice] = useState(75000);
  const [foundation, setFoundation] = useState<FoundationType>("crawlspace");
  const [waterType, setWaterType] = useState<WaterType>("drilled");
  const [sewerType, setSewerType] = useState<SewerType>("septic");

  // Mortgage
  const [mortgage, setMortgage] = useState(mortgageDefaults);

  const handleCategorySelect = (category: HomeCategory) => {
    setSelectedCategory(category);
    const first = homeModels.find((m) => m.category === category && m.id !== "custom");
    if (first) setSelectedModel(first.id);
  };

  const toggleExtension = (id: string) => {
    setSelectedExtensions((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  // Finish delta = sum of all selected finish price deltas
  const finishDelta = useMemo(() => {
    return finishCategories.reduce((sum, cat) => {
      const opt = cat.options.find((o) => o.id === finishes[cat.id]);
      return sum + (opt?.priceDelta ?? 0);
    }, 0);
  }, [finishes]);

  // Extensions cost = sum of selected extension mid values
  const extensionsCost = useMemo(() => {
    return selectedExtensions.reduce((sum, id) => {
      const ext = extensionOptions.find((e) => e.id === id);
      return sum + (ext?.mid ?? 0);
    }, 0);
  }, [selectedExtensions]);

  // Base home price (model price + finish upgrades)
  const baseModelPrice = useMemo(() => {
    if (selectedModel === "custom") return customPrice;
    return homeModels.find((m) => m.id === selectedModel)?.price ?? 180000;
  }, [selectedModel, customPrice]);

  const homePrice = useMemo(() => baseModelPrice + finishDelta, [baseModelPrice, finishDelta]);

  const costs: CostBreakdown = useMemo(() => {
    const land = landSituation === "gold-river" ? landPrice : 0;
    const water = waterType ? waterCosts[waterType].mid : 0;
    const sewer = sewerType ? sewerCosts[sewerType].mid : 0;
    const found = foundationCosts[foundation].mid;
    const clearing = siteEstimates.clearing.mid;
    const driveway = siteEstimates.driveway.mid;
    const electrical = siteEstimates.electrical.mid;
    const delivery = siteEstimates.delivery.mid;
    const permits = siteEstimates.permits.mid;

    const subtotal =
      homePrice + land + found + clearing + driveway + water + sewer +
      electrical + delivery + permits + extensionsCost;
    const contingency = Math.round(subtotal * 0.1);

    return {
      homePrice,
      landPrice: land,
      sitePrep: found + clearing + driveway,
      waterService: water,
      sewerService: sewer,
      electrical,
      delivery,
      permits,
      contingency,
      upgrades: extensionsCost,
    };
  }, [homePrice, landSituation, landPrice, foundation, waterType, sewerType, extensionsCost]);

  const totalCost = useMemo(() => calculateTotalCost(costs), [costs]);
  const mortgageResult = useMemo(
    () => calculateMortgage(totalCost, mortgage),
    [totalCost, mortgage]
  );

  const detailedCosts = useMemo(() => {
    const land = landSituation === "gold-river" ? landPrice : 0;
    const water = waterType ? waterCosts[waterType].mid : 0;
    const sewer = sewerType ? sewerCosts[sewerType].mid : 0;
    const subtotal =
      homePrice + land + foundationCosts[foundation].mid +
      siteEstimates.clearing.mid + siteEstimates.driveway.mid +
      water + sewer + siteEstimates.electrical.mid +
      siteEstimates.delivery.mid + siteEstimates.permits.mid + extensionsCost;

    const modelName =
      selectedModel !== "custom"
        ? homeModels.find((m) => m.id === selectedModel)?.name
        : "Custom price";

    return [
      { label: "Home Purchase", amount: baseModelPrice, desc: modelName },
      ...(finishDelta > 0
        ? [{ label: "Finish Upgrades", amount: finishDelta, desc: "Selected upgrades" }]
        : []),
      ...(land > 0 ? [{ label: "Land Purchase", amount: land }] : []),
      ...selectedExtensions.map((extId) => {
        const ext = extensionOptions.find((e) => e.id === extId)!;
        return { label: ext.label, amount: ext.mid };
      }),
      { label: foundationCosts[foundation].label, amount: foundationCosts[foundation].mid },
      { label: "Land Clearing & Grading", amount: siteEstimates.clearing.mid },
      { label: "Driveway", amount: siteEstimates.driveway.mid },
      ...(waterType ? [{ label: waterCosts[waterType].label, amount: water }] : []),
      ...(sewerType ? [{ label: sewerCosts[sewerType].label, amount: sewer }] : []),
      { label: "Electrical Service", amount: siteEstimates.electrical.mid },
      { label: "Delivery & Setup", amount: siteEstimates.delivery.mid },
      { label: "Permits & Inspections", amount: siteEstimates.permits.mid },
      {
        label: "Contingency (10%)",
        amount: Math.round(subtotal * 0.1),
        desc: "Buffer for unexpected costs",
      },
    ];
  }, [homePrice, baseModelPrice, finishDelta, selectedModel, landSituation, landPrice, foundation, waterType, sewerType, selectedExtensions, extensionsCost]);

  const modelsInCategory = homeModels.filter(
    (m) => m.category === selectedCategory && m.id !== "custom"
  );

  const efficiency = energyRating(finishes.insulation, finishes.roofing);

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-bg-tertiary border-b border-border py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gold uppercase text-xs tracking-[0.3em] font-medium mb-2">
            Total Cost Calculator
          </p>
          <h1 className="font-display text-text-white text-3xl sm:text-4xl mb-3">
            What Does It <span className="text-gold">Really</span> Cost?
          </h1>
          <p className="text-text-muted text-base max-w-2xl">
            Answer a few simple questions and we&apos;ll show you the full
            picture &mdash; home, finishes, land prep, well, septic, electrical,
            and everything else most people don&apos;t think about.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Questions */}
          <div className="lg:col-span-2 space-y-6">

            {/* Step 1: Choose category */}
            <QuestionCard
              step={1}
              title="What Type of Home Are You Looking For?"
              subtitle="Select a category to see models in that range."
            >
              <div className="grid grid-cols-2 gap-3">
                {homeCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`text-left p-4 border transition-all duration-200 ${
                      selectedCategory === cat.id
                        ? "bg-gold/10 border-gold"
                        : "bg-bg-elevated border-border hover:border-border-gold/50"
                    }`}
                  >
                    <h4 className={`font-medium text-sm mb-1 ${selectedCategory === cat.id ? "text-gold" : "text-text-white"}`}>
                      {cat.label}
                    </h4>
                    <p className="text-text-muted text-xs leading-snug mb-2">
                      {cat.description}
                    </p>
                    <span className={`text-xs font-semibold tabular-nums ${selectedCategory === cat.id ? "text-gold" : "text-text-muted"}`}>
                      {cat.priceRange}
                    </span>
                  </button>
                ))}
              </div>
            </QuestionCard>

            {/* Step 2: Choose model */}
            <QuestionCard
              step={2}
              title="Select Your Model"
              subtitle="These are the available models in your chosen category."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {modelsInCategory.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`text-left p-4 border transition-all duration-200 ${
                      selectedModel === model.id
                        ? "bg-gold/10 border-gold"
                        : "bg-bg-elevated border-border hover:border-border-gold/50"
                    }`}
                  >
                    {/* Placeholder image area */}
                    <div className="w-full h-24 bg-white/5 border border-white/5 rounded mb-3 flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
                        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
                        <path d="M9 21V12h6v9" />
                      </svg>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`font-medium text-sm ${selectedModel === model.id ? "text-gold" : "text-text-white"}`}>
                          {model.name}
                        </h4>
                        <p className="text-text-muted text-xs mt-0.5">
                          {model.beds} bed &bull; {model.baths} bath &bull; {model.sqft.toLocaleString()} ft&sup2;
                        </p>
                      </div>
                      <span className={`text-sm font-bold tabular-nums ${selectedModel === model.id ? "text-gold" : "text-text-white"}`}>
                        {formatCurrency(model.price)}
                      </span>
                    </div>
                    {model.description && (
                      <p className="text-text-muted/60 text-xs mt-2 leading-snug">
                        {model.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom price option */}
              <button
                onClick={() => setSelectedModel("custom")}
                className={`w-full mt-3 text-left p-4 border transition-all duration-200 ${
                  selectedModel === "custom"
                    ? "bg-gold/10 border-gold"
                    : "bg-bg-elevated border-border hover:border-border-gold/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-medium text-sm ${selectedModel === "custom" ? "text-gold" : "text-text-white"}`}>
                    I have a different price in mind
                  </span>
                  {selectedModel === "custom" && (
                    <div className="flex items-center gap-1">
                      <span className="text-gold text-sm">$</span>
                      <input
                        type="number"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(parseInt(e.target.value) || 0)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-32 bg-input-bg border border-border text-text-white text-sm text-right px-2 py-1 rounded focus:border-gold focus:outline-none"
                        step={5000}
                      />
                    </div>
                  )}
                </div>
              </button>
            </QuestionCard>

            {/* Step 3: Customize finishes */}
            <QuestionCard
              step={3}
              title="Customize Your Finish"
              subtitle="Choose your interior and exterior finishes. Each upgrade adds to your home price."
            >
              <div className="space-y-6">
                {finishCategories.map((cat) => (
                  <div key={cat.id}>
                    <p className="text-text-secondary text-xs uppercase tracking-widest font-medium mb-2">
                      {cat.label}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {cat.options.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setFinishes((prev) => ({ ...prev, [cat.id]: opt.id }))}
                          className={`text-left p-3 border text-sm transition-all duration-200 ${
                            finishes[cat.id] === opt.id
                              ? "bg-gold/10 border-gold"
                              : "bg-bg-elevated border-border hover:border-border-gold/50"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className={`font-medium ${finishes[cat.id] === opt.id ? "text-gold" : "text-text-white"}`}>
                              {opt.label}
                            </span>
                            {opt.priceDelta > 0 && (
                              <span className="text-gold text-xs font-semibold tabular-nums ml-1 shrink-0">
                                +{formatCurrency(opt.priceDelta)}
                              </span>
                            )}
                            {opt.priceDelta === 0 && (
                              <span className="text-text-muted/50 text-xs ml-1 shrink-0">Included</span>
                            )}
                          </div>
                          <p className="text-text-muted/60 text-xs leading-snug">{opt.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Energy efficiency badge */}
                <div className="bg-bg-elevated border border-border/50 p-4 flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 text-bg-primary font-bold text-lg"
                    style={{ backgroundColor: efficiency.color }}
                  >
                    {efficiency.grade}
                  </div>
                  <div>
                    <p className="text-text-white text-sm font-medium">
                      Energy Efficiency: <span style={{ color: efficiency.color }}>{efficiency.label}</span>
                    </p>
                    <p className="text-text-muted/60 text-xs mt-0.5">
                      Based on your insulation and roofing selection. Upgrade to Enhanced or Premium insulation to improve your rating.
                    </p>
                  </div>
                </div>
              </div>
            </QuestionCard>

            {/* Step 4: Extensions & add-ons */}
            <QuestionCard
              step={4}
              title="Extensions &amp; Add-Ons"
              subtitle="Optional upgrades that attach to your home. Select any that interest you."
            >
              <div className="space-y-3">
                {extensionOptions.map((ext) => {
                  const selected = selectedExtensions.includes(ext.id);
                  return (
                    <button
                      key={ext.id}
                      onClick={() => toggleExtension(ext.id)}
                      className={`w-full text-left p-4 border transition-all duration-200 ${
                        selected
                          ? "bg-gold/10 border-gold"
                          : "bg-bg-elevated border-border hover:border-border-gold/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox indicator */}
                        <div className={`w-5 h-5 rounded border shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                          selected ? "bg-gold border-gold" : "border-border"
                        }`}>
                          {selected && (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="2 6 5 9 10 3" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className={`font-medium text-sm ${selected ? "text-gold" : "text-text-white"}`}>
                              {ext.label}
                            </h4>
                            <span className={`text-sm font-bold tabular-nums ml-2 shrink-0 ${selected ? "text-gold" : "text-text-muted"}`}>
                              ~{formatCurrency(ext.mid)}
                            </span>
                          </div>
                          <p className="text-text-muted/60 text-xs mt-1 leading-snug">{ext.description}</p>
                          <p className="text-text-muted/40 text-[10px] mt-1 tabular-nums">
                            Range: {formatCurrency(ext.low)} &ndash; {formatCurrency(ext.high)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </QuestionCard>

            {/* Step 5: Land situation */}
            <QuestionCard
              step={5}
              title="Do You Own Land?"
              subtitle="Already have a lot, or still looking?"
            >
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setLandSituation("own")}
                  className={`p-4 border text-center transition-all duration-200 ${
                    landSituation === "own"
                      ? "bg-gold/10 border-gold"
                      : "bg-bg-elevated border-border hover:border-border-gold/50"
                  }`}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`mx-auto mb-2 ${landSituation === "own" ? "text-gold" : "text-text-muted"}`}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className={`font-medium text-sm ${landSituation === "own" ? "text-gold" : "text-text-white"}`}>
                    I own my land
                  </span>
                </button>
                <button
                  onClick={() => setLandSituation("gold-river")}
                  className={`p-4 border text-center transition-all duration-200 ${
                    landSituation === "gold-river"
                      ? "bg-gold/10 border-gold"
                      : "bg-bg-elevated border-border hover:border-border-gold/50"
                  }`}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`mx-auto mb-2 ${landSituation === "gold-river" ? "text-gold" : "text-text-muted"}`}>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span className={`font-medium text-sm ${landSituation === "gold-river" ? "text-gold" : "text-text-white"}`}>
                    I need to buy land
                  </span>
                </button>
              </div>

              {landSituation === "gold-river" && (
                <div className="bg-bg-elevated border border-border p-4">
                  <label className="text-text-secondary text-sm font-medium block mb-2">
                    Estimated land price
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gold">$</span>
                    <input
                      type="number"
                      value={landPrice}
                      onChange={(e) => setLandPrice(parseInt(e.target.value) || 0)}
                      className="flex-1 bg-input-bg border border-border text-text-white text-lg px-3 py-2 rounded focus:border-gold focus:outline-none"
                      step={5000}
                    />
                  </div>
                  <p className="text-text-muted/60 text-xs mt-2">
                    Rural lots in our service area typically range from $30,000 to $150,000 depending on size and location.
                  </p>
                </div>
              )}
            </QuestionCard>

            {/* Step 6: Foundation */}
            <QuestionCard
              step={6}
              title="What Type of Foundation?"
              subtitle="Your home needs a foundation. Here's what each option typically costs."
            >
              <div className="space-y-3">
                {(Object.entries(foundationCosts) as [FoundationType, typeof foundationCosts.slab][]).map(
                  ([key, estimate]) => (
                    <ChoiceCard
                      key={key}
                      estimate={estimate}
                      selected={foundation === key}
                      onClick={() => setFoundation(key)}
                    />
                  )
                )}
              </div>
            </QuestionCard>

            {/* Step 7: Water */}
            <QuestionCard
              step={7}
              title="How Will You Get Water?"
              subtitle="Most rural properties need a well. If you're in town, you may have municipal water available."
            >
              <div className="space-y-3">
                {(Object.entries(waterCosts) as [Exclude<WaterType, null>, typeof waterCosts.drilled][]).map(
                  ([key, estimate]) => (
                    <ChoiceCard
                      key={key}
                      estimate={estimate}
                      selected={waterType === key}
                      onClick={() => setWaterType(key)}
                    />
                  )
                )}
              </div>
            </QuestionCard>

            {/* Step 8: Sewer */}
            <QuestionCard
              step={8}
              title="How Will Waste Be Handled?"
              subtitle="Rural properties need a septic system. Municipal sewer is only available within town limits."
            >
              <div className="space-y-3">
                {(Object.entries(sewerCosts) as [Exclude<SewerType, null>, typeof sewerCosts.septic][]).map(
                  ([key, estimate]) => (
                    <ChoiceCard
                      key={key}
                      estimate={estimate}
                      selected={sewerType === key}
                      onClick={() => setSewerType(key)}
                    />
                  )
                )}
              </div>
            </QuestionCard>

            {/* Step 9: Mortgage terms */}
            <QuestionCard
              step={9}
              title="Mortgage Details"
              subtitle="Adjust your down payment, interest rate, and amortization to see your estimated payments."
            >
              <MortgageInputs
                downPaymentPercent={mortgage.downPaymentPercent}
                interestRate={mortgage.interestRate}
                amortizationYears={mortgage.amortizationYears}
                onDownPaymentChange={(v) =>
                  setMortgage((prev) => ({ ...prev, downPaymentPercent: v }))
                }
                onInterestRateChange={(v) =>
                  setMortgage((prev) => ({ ...prev, interestRate: v }))
                }
                onAmortizationChange={(v) =>
                  setMortgage((prev) => ({ ...prev, amortizationYears: v }))
                }
              />
            </QuestionCard>

            {/* Auto-estimated costs info */}
            <div className="bg-bg-secondary border border-border p-6 sm:p-8">
              <h3 className="font-display text-text-white text-xl mb-4">
                What Else Is Included?
              </h3>
              <p className="text-text-muted text-sm mb-4">
                The following costs are automatically estimated based on typical
                prices in the Lunenburg/Queens/Shelburne area.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(siteEstimates).map(([key, est]) => (
                  <div
                    key={key}
                    className="bg-bg-elevated border border-border/50 p-4"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-text-white text-sm font-medium">
                        {est.label}
                      </span>
                      <span className="text-gold text-sm font-bold tabular-nums">
                        {formatCurrency(est.mid)}
                      </span>
                    </div>
                    <p className="text-text-muted/60 text-xs leading-relaxed">
                      {est.description}
                    </p>
                    <p className="text-text-muted/40 text-[10px] mt-1 tabular-nums">
                      Range: {formatCurrency(est.low)} &ndash;{" "}
                      {formatCurrency(est.high)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Live Results (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Mortgage Results */}
              <ResultsPanel result={mortgageResult} />

              {/* Itemized Breakdown */}
              <div className="bg-bg-secondary border border-border p-6">
                <h3 className="font-display text-text-white text-lg mb-4">
                  Your Cost Breakdown
                </h3>
                <div className="space-y-0">
                  {detailedCosts.map((item) => (
                    <CostLineItem
                      key={item.label}
                      label={item.label}
                      amount={item.amount}
                      description={"desc" in item ? item.desc : undefined}
                    />
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t-2 border-gold/30">
                  <div className="flex justify-between items-center">
                    <span className="text-gold uppercase text-sm font-semibold tracking-wider">
                      Total Estimated Cost
                    </span>
                    <span className="text-gold text-xl font-bold tabular-nums">
                      {formatCurrency(totalCost)}
                    </span>
                  </div>
                  <p className="text-text-muted/50 text-xs mt-1">
                    Based on typical costs in Nova Scotia
                  </p>
                </div>
              </div>

              {/* Chart */}
              <CostBreakdownChart costs={costs} />

              {/* CTA */}
              <div className="bg-gold-dark border border-gold/20 p-6 text-center">
                <p className="text-text-white font-display text-lg mb-2">
                  Want an Exact Quote?
                </p>
                <p className="text-text-muted text-sm mb-4">
                  These are estimates. Contact us to discuss your specific
                  property and get accurate pricing.
                </p>
                <a
                  href="tel:+19022733033"
                  className="inline-block w-full bg-gold hover:bg-gold-bright text-white uppercase text-sm font-medium tracking-widest px-6 py-3 transition-colors duration-200"
                >
                  Call (902) 273-3033
                </a>
                <a
                  href="mailto:info@goldriverhomes.ca"
                  className="inline-block w-full mt-2 border border-gold/40 text-gold hover:bg-gold/10 uppercase text-sm font-medium tracking-widest px-6 py-3 transition-colors duration-200"
                >
                  Email Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
