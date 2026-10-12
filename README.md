# Conveyor Flow Lab

A self-contained HTML conveyor layout editor and deterministic flow simulation. Open dist/index.html directly, or serve it as a static site. No build, dependencies, network calls, or account integration.

## GitHub Pages

The included GitHub Actions workflow tests the simulation and publishes the contents of `dist/` to GitHub Pages whenever `main` changes. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. The deployed app remains a self-contained, offline-capable HTML file.

Includes transport, accumulation, gravity, curves, 90-degree transfers, bidirectional transfers, merges, diverters, case sources, empty tote inducts, and discharge processes. Browser-local automatic saving, validated JSON import/export, results CSV, and self-contained HTML download.

Simulation uses 0.05-second timesteps, physical item lengths and spacing, finite buffers, conveyor travel time, source queues, process cycles, downstream backpressure, recurring stops, fair merge arbitration, and weighted or available-output routing. Drawing is schematic; component parameters determine physics. Consult the in-app Guide for assumptions.


## Tote workflow

Item sources support cases, empty totes, and prefilled totes. Assign a first destination when inducting empties. Transfers have editable unique routing IDs and a destination exit (L/R/S). A tote routes to its destination along connected paths; when a destination transfer is reached, it uses that exit. Pick stations assign the next destination after a partial pick, or a packing destination when full.

Accumulation sections can expose a side RE input on either side at a selected zone. Reinduction reserves physical space and waits if the zone is blocked. Each incoming RE connection has an optional wait-for-space rule: by default, two consecutive zones must be empty before releasing a tote. The window includes the receiving zone and an upstream buffer; near the inlet it extends downstream. Full item footprints count as occupied, and competing returns check the gap after each insertion. New RE links enable this rule; older imported layouts retain their original spacing behavior until it is enabled. The picker holds the tote while waiting, including in step mode.

Step mode holds pick and pack stations for operator confirmation. Frame time is zone length / belt speed in seconds, with a selectable reference conveyor or custom interval. Click items or use the Items tab to inspect labeled content contributions, fill, destination, and movement history. Manual picks set total fill and the next destination; packout converts the tote to an order retaining its contents. Recent discharged items remain inspectable. Item CSV exports include contents and history.

Use the “Tote workflow · manual picks + reinduction” example to try this. Set its source rate to zero for fully manual induction. Source injection and tote actions preserve the current run. Physical geometry and topology edits reset it.

Flow model verification: `node tests/tote-workflow.cjs`. Checks cover manual holds, partial destination validation, duplicate-pick prevention, destination routing, two side reinductions, packing contents, automatic routing, exact fractional frame duration, and item conservation. Browser interaction QA was unavailable in the build environment.

Reinduction gap verification: `node tests/reinduct-space.cjs`. Checks cover picker holds, full-footprint occupancy, toggling the rule off, atomic competing returns, gap placement at the inlet, impossible gap sizes, and compatibility with existing JSON layouts.

## Fullness gates, selection and pick decisions

Each RE connection can also require a monitored section to be at or below / at or above a configured percentage. Choose the receiving accumulation conveyor, the feeding section (including a pick station), or another conveyor or pick/pack station. Choose the measurement explicitly: occupancy or lead tote contents fill. Accumulation occupancy counts occupied full zones using complete item footprints; other conveyor occupancy uses occupied item pitch divided by physical path length, capped at 100%. Pick occupancy is totes held / configured tote capacity: three totes at a four-tote station read 75%. Pack stations have one service slot, so occupancy is 0% when empty and 100% when occupied. Contents fill uses the front tote's fill percentage; a section with no tote has no reading and waits. The reading is taken before insertion. Both the fullness rule and the empty-zone rule must pass when enabled. Changes apply to the current run, and existing layouts default to occupancy.

Pick stations have a configurable capacity of 1–200 totes, including the active tote and queue. Defaults stay at one tote. Processing is serial in arrival order, so extra slots add buffering without adding pickers or increasing the service rate. A finished front tote still occupies a slot while waiting for reinduction; later totes wait behind it. Step mode offers only the ready front tote for manual picking. All held totes can be inspected in the schematic or Items view. Capacity edits preserve the current run, and shrinking below the number currently held is rejected. Copy/paste and layout JSON preserve capacity.

Shift-click toggles sections in the selection; Shift-drag on empty grid adds sections within the rectangle. Drag a selected section to move the entire group, preserving relative spacing. Ctrl+A selects all; Ctrl+C / Ctrl+V copy and paste; Ctrl+D duplicates; Ctrl+X cuts; Delete removes; Ctrl+Z undoes. Toolbar buttons provide copy, paste and duplicate. Copy includes internal connections and remaps internal destinations, pick assignments and monitored conveyors. Names stay identical; identifiers stay unique. This clipboard operates within the current builder tab.

Tote sources and inducts offer an ordered pick-area probability editor. Configure a station, its arrival divert and an independent 0–100% probability per area. Percentages need not sum to 100: several areas, one area or no areas can be selected for the same tote. Sampling is repeatable for a given layout and tote ID. Configure packing after the assigned areas and a separate destination for totes with no picks. Each station retains its configurable fill contribution. The new probability example demonstrates two optional areas and a separate unused-tote discharge; packing accepts 50% or greater fill in that example.

In Step mode, each probability-generated tote must have its selected areas reviewed before induction. Every ready pick and packout also requires confirmation. A visible queue lists all pending decisions. Both Advance frame and +60 seconds leave time unchanged while any decision is unresolved, and stop within an interval when a new decision appears. The interface reports the actual elapsed seconds if a frame stops early. Cycles can advance until manual work becomes ready. Continuous mode processes the same itinerary automatically.

Verification: `node tests/pick-decisions.cjs` checks fullness gates, probabilities, simultaneous decisions, pause timing, complete itineraries, conservation and import validation. `node tests/editor-actions.cjs` exercises actual editor handlers with a DOM mock, including selection, group movement, clipboard reference remapping, name preservation, undo, live edits and both time-button guards. These checks do not replace browser interaction QA, which remains unavailable in this environment.

Layout checks now flag case sources whose enabled, material-filtered paths lead to tote-only picking, sources with no directed path to discharge, and workstations unreachable from every source. Source inspectors also call out the case/tote mismatch directly; the bottleneck report identifies cases routed toward tote-only stations. These are diagnostic warnings: they preserve the configured material and connections. `node tests/routing-warnings.cjs` verifies mismatch detection, filters, reachability and a valid tote layout.

`node tests/pick-fullness-monitor.cjs` verifies feeder and other station selection, occupied/empty slots, tote-fill thresholds above/below/equality, missing readings, hold/release, combined gap conditions and JSON compatibility.

`node tests/pick-capacity.cjs` checks admission limits, fractional station occupancy, FIFO order with mixed tote lengths, serial service, step-mode queue actions, occupancy-based reinduct release, downstream gap checks and legacy defaults. Editor tests also cover live capacity edits, occupied-slot protection and separate queue visuals.
