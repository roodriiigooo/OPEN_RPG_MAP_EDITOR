# V3-PRO Development Roadmap

## Phase 1: Core Tiling & Foundation Refinement
- **Task 1.1:** Define TypeScript interfaces for the new tiling system (TileType, Tileset, TileData, NeighborMask).
- **Task 1.2:** Implement core auto-tiling logic (calculateNeighborMask, getBestTileVariant).
- **Task 1.3:** Refactor MapStore (Zustand) to support the new tiling structures and classify assets.
- **Task 1.4:** Update Undo/Redo (Command Pattern) for tiling actions.

## Phase 2: Professional Wall & Terrain Tools
- **Task 2.1:** Implement the Wall Tool with real-time 8-direction auto-tiling.
- **Task 2.2:** Implement the Terrain Brush and Area tools with organic edge transitions.
- **Task 2.3:** Enhance the Stamp Tool with advanced free transformation and rotation.
- **Task 2.4:** Integrate the new tools into the SidebarTools and PropertiesPanel.

## Phase 3: Advanced Lighting & Visual Effects
- **Task 3.1:** Implement Point Light ray-tracing that respects wall boundaries.
- **Task 3.2:** Develop shadow projection for stamps with configurable properties.
- **Task 3.3:** Add atmosphere as a manageable layer object.
- **Task 3.4:** Implement per-layer post-processing effects (brightness, contrast, etc.).

## Phase 4: Asset Engine & Standard Bundle
- **Task 4.1:** Develop the Asset Motor with drag-and-drop PNG import and classification.
- **Task 4.2:** Integrate the "hand-drawn" (ink line) tileset bundle as default assets.
- **Task 4.3:** Categorize assets by theme and implement basic asset organization.

## Phase 5: Professional UX, Export & Storage
- **Task 5.1:** Implement multi-map management (create, rename, delete, duplicate).
- **Task 5.2:** Enhance layer and object management with drag-and-drop and renaming.
- **Task 5.3:** Finalize Export options: 300 DPI+ Images, Multi-page PDF, Universal VTT.
- **Task 5.4:** Implement ZIP bundle import/export for project sharing.
- **Task 5.5:** Apply project-wide themes (Dracula, Comic, Light, High-Contrast).

## Phase 6: Performance Optimization & Validation
- **Task 6.1:** Implement off-screen canvas and dirty-rect updates for performance.
- **Task 6.2:** Move heavy calculations to Web Workers.
- **Task 6.3:** Comprehensive validation of UX and tool organization as a professional editor.
- **Task 6.4:** Generate example props, walls, terrain, and tilesets for use as a template in the project, according to the description in the base documentation (handmade and more), so that the user can understand how to create their own assets.
- **Task 6.5:** Separate each tile, prop, or object into its proper tool in the toolbox.