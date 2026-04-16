import JSZip from 'jszip';
import { Project, CustomAsset } from '../../types/map';
import { db } from '../../db/projectDB';

/**
 * Exports the entire project state and assets into a .zip bundle.
 * @param project The current Project to export.
 */
export const exportProjectBundle = async (project: Project) => {
  const zip = new JSZip();

  // 1. Fetch custom assets and fonts from DB
  const assets = await db.customAssets.toArray();
  const fonts = await db.customFonts.toArray();
  
  // 2. Prepare project data with metadata
  const projectWithData: Project = {
    id: project.id,
    name: project.name,
    author: project.author,
    defaultGridType: project.defaultGridType,
    activeMapId: project.activeMapId,
    maps: project.maps,
    customAssets: assets.map(a => {
        const { blob, thumbnailBlob, previewUrl, ...meta } = a;
        return meta;
    }),
    customFonts: fonts.map(f => {
        const { blob, ...meta } = f;
        return meta;
    })
  };

  // 3. Add project.json
  zip.file('project.json', JSON.stringify(projectWithData, null, 2));

  // 4. Add custom asset blobs to assets/ folder
  const assetsFolder = zip.folder('assets');
  if (assetsFolder) {
      for (const asset of assets) {
          if (asset.blob) {
            assetsFolder.file(`${asset.id}.png`, asset.blob);
          }
          if (asset.thumbnailBlob) {
            assetsFolder.file(`${asset.id}_thumb.png`, asset.thumbnailBlob);
          }
      }
  }

  // 5. Add custom font blobs to fonts/ folder
  const fontsFolder = zip.folder('fonts');
  if (fontsFolder) {
      for (const font of fonts) {
          if (font.blob) {
            fontsFolder.file(`${font.id}_font`, font.blob);
          }
      }
  }
  
  // 6. Generate the zip blob
  const content = await zip.generateAsync({ 
      type: 'blob',
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
  });

  // 6. Trigger download
  const fileName = `${project.name.replace(/\s+/g, '_') || 'project'}-bundle.zip`;
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Delay revocation to ensure download started
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
