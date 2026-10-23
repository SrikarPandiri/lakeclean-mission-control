# LakeClean Mission Control — Prior Art & Technical Differentiation Analysis

> [!IMPORTANT]
> This document records candidate research directions and preliminary prior art investigations for an academic environmental engineering project. This is not a formal legal patent search, legal freedom-to-operate opinion, or confirmation of patentable novelty. Professional patent counsel is required for formal intellectual property assessment.

---

## 1. Candidate Technical Research Direction

**Title:** Evidence-driven, capacity-aware adaptive mission planning for small-lake cleaning boats.

**Investigation Objective:**
Explore whether the closed-loop combination of:
1. Multi-factor waste observation confidence & freshness decay,
2. Dynamic battery reserve and physical collection-bin fill constraints,
3. Heuristic return-to-dock route generation, and
4. Interactive pre-flight feasibility validation
offers measurable operational efficiency improvements for small autonomous water-cleaning platforms operating in constrained urban lakes.

---

## 2. Prior Art Investigation Template & Log

### Entry 1: Urban Floating Waste Cleanup Vessels (Commercial Benchmark)
- **Product / System:** Ocean Cleanup Interceptor / Urban Skimmer Boats (e.g. RanMarine WasteShark)
- **Publication / Source Link:** Publicly available product specifications (ranmarine.io / theoceancleanup.com)
- **Publication Date:** ~2018–2023
- **Existing Functionality:** Remote-controlled or basic waypoint-patrol catamarans that sweep harbors and marinas for floating debris.
- **Similarities to Our Project:** Uses a surface-skimming vessel to collect floating plastic and packaging into an onboard collection basket.
- **Difference We Wish to Investigate:** Commercial skimmers typically execute fixed pre-programmed lawnmower sweep patterns or manual teleoperation. We investigate capacity-aware, priority-weighted routing that adapts pathing to dynamic crowd-sourced/drone observations and verifies battery reserve before departure.
- **Unanswered Technical Question:** Does prioritizing high-density clusters dynamically save measurable battery kilowatt-hours compared to standard lawnmower patrol sweeps?
- **Further Verification Needed:** Physical field trials comparing battery consumption per kilogram of debris collected under both strategies.

---

### Entry 2: Autonomous Surface Vehicle (ASV) Path Planning Research
- **Publication / Source Link:** IEEE Transactions on Robotics & Automation / Environmental Monitoring ASV Literature
- **Publication Date:** 2015–2025
- **Existing Functionality:** Coverage path planning (CPP) algorithms for robotic boats conducting bathymetric surveying or water sampling.
- **Similarities to Our Project:** Formulates coverage and point-to-point navigation across polygon lake boundaries.
- **Difference We Wish to Investigate:** Surveying ASVs aim for uniform sensor coverage over an entire lake area without physical payload collection. Our focus is non-uniform coverage with physical payload weight limits (bin capacity) and asymmetric battery drain during skimming.
- **Unanswered Technical Question:** How quickly does waste re-accumulate after a mission, and how does observation freshness decay affect route optimality?
- **Further Verification Needed:** Empirical drift velocity measurements in urban lakes with variable wind and stormwater inflows.

---

## 3. Prior Art Record Sheet Template (For Team Contributions)

Use this template when logging newly discovered patents, academic publications, or commercial systems:

```markdown
### Entry [Number]: [System / Patent / Paper Name]
- **Existing Patent or Product:** 
- **Publication or Source Link:** 
- **Publication Date:** 
- **Existing Functionality:** 
- **Similarities to Our Project:** 
- **Difference We Wish to Investigate:** 
- **Unanswered Technical Question:** 
- **Further Verification Needed:** 
```
