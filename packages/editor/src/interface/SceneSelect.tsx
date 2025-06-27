import { LuTrees } from "react-icons/lu"
import { useGameSceneManager } from "../state/EditorProvider"
import { useSelectedSceneId, useSetSelectedSceneId } from "../state/SceneSelectionProvider"

export function SceneSelect() {
  const sceneManger = useGameSceneManager()
  const selectedSceneId = useSelectedSceneId()
  const setSelectedSceneId = useSetSelectedSceneId()

  return (
    <div className="join join-vertical m-2 items-start gap-1">
      {sceneManger.getScenes().map((scene) => (
        <button
          key={scene.sceneId}
          className={`${
            scene.sceneId == selectedSceneId ? "btn-ghost text-primary" : "btn-ghost text-base-content/60 "
          } btn btn-xs rounded-lg pl-1 pr-2 text-sm hover:btn-primary hover:bg-base-content/0`}
          onClick={() => setSelectedSceneId(scene.sceneId)}
        >
          <LuTrees />
          {scene.sceneId}
        </button>
      ))}
    </div>
  )
}
