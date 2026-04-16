import JSZip from 'jszip';
import { db } from '../../db/projectDB';
import { RemoteManifest } from '../../types/library';
import { useNotificationStore } from '../../store/useNotificationStore';

interface ExportMetadata {
  name: string;
  author: string;
  version: string;
  license: string;
}

/**
 * Exports all custom assets in a format compatible with the COMMUNITY / remote catalog.
 */
export const exportCommunityAssets = async (metadata: ExportMetadata) => {
  const { showAlert } = useNotificationStore.getState();
  const zip = new JSZip();
  const assets = await db.customAssets.toArray();
  const fonts = await db.customFonts.toArray();

  if (assets.length === 0 && fonts.length === 0) {
    showAlert("Export Pack", "No custom assets or fonts found in your library to export.", "warn");
    return;
  }

  // 1. Prepare Manifest
  const manifest: RemoteManifest = {
    name: metadata.name,
    author: metadata.author,
    version: metadata.version,
    license: metadata.license,
    baseUrl: "./assets/", // Placeholder, used during remote loading
    assets: assets.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      category: a.category,
      path: `${a.id}.png`,
      thumbnailPath: (a.type !== 'stamp' && a.thumbnailBlob) ? `${a.id}_thumb.png` : undefined,
      tiling: a.tilingMetadata ? {
        tileSize: a.tilingMetadata.tileSize,
        quadrantSize: a.tilingMetadata.quadrantSize,
        importMode: a.tilingMetadata.importMode,
        bitmaskMap: a.tilingMetadata.bitmaskMap
      } : undefined
    })),
    fonts: fonts.map(f => ({
      id: f.id,
      name: f.name,
      family: f.family,
      path: `fonts/${f.id}_font`
    }))
  };

  // 2. Add manifest.json
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // 3. Add asset blobs to an 'assets' folder
  const assetsFolder = zip.folder('assets');
  if (assetsFolder) {
    for (const asset of assets) {
      // Main asset (Atlas for terrain/wall, Image for stamp)
      assetsFolder.file(`${asset.id}.png`, asset.blob);
      
      // Original thumbnail (Only for tiling assets)
      if (asset.type !== 'stamp' && asset.thumbnailBlob) {
        assetsFolder.file(`${asset.id}_thumb.png`, asset.thumbnailBlob);
      }
    }

    // 4. Add font blobs to a 'fonts' subfolder inside 'assets'
    if (fonts.length > 0) {
      const fontsFolder = assetsFolder.folder('fonts');
      if (fontsFolder) {
        for (const font of fonts) {
          fontsFolder.file(`${font.id}_font`, font.blob);
        }
      }
    }
  }

  // 5. Generate and download
  const content = await zip.generateAsync({ 
    type: 'blob',
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${metadata.name.replace(/\s+/g, '_')}-${Date.now()}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  const assetCount = assets.length > 0 ? `${assets.length} assets` : '';
  const fontCount = fonts.length > 0 ? `${fonts.length} fonts` : '';
  const sep = (assets.length > 0 && fonts.length > 0) ? ' and ' : '';
  
  showAlert("Success", `Packaged ${assetCount}${sep}${fontCount} into "${metadata.name}".`, "success");
};
