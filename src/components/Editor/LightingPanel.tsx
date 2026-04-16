import React from 'react';
import { useMapStore } from '../../store/useMapStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { GlobalLighting, PointLight } from '../../types/map';
import { Sun, Plus, Trash2, Lightbulb, Compass } from 'lucide-react';

export const LightingPanel: React.FC = () => {
  const lighting = useMapStore((state) => state.lighting);
  const metadata = useMapStore((state) => state.metadata);
  const activeLayerId = useMapStore((state) => state.activeLayerId);
  const updateGlobalLighting = useMapStore((state) => state.updateGlobalLighting);
  const updateAtmosphere = useMapStore((state) => state.updateAtmosphere);
  const addPointLight = useMapStore((state) => state.addPointLight);
  const updatePointLight = useMapStore((state) => state.updatePointLight);
  const removePointLight = useMapStore((state) => state.removePointLight);
  const { showAlert } = useNotificationStore();

  const atmosphere = lighting.atmosphere || { enabled: false, vignette: 0.5, noise: 0.1, colorGrading: '#ffffff' };

  const handleGlobalColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateGlobalLighting({ color: e.target.value });
  };

  const handleGlobalIntensityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateGlobalLighting({ intensity: parseFloat(e.target.value) });
  };

  const handleGlobalBlendModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateGlobalLighting({ blendMode: e.target.value });
  };

  const handleSunToggle = () => {
    updateGlobalLighting({ sunEnabled: !lighting.global.sunEnabled });
  };

  const handleSunDirectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateGlobalLighting({ sunDirection: parseInt(e.target.value) });
  };

  const handleSunIntensityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateGlobalLighting({ sunIntensity: parseFloat(e.target.value) });
  };

  const handleAddLight = () => {
    if (!activeLayerId) {
      showAlert("Missing Layer", "Please select a layer in the Object Tree before adding a light source.", "warn");
      return;
    }
    const newLight: PointLight = {
      id: crypto.randomUUID(),
      layerId: activeLayerId,
      x: metadata.resolution.width / 2,
      y: metadata.resolution.height / 2,
      color: '#ffffff',
      radius: 300,
      intensity: 1,
      visible: true,
      locked: false
    };
    addPointLight(newLight);
  };

  return (
    <div className="flex flex-col h-full bg-panel p-4 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-2 mb-6">
        <Sun className="w-5 h-5 text-orange-500" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-main">Environment</h2>
      </div>

      {/* Atmosphere FX */}
      <section className="mb-8 space-y-4 border-b border-theme pb-6">
        <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase text-muted tracking-wider">Atmosphere FX</h3>
            <button
                onClick={() => updateAtmosphere({ enabled: !atmosphere.enabled })}
                className={`p-1.5 rounded-md transition-all shadow-lg ${
                    atmosphere.enabled 
                        ? 'bg-red-900/40 text-red-400 hover:bg-red-900/60' 
                        : 'bg-orange-600 hover:bg-orange-500 text-white'
                }`}
            >
                {atmosphere.enabled ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
        </div>

        {atmosphere.enabled && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <label className="text-[10px] font-bold uppercase text-muted">Vignette</label>
                        <span className="text-[10px] font-mono text-main">{Math.round(atmosphere.vignette * 100)}%</span>
                    </div>
                    <input
                        type="range" min="0" max="1" step="0.05" value={atmosphere.vignette}
                        onChange={(e) => updateAtmosphere({ vignette: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <label className="text-[10px] font-bold uppercase text-muted">Grain / Noise</label>
                        <span className="text-[10px] font-mono text-main">{Math.round(atmosphere.noise * 100)}%</span>
                    </div>
                    <input
                        type="range" min="0" max="1" step="0.05" value={atmosphere.noise}
                        onChange={(e) => updateAtmosphere({ noise: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted block">Color Grading</label>
                    <input
                        type="color" value={atmosphere.colorGrading}
                        onChange={(e) => updateAtmosphere({ colorGrading: e.target.value })}
                        className="w-full h-8 rounded bg-black/20 border-theme cursor-pointer"
                    />
                </div>
            </div>
        )}
      </section>

      {/* Global Lighting */}
      <section className="mb-8 space-y-4 border-b border-theme pb-6">
        <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase text-muted tracking-wider">Ambient Tint</h3>
            <button
                onClick={() => updateGlobalLighting({ enabled: !lighting.global.enabled })}
                className={`p-1.5 rounded-md transition-all shadow-lg ${
                    lighting.global.enabled 
                        ? 'bg-red-900/40 text-red-400 hover:bg-red-900/60' 
                        : 'bg-orange-600 hover:bg-orange-500 text-white'
                }`}
                title={lighting.global.enabled ? "Remove Global Lighting" : "Add Global Lighting"}
            >
                {lighting.global.enabled ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
        </div>
        
        {lighting.global.enabled && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted block">Tint Color</label>
                <div className="flex gap-2">
                    <input
                    type="color"
                    value={lighting.global.color}
                    onChange={handleGlobalColorChange}
                    className="w-full h-8 rounded bg-black/20 border-theme cursor-pointer"
                    />
                </div>
                </div>

                <div className="space-y-2">
                <div className="flex justify-between">
                    <label className="text-[10px] font-bold uppercase text-muted">Intensity</label>
                    <span className="text-[10px] font-mono text-main">{lighting.global.intensity.toFixed(2)}</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={lighting.global.intensity}
                    onChange={handleGlobalIntensityChange}
                    className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                </div>

                <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted block">Blend Mode</label>
                <select
                    value={lighting.global.blendMode}
                    onChange={handleGlobalBlendModeChange}
                    className="w-full h-8 px-2 rounded bg-black/20 text-xs border border-theme outline-none focus:border-orange-500 text-main font-bold uppercase"
                >
                    <option value="multiply">Multiply (Day/Night)</option>
                    <option value="screen">Screen (Fog/Mist)</option>
                    <option value="overlay">Overlay (Atmosphere)</option>
                    <option value="source-over">Normal</option>
                </select>
                </div>
            </div>
        )}
      </section>

      {/* Global Sun (Directional Shadow) */}
      <section className="mb-8 space-y-4 border-b border-theme pb-6">
        <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase text-muted tracking-wider">Directional Shadows</h3>
            <button
                onClick={handleSunToggle}
                className={`p-1.5 rounded-md transition-all shadow-lg ${
                    lighting.global.sunEnabled 
                        ? 'bg-red-900/40 text-red-400 hover:bg-red-900/60' 
                        : 'bg-orange-600 hover:bg-orange-500 text-white'
                }`}
            >
                {lighting.global.sunEnabled ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
        </div>

        {lighting.global.sunEnabled && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase text-muted flex items-center gap-1.5">
                            <Compass className="w-3 h-3" /> Direction
                        </label>
                        <span className="text-[10px] font-mono text-main">{lighting.global.sunDirection}°</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="360"
                        step="1"
                        value={lighting.global.sunDirection}
                        onChange={handleSunDirectionChange}
                        className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <label className="text-[10px] font-bold uppercase text-muted">Shadow Intensity</label>
                        <span className="text-[10px] font-mono text-main">{lighting.global.sunIntensity.toFixed(2)}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={lighting.global.sunIntensity}
                        onChange={handleSunIntensityChange}
                        className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                </div>
            </div>
        )}
      </section>

      {/* Point Lights */}
      <section className="space-y-4 pb-6 border-b border-theme mb-8">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase text-muted tracking-wider">Point Lights</h3>
          <button
            onClick={handleAddLight}
            className="p-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-md transition-colors shadow-lg"
            title="Add Point Light"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {lighting.pointLights.map((light) => (
            <div key={light.id} className="p-3 bg-black/20 border border-theme rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-[10px] font-bold uppercase text-main">Light Source</span>
                </div>
                <button
                  onClick={() => removePointLight(light.id)}
                  className="text-muted hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] text-muted uppercase font-bold">Radius</label>
                  <input
                    type="number"
                    value={light.radius}
                    onChange={(e) => updatePointLight(light.id, { radius: parseInt(e.target.value) || 0 })}
                    className="w-full h-7 px-2 bg-black/40 border border-theme rounded text-[10px] text-main font-bold outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-muted uppercase font-bold">Intensity</label>
                  <input
                    type="number"
                    step="0.1"
                    value={light.intensity}
                    onChange={(e) => updatePointLight(light.id, { intensity: parseFloat(e.target.value) || 0 })}
                    className="w-full h-7 px-2 bg-black/40 border border-theme rounded text-[10px] text-main font-bold outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-muted uppercase font-bold">Color</label>
                <input
                  type="color"
                  value={light.color}
                  onChange={(e) => updatePointLight(light.id, { color: e.target.value })}
                  className="w-full h-6 rounded bg-black/40 border border-theme cursor-pointer"
                />
              </div>
            </div>
          ))}

          {lighting.pointLights.length === 0 && (
            <div className="py-8 text-center border-2 border-dashed border-theme rounded-lg bg-black/10">
              <p className="text-[10px] text-muted uppercase font-bold tracking-tighter">No light sources added</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
