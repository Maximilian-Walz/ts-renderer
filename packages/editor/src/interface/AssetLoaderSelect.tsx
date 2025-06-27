import { AssetLoader } from "@my/engine"
import { useEffect, useState } from "react"

type Props<T extends AssetLoader<any>> = {
  label: string
  primitiveId?: any
  currentAssetLoader: T
  selectableAssetLoaders: Map<string, T>
  setAssetLoader: (loader: T) => void
}

export function AssetLoaderSelect<T extends AssetLoader<any>>({
  label,
  primitiveId,
  currentAssetLoader,
  selectableAssetLoaders,
  setAssetLoader,
}: Props<T>) {
  const [selectedLoader, setSelectedLoader] = useState<string>(currentAssetLoader.id)

  useEffect(() => {
    setAssetLoader(selectableAssetLoaders.get(selectedLoader)!)
  }, [selectedLoader])

  const id = `${primitiveId}-${currentAssetLoader.displayName}`
  return (
    <label className="select select-xs">
      <span className="label">{label}</span>
      <select value={selectedLoader} onChange={(event) => setSelectedLoader(event.target.value)}>
        {Array.from(selectableAssetLoaders.keys()).map((identifier) => (
          <option value={identifier} key={`${identifier}-selector`} className="text-sm">
            {identifier}
          </option>
        ))}
      </select>
    </label>
  )
}
