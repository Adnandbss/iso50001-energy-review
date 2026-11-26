# ISO 50001 energy review — from a Power BI report to a single-file tool with agents

An energy review dashboard for industrial sites, rebuilt from a Power BI report into **one HTML file with no dependencies and no server**. It reads the site's Excel workbook in the browser, recomputes the regression baselines, finds drifts, forecasts the coming months, and lets tool-using AI agents investigate drifts and draft the review — with every figure computed by the page, never by the model.

The interface is in French with an English toggle.

## What it does

| Page | What you get |
|---|---|
| Site, SEUs | Actual vs baseline per meter, error tunnel, gap in energy, € and CO₂e |
| Detection | Drift episodes (z-score on the model error), ongoing drifts and what they cost if nothing changes |
| Investigation | An agent investigates one drift with five read-only tools; a second agent reviews the note in a separate conversation; the page checks every number against the tool results |
| Forecast | 3–12 month forecast with an 80 % band, year-end landing in energy, € and CO₂e, and a rolling-origin backtest against a naive method |
| Simulator | "What if production rose 10 % and the winter were cold?" — replays the baseline models, flags extrapolation, accepts a scenario written in one sentence |
| Watch | Compares drifts with the previous load, ranks them by stake without double counting, investigates the top N in a row |
| Review | Agents draft the ISO 50001 review from a file of 53 computed facts; two checks (deterministic and a second agent) before human sign-off and PDF export |
| Evaluation | A 26-question bench whose answers the page computes itself: reading, comparison, multi-step reasoning, and 7 traps where the right answer is "I cannot know" |
| Integration | Any CSV or Excel export → profiled, columns mapped (rules or AI), baseline regressions fitted, dashboard loaded |

## Results with a real model

Run on the sample workbook in `donnees/`, 26 November 2026, Gemini API:

- **Evaluation bench, `gemini-3.5-flash-lite`: 26 / 26** — 19 correct answers, 7 justified abstentions, 0 fabrications on the traps, 0 wrong abstentions.
- **Drift investigation, `gemini-4-hydrogen`:** full note in 4 turns and 13 tool calls; **100 / 100** numbers found in the tool results.
- What this shows: the tools return computed totals and explicit errors, and the model is told never to compute. That architecture makes a small, cheap model reliable. The bench does not yet separate models; open-ended tasks graded by a rubric would be the next step.

Details: [`recherche/4-resultats-ia-reelle.md`](recherche/4-resultats-ia-reelle.md).

## Try it

Open [`livrables/Tableau de bord revue énergétique - agents et prévision.html`](livrables/) in a browser, then load `donnees/SER PBI générique - valeurs figées.xlsm`. Demo mode (no AI, no network) is the default. To use a real model, paste a Gemini or Anthropic API key on the Investigation page: the key stays in the page's memory, and nothing is sent before an explicit consent that lists what leaves the machine.

## How it is built

```
livrables/            the shipped HTML files (Power BI replacement, agent prototype, current version)
donnees/              sample workbook and the corrected VBA macro of the original Excel model
moteur-original.js    the core script of the agent prototype, extracted for reading
idee-*/               one folder per module: module.js, module.css, test.js, NOTES.md
outillage/            assembler (prototype + modules + core patches → one HTML), headless test bench
recherche/            open datasets, weather and degree-day sources, energy prices and emission factors
CONTRAT.md            the contract every module follows (hooks, rules, tests)
```

```bash
outillage/tout-tester.sh .     # assemble everything and run every test suite (Node, no browser)
```

The test bench loads the real workbook into a minimal fake DOM and runs each module's tests in the page's own scope: 1,190 checks, no network allowed.

## Notes

- Baselines and drift rules come from the original Excel model; the page reproduces its calculation exactly (checked to 1e-9 on every series).
- The sample workbook is a generic template; file metadata has been cleared.
- Built with Claude Code (Anthropic) as a pair-programmer and as parallel sub-agents, each working on one module against a written contract.
