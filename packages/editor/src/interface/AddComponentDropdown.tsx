import { useState } from "react"
import { useSelectedEntity } from "../state/EntitySelectionProvider"

export function AddComponentDropdown() {
  const componentTypes = ["MeshRenderer", "Transform", "Script"]
  const [filterText, setFilterText] = useState<string>("")

  const selectedEntity = useSelectedEntity()

  return (
    selectedEntity && (
      <div className="flex">
        <button
          className="btn btn-soft m-2 grow cursor-pointer z-10"
          popoverTarget="addEntityDropdown"
          style={{ anchorName: "--addEntityAnchor" } as React.CSSProperties}
        >
          Add Component
        </button>
        <ul
          className="dropdown menu bg-base-200 rounded-lg"
          popover="auto"
          id="addEntityDropdown"
          style={{ positionAnchor: "--addEntityAnchor", positionArea: "bottom" } as React.CSSProperties}
        >
          <input
            className="input rounded-lg input-sm mb-1"
            onChange={(event) => setFilterText(event.target.value)}
          ></input>

          {componentTypes
            .filter((componentType) => componentType.search(new RegExp(String.raw`${filterText}`, "i")) != -1)
            .map((componentType) => (
              <li key={componentType}>{componentType}</li>
            ))}
        </ul>
      </div>
    )
  )
}
