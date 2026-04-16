import { useMapStore } from '../store/useMapStore';
import { useProjectStore } from '../store/useProjectStore';
import { useAssetStore } from '../store/useAssetStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { Project, MapState, CustomAsset } from '../types/map';
import { db } from '../db/projectDB';
import { sanitizeMapState } from '../utils/project/serialization';
import JSZip from 'jszip';

export const useProjectIO = () => {
  const { showAlert } = useNotificationStore();

  const syncActiveMap = () => {
    const activeMapId = useProjectStore.getState().activeMapId;
    const currentMapState = useMapStore.getState();
    if (activeMapId) {
      useProjectStore.getState().saveMap(sanitizeMapState(currentMapState));
    }
  };

  const exportProject = () => {
    syncActiveMap();
    const project = useProjectStore.getState();
    const projectData: Project = {
      id: project.id,
      name: project.name,
      author: project.author,
      defaultGridType: project.defaultGridType,
      maps: project.maps,
      activeMapId: project.activeMapId,
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectData.name.replace(/\s+/g, '_')}_project.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importProject = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as any;
      await processProjectData(data);
    } catch (error) {
      console.error('Failed to import project:', error);
      showAlert("Import Error", `Error importing project: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    }
  };

  const importProjectBundle = async (file: File) => {
    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);
      const projectJson = await content.file('project.json')?.async('text');
      
      if (!projectJson) {
        throw new Error('project.json not found in bundle');
      }

      const data = JSON.parse(projectJson) as Project;
      
      // 1. Process project structure first to initialize the UI
      await processProjectData(data);

      // 2. Extract and restore assets
      if (data.customAssets && data.customAssets.length > 0) {
          const assetsFolder = content.folder('assets');
          if (assetsFolder) {
              for (const meta of data.customAssets) {
                  // The file should be named {id}.png
                  const assetFile = assetsFolder.file(`${meta.id}.png`);
                  const thumbFile = assetsFolder.file(`${meta.id}_thumb.png`);
                  
                  if (assetFile) {
                      const blob = await assetFile.async('blob');
                      let thumbnailBlob: Blob | undefined = undefined;
                      
                      if (thumbFile) {
                          thumbnailBlob = await thumbFile.async('blob');
                      } else if (meta.type !== 'stamp') {
                          // Fallback for old bundles
                          thumbnailBlob = blob;
                      }

                      await db.customAssets.put({
                          ...meta,
                          blob,
                          thumbnailBlob
                      } as CustomAsset);
                  } else {
                      console.warn(`Asset file ${meta.id}.png not found in bundle for ${meta.name}`);
                  }
              }
          }
          
          // Reload asset store to create new Blob URLs and refresh the UI
          await useAssetStore.getState().loadAssets();
      }

      // 3. Extract and restore fonts
      if (data.customFonts && data.customFonts.length > 0) {
          const fontsFolder = content.folder('fonts');
          if (fontsFolder) {
              for (const meta of data.customFonts) {
                  const fontFile = fontsFolder.file(`${meta.id}_font`);
                  if (fontFile) {
                      const blob = await fontFile.async('blob');
                      await db.customFonts.put({
                          ...meta,
                          blob
                      });
                  }
              }
          }
          // The App component or individual components using useCustomFonts 
          // will load these on next render/re-render.
      }
    } catch (error) {
      console.error('Failed to import bundle:', error);
      showAlert("Import Error", `Error importing bundle: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    }
  };

  const processProjectData = async (data: any) => {
    let projectData: Project;

    // Support both old single-map format and new project-bundle format
    if (data.metadata && Array.isArray(data.layers)) {
      const mapId = crypto.randomUUID();
      projectData = {
        id: crypto.randomUUID(),
        name: data.metadata.name || 'Imported Project',
        maps: [sanitizeMapState({ ...data, id: mapId })],
        activeMapId: mapId,
      };
    } else if (Array.isArray(data.maps)) {
      // New format: project with multiple maps
      projectData = {
          ...data,
          id: data.id || crypto.randomUUID(),
          name: data.name || 'Imported Project',
          maps: data.maps.map((m: any) => sanitizeMapState(m)),
          activeMapId: data.activeMapId || (data.maps.length > 0 ? data.maps[0].id : null)
      };
    } else {
      throw new Error('Invalid project file format');
    }

    // Set the full project in the Project Store
    useProjectStore.getState().setProject(projectData);

    // Initialize the Map Store with the active map (or the first one)
    const activeMap = projectData.maps.find(m => m.id === projectData.activeMapId) || projectData.maps[0];
    if (activeMap) {
      useMapStore.getState().resetState({
        ...activeMap,
        selectedAssetIds: [],
        selectedRoomId: null,
      } as any);
    }
  };

  const triggerImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        importProject(file);
      }
    };
    input.click();
  };

  const triggerBundleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        importProjectBundle(file);
      }
    };
    input.click();
  };

  return {
    syncActiveMap,
    exportProject,
    importProject,
    triggerImport,
    triggerBundleImport,
  };
};
