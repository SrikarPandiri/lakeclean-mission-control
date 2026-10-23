# LakeClean Mission Control — Operational Methodology

## 1. Explainable Priority Scoring

Urban water bodies experience dynamic waste inflows influenced by human recreational activity, street stormwater culverts, and wind currents. To prioritize where an autonomous cleaning boat should be dispatched, LakeClean calculates an explainable, normalized Priority Score ($P \in [0, 100]$):

$$ P = w_{\text{sev}} \times S + w_{\text{den}} \times D + w_{\text{fresh}} \times F + w_{\text{run}} \times R $$

### Factor Definitions

1. **Severity Score ($S \in [0, 100]$, default weight $0.35$):**
   - Assesses the entangling danger and ecological persistence of the waste.
   - Example: Heavy agricultural film or packaging receives high severity; organic twigs receive low severity.

2. **Waste Density Score ($D \in [0, 100]$, default weight $0.25$):**
   - Surface concentration per unit water area (e.g., items trapped per $100\,\text{m}^2$).

3. **Observation Freshness ($F \in [0, 100]$, default weight $0.20$):**
   - Observations decay over time due to drift and water currents:
     - $\le 6$ hours: $100$
     - $\le 24$ hours: $85$
     - $\le 48$ hours: $70$
     - $\le 7$ days: $50$
     - $\le 14$ days: $30$
     - $> 14$ days: $15$

4. **Runoff Exposure ($R \in [0, 100]$, default weight $0.20$):**
   - Proximity to urban culverts and vulnerability to rainfall-driven surge.

### Transparent Fallback Handling
If a factor (such as runoff or freshness) is missing, the system does not invent fraudulent sensor data. It applies a documented default (e.g. $50.0$ baseline) and logs the attribution explicitly in the calculation metadata.

---

## 2. Capacity-Aware Route Planning Heuristic

Finding an optimal cleaning path across lake sectors is modeled as a constrained variant of the Traveling Salesperson Problem (TSP) with return-to-berth constraints:

1. **Departure:** Boat starts at the launch dock berth $(lat_{\text{dock}}, lng_{\text{dock}})$.
2. **Next Sector Selection:** Evaluates candidate unvisited zones using a priority-distance objective:
   $$ \text{Utility}(z) = \frac{P(z)^{1.15}}{10 \times (d(\text{current}, z) + 0.08)} $$
3. **Sector Cleaning Pattern:** Upon arrival at a zone centroid, cleaning sweep waypoints are generated to simulate skimming maneuvers.
4. **Dock Return:** A final waypoint guides the boat back to the home dock slip for battery charging and waste discharge.

---

## 3. Physical Safety & Resource Constraints

A route plan is checked against three strict feasibility constraints before approval:

1. **Battery Reserve Constraint:**
   $$ \text{Final Battery} = \text{Initial Battery} - (\text{Distance} \times \text{Drain Rate}) - (N_{\text{zones}} \times \text{Drain Rate}_{\text{clean}}) $$
   If $\text{Final Battery} < \text{Battery Reserve}$ (e.g. $20\%$), the plan is **INFEASIBLE**.

2. **Collection Bin Capacity Constraint:**
   $$ \text{Projected Fill} = \text{Initial Fill} + \frac{\sum \text{Waste}_{\text{zone}}}{\text{Max Capacity}} \times 100 $$
   If $\text{Projected Fill} > 100\%$, the plan is **INFEASIBLE**.

3. **Restricted Sanctuary Constraint:**
   Any plan routing through protected wildlife or hazardous navigation sectors is flagged as **INFEASIBLE**.
