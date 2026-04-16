import { useMapStore } from '../store/useMapStore';
import { Asset, PointLight, WallSegment, Room } from '../types/map';

export interface Command {
  execute(): void;
  undo(): void;
}

export class MoveAssetCommand implements Command {
  private oldPos: { x: number, y: number };
  constructor(
    private assetId: string,
    private newPos: { x: number, y: number }
  ) {
    const asset = useMapStore.getState().assets.find(a => a.id === assetId);
    this.oldPos = { x: asset?.x || 0, y: asset?.y || 0 };
  }

  execute() {
    useMapStore.getState().updateAsset(this.assetId, this.newPos);
  }

  undo() {
    useMapStore.getState().updateAsset(this.assetId, this.oldPos);
  }
}

export class TransformAssetCommand implements Command {
  private oldProps: any;
  constructor(
    private assetId: string,
    private newProps: any
  ) {
    const asset = useMapStore.getState().assets.find(a => a.id === assetId);
    this.oldProps = { 
        x: asset?.x, 
        y: asset?.y, 
        rotation: asset?.rotation, 
        scale: asset?.scale,
        properties: { ...asset?.properties }
    };
  }

  execute() {
    useMapStore.getState().updateAsset(this.assetId, this.newProps);
  }

  undo() {
    useMapStore.getState().updateAsset(this.assetId, this.oldProps);
  }
}

export class AddAssetCommand implements Command {
  constructor(private asset: Asset) {}
  execute() {
    useMapStore.getState().addAsset(this.asset);
  }
  undo() {
    useMapStore.getState().removeAsset(this.asset.id);
  }
}

export class RemoveAssetCommand implements Command {
  private asset: Asset | undefined;
  constructor(private assetId: string) {
    this.asset = useMapStore.getState().assets.find(a => a.id === assetId);
  }
  execute() {
    useMapStore.getState().removeAsset(this.assetId);
  }
  undo() {
    if (this.asset) useMapStore.getState().addAsset(this.asset);
  }
}
