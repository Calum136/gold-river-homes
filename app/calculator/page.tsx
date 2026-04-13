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
  waterCosts,
  sewerCosts,
  foundationCosts,
  siteEstimates,
  mortgageDefaults,
  WaterType,
  SewerType,
  FoundationType,
  LandSituation,
} from "@/lib/defaults";

export default function CalculatorPage() {
  // User choices
  const [selectedModel, setSelectedModel] = useState<string>(homeModels[3].id); // Zenith CT default
  const [customPrice, setCustomPrice] = useState(200000);
  const [landSituation, setLandSituation] = useState<LandSituation>("buying");
  const [landPrice, setLandPrice] = useState(75000);
  const [foundation, setFoundation] = useState<FoundationType>("crawlspace");
  const [waterType, setWaterType] = useState<WaterType>("well");
  const [sewerType, setSewerType] = useState<SewerType>("septic");

  // Mortgage
  const [mortgage, setMortgage] = useState(mortgageDefaults);

  // Derived costs — the site TELLS the user what things cost
  const homePrice = useMemo(() => {
    if (selectedModel === "custom") return customPrice;
    return homeModels.find((m) => m.id === selectedModel)?.price ?? 180000;
  }, [selectedModel, customPrice]);

  const costs: CostBreakdown = useMemo(() => {
    const land = landSituation === "buying" ? landPrice : 0;
    const water = waterType ? waterCosts[waterType].mid : 0;
    const sewer = sewerType ? sewerCosts[sewerType].mid : 0;
    const found = foundationCosts[foundation].mid;
    const clearing = siteEstimates.clearing.mid;
    const driveway = siteEstimates.driveway.mid;
    const electrical = siteEstimates.electrical.mid;
    const delivery = siteEstimates.delivery.mid;
    const permits = siteEstimates.permits.mid;

    const subtotal = homePrice + land + found + clearing + driveway + water + sewer + electrical + delivery + permits;
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
    };
  }, [homePrice, landSituation, landPrice, foundation, waterType, sewerType]);

  const totalCost = useMemo(() => calculateTotalCost(costs), [costs]);
  const mortgageResult = useMemo(
    () => calculateMortgage(totalCost, mortgage),
    [totalCost, mortgage]
  );

  // For itemized display with more detail
  const detailedCosts = useMemo(() => {
    const land = landSituation === "buying" ? landPrice : 0;
    const water = waterType ? waterCosts[waterType].mid : 0;
    const sewer = sewerType ? sewerCosts[sewerType].mid : 0;
    const subtotal = homePrice + land + foundationCosts[foundation].mid + siteEstimates.clearing.mid + siteEstimates.driveway.mid + water + sewer + siteEstimates.electrical.mid + siteEstimates.delivery.mid + siteEstimates.permits.mid;

    return [
      { label: "Home Purchase", amount: homePrice, desc: selectedModel !== "custom" ? homeModels.find(m => m.id === selectedModel)?.name : "Custom price" },
      ...(land > 0 ? [{ label: "Land Purchase", amount: land }] : []),
      { label: foundationCosts[foundation].label, amount: foundationCosts[foundation].mid },
      { label: "Land Clearing & Grading", amount: siteEstimates.clearing.mid },
      { label: "Driveway", amount: siteEstimates.driveway.mid },
      ...(waterType ? [{ label: waterCosts[waterType].label, amount: water }] : []),
      ...(sewerType ? [{ label: sewerCosts[sewerType].label, amount: sewer }] : []),
      { label: "Electrical Service", amount: siteEstimates.electrical.mid },
      { label: "Delivery & Setup", amount: siteEstimates.delivery.mid },
      { label: "Permits & Inspections", amount: siteEstimates.permits.mid },
      { label: "Contingency (10%)", amount: Math.round(subtotal * 0.1), desc: "Buffer for unexpected costs" },
    ];
  }, [homePrice, selectedModel, landSituation, landPrice, foundation, waterType, sewerType]);

  const selectedModelData = homeModels.find((m) => m.id === selectedModel);

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
            Buying a modular home is more than just the home price. Answer a few
            simple questions and we&apos;ll show you the full picture &mdash;
            including land prep, well, septic, electrical, and everything else
            most people don&apos;t think about.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Questions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Q1: Choose your home */}
            <QuestionCard
              step={1}
              title="Choose Your Home"
              subtitle="Select a model or enter a custom price."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {homeModels.filter(m => m.id !== "custom").map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`text-left p-4 border transition-all duration-200 ${
                      selectedModel === model.id
                        ? "bg-gold/10 border-gold"
                        : "bg-bg-elevated border-border hover:border-border-gold/50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`font-medium ${selectedModel === model.id ? "text-gold" : "text-text-white"}`}>
                          {model.name}
                        </h4>
                        <p className="text-text-muted text-xs mt-1">
                          {model.type} &bull; {model.beds} bed / {model.baths} bath &bull; {model.sqft.toLocaleString()} ft&sup2;
                        </p>
                      </div>
                      <span className={`text-lg font-bold tabular-nums ${selectedModel === model.id ? "text-gold" : "text-text-white"}`}>
                        {formatCurrency(model.price)}
                      </span>
                    </div>
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
                  <span className={`font-medium ${selectedModel === "custom" ? "text-gold" : "text-text-white"}`}>
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

            {/* Q2: Land situation */}
            <QuestionCard
              step={2}
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
                  <span className="text-2xl block mb-1">{"\u2705"}</span>
                  <span className={`font-medium text-sm ${landSituation === "own" ? "text-gold" : "text-text-white"}`}>
                    I own my land
                  </span>
                </button>
                <button
                  onClick={() => setLandSituation("buying")}
                  className={`p-4 border text-center transition-all duration-200 ${
                    landSituation === "buying"
                      ? "bg-gold/10 border-gold"
                      : "bg-bg-elevated border-border hover:border-border-gold/50"
                  }`}
                >
                  <span className="text-2xl block mb-1">{"\u{1F50D}"}</span>
                  <span className={`font-medium text-sm ${landSituation === "buying" ? "text-gold" : "text-text-white"}`}>
                    I need to buy land
                  </span>
                </button>
              </div>

              {landSituation === "buying" && (
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

            {/* Q3: Foundation */}
            <QuestionCard
              step={3}
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

            {/* Q4: Water */}
            <QuestionCard
              step={4}
              title="How Will You Get Water?"
              subtitle="Most rural properties need a well. If you're in town, you may have municipal water available."
            >
              <div className="space-y-3">
                {(Object.entries(waterCosts) as [Exclude<WaterType, null>, typeof waterCosts.well][]).map(
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

            {/* Q5: Sewer */}
            <QuestionCard
              step={5}
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

            {/* Q6: Mortgage terms */}
            <QuestionCard
              step={6}
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

            {/* Other costs info */}
            <div className="bg-bg-secondary border border-border p-6 sm:p-8">
              <h3 className="font-display text-text-white text-xl mb-4">
                What Else Is Included?
              </h3>
              <p className="text-text-muted text-sm mb-4">
                The following costs are automatically estimated based on typical
                prices in the Lunenburg/Queens/Shelburne area. These are included
                in your total above.
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
                      description={item.desc}
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
