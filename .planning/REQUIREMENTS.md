# V3-PRO Milestone Requirements

## Functional Requirements

### 1. Intelligent Tiling System (Core)
- **Three Categories:** Stamps/Props, Walls, and Ground/Terrain.
- **Auto-Tiling:** Professional 8-direction bitmask (8-bit) or hybrid Wang Tiles (47-tile) system for Walls and Ground.
- **Wall Tool:** Real-time auto-tiling for straight and diagonal lines with automatic cornering and intersections (T-junctions, cross-junctions, ends).
- **Terrain/Ground Tool:** Brush and Area tools for painting terrain with automatic smooth transitions and organic edges.
- **Stamp Tool:** Free-form placement (no grid snap), rotation, and advanced free transformation (multi-directional, proportional).

### 2. Advanced Lighting & Visual Effects
- **Point Lights:** Real-time ray-tracing that respects wall boundaries (no light leakage through walls).
- **Light Properties:** Adjustable color, radius, and intensity.
- **Shadows:** Configurable drop shadows for stamps (opacity, diffusion, distance, direction).
- **Post-Processing:** Brightness, contrast, and sepia adjustments per layer.
- **Atmosphere:** Global atmosphere layer as a manageable object.

### 3. Asset Management
- **Universal Import:** Drag-and-drop PNG support with transparency.
- **Classification:** Categorize imported assets as Stamp, Wall Tileset, or Ground Tileset.
- **Default Bundle:** Pre-loaded "hand-drawn" (ink line) tileset bundle (Walls, Grounds, and at least 25 Props).
- **Organization:** Categorize assets by theme (Forest, Dungeon, City, Tavern, etc.).

### 4. Professional UX & Tooling
- **Layers & Objects:** Drag-and-drop management, renaming, duplicating, and visibility toggling.
- **Multi-map Support:** Side panel for managing multiple maps (create, rename, delete, duplicate).
- **Grid System:** Support for Square and Hex grids with full map-boundary respect.
- **Undo/Redo:** Robust Command Pattern with at least 100-action history.
- **Theming:** Dark mode by default + 4 additional themes (Dracula, Comic, Light, High-Contrast).

### 5. Export & Storage
- **High-Res Images:** PNG/JPG/WebP export at 300 DPI+ for printing.
- **Multi-page PDF:** Optimized PDF output for large maps.
- **VTT Export:** Universal VTT (dd2vtt) metadata support.
- **ZIP Bundles:** Project export/import including all custom assets.
- **Local Storage:** Automated session persistence (localStorage + IndexedDB).

## Non-Functional Requirements
- **Performance:** Optimized rendering using off-screen canvas, dirty-rect updates, and web workers for heavy tiling calculations.
- **Scalability:** Maintain performance with large maps and hundreds of objects.
- **Code Quality:** Clean Architecture, strict TypeScript typing, and modular design.
- **Accessibility:** High-contrast theme support.
