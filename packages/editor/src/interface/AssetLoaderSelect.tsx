import { AssetLoader } from "@my/engine"
import React from "react"

type Props<T extends AssetLoader<any>> = {
  currentAssetLoader: T
  selectableAssetLoaders: Map<string, T>
}

export function AssetLoaderSelect<T extends AssetLoader<any>>({
  currentAssetLoader,
  selectableAssetLoaders,
}: Props<T>) {
  /*return (
    <div className="dropdown">
      <div tabIndex={0} role="button" className="btn m-1">
        {currentAssetLoader.displayName}
      </div>
      <ul tabIndex={0} className="z-1 menu dropdown-content w-52 rounded-box bg-base-100 p-2 shadow-sm">
        {Object.entries(selectableAssetLoaders).map(([id, assetLoader]) => (
          <li>{assetLoader}</li>
        ))}
      </ul>
    </div>

  )*/
  return (
    <div>
      <button className="btn" popoverTarget="popover-1" style={{ anchorName: "--anchor-1" } as React.CSSProperties}>
        Button
      </button>

      <ul
        className="menu dropdown rounded-box bg-base-100 w-52 shadow-sm"
        popover="auto"
        id="popover-1"
        style={{ positionAnchor: "--anchor-1" } as React.CSSProperties}
      >
        <li>
          <a>Item 1</a>
        </li>
        <li>
          <a>Item 2</a>
        </li>
      </ul>
    </div>
  )
}
