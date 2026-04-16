import { MapState } from '../../types/map';
import { TileType } from '../../types/tiling';

export const exportToUniversalVTT = (mapState: MapState) => {
  const { metadata, grid, lighting, tiles, walls } = mapState;
  const { width, height } = metadata.resolution;
  const ppi = grid.size; // Pixels per grid unit

  // 1. LOS from Grid Tiles
  const wallTiles = tiles.filter(t => t.type === TileType.WALL);
  const gridLos = wallTiles.map(t => {
    const x = t.x * ppi;
    const y = t.y * ppi;
    return [
      [{ x, y }, { x: x + ppi, y }],
      [{ x: x + ppi, y }, { x: x + ppi, y: y + ppi }],
      [{ x: x + ppi, y: y + ppi }, { x, y: y + ppi }],
      [{ x, y: y + ppi }, { x, y }]
    ];
  }).flat();

  // 2. LOS from Manual Walls
  const manualLos: any[] = [];
  walls.forEach(wall => {
    wall.points.forEach(path => {
      for (let i = 0; i < path.length - 3; i += 2) {
        manualLos.push([
          { x: path[i], y: path[i+1] },
          { x: path[i+2], y: path[i+3] }
        ]);
      }
    });
  });

  const los = [...gridLos, ...manualLos];

  const vttData = {
    format: 0.2,
    resolution: {
      x: width,
      y: height,
      map_origin: { x: 0, y: 0 },
      map_size: {
        x: width / ppi,
        y: height / ppi,
      },
      pixels_per_grid: ppi,
    },
    line_of_sight: los,
    portals: [],
    lights: lighting.pointLights.map((light) => ({
      position: { x: light.x, y: light.y },
      range: light.radius / ppi,
      intensity: light.intensity,
      color: light.color.replace('#', ''),
    })),
  };

  const blob = new Blob([JSON.stringify(vttData, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${metadata.name.replace(/\s+/g, '_')}.dd2vtt`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
