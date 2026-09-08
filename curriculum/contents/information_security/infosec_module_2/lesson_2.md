# Risk Assessment Methods

## Why Assess Risk?

Before you can manage risk, you need to measure it. Risk assessment is the process of identifying risks and evaluating their significance so you can decide where to focus your efforts.

There are two broad approaches: **qualitative** and **quantitative**.

---

## Qualitative Risk Assessment

Qualitative assessment uses descriptive scales rather than numbers. Risks are scored as **Low / Medium / High** or plotted on a risk matrix.

### The Risk Matrix

```
         IMPACT
           Low    Medium   High
         +------+--------+------+
  High   | Med  |  High  | Crit |
L       +------+--------+------+
I  Med  | Low  |  Med   | High |
K       +------+--------+------+
E  Low  | Low  |  Low   | Med  |
L       +------+--------+------+
Y
```

**Strengths:** Fast, requires no financial data, easy to communicate.
**Weaknesses:** Subjective, hard to compare across teams.

---

## Quantitative Risk Assessment

Quantitative assessment uses numbers and financial values.

### Key Formulas

| Term | Formula |
|------|---------|
| **AV** — Asset Value | How much is the asset worth? |
| **EF** — Exposure Factor | % of asset lost in a single incident (0–1) |
| **SLE** — Single Loss Expectancy | `AV × EF` |
| **ARO** — Annual Rate of Occurrence | How many times per year? |
| **ALE** — Annual Loss Expectancy | `SLE × ARO` |

**Example:** A server worth $100,000, with EF of 50%, and breach likelihood of 0.2/year:
`SLE = $50,000` → `ALE = $10,000/year`

**Strengths:** Precise, budget-justifiable.
**Weaknesses:** Requires historical data, time-consuming.

---

## Asset-Based vs. Threat-Based Assessment

| Approach | Starting Point | Good For |
|----------|---------------|----------|
| **Asset-based** | What do we have that matters? | Inventorying and protecting critical resources |
| **Threat-based** | What could attack us? | Understanding adversary perspectives |

Most real-world assessments combine both.

---

## In Practice

Most organizations use qualitative assessment for day-to-day decisions and switch to quantitative for major investments (e.g., "Should we buy this $200,000 security tool?").
