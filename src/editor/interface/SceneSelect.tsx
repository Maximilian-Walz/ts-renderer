import React from 'react'
import { useGameSceneManager } from '../state/EditorProvider'
import { useSelectedSceneId, useSetSelectedSceneId } from '../state/SceneSelectionProvider'

export function SceneSelect() {
  const sceneManger = useGameSceneManager()
  const selectedSceneId = useSelectedSceneId()
  const setSelectedSceneId = useSetSelectedSceneId()

  return (
    <div className="join join-vertical m-2 items-start">
      {sceneManger.getScenes().map((scene) => (
        <button
          key={scene.sceneId}
          className={`${scene.sceneId == selectedSceneId ? 'bg-primary-500 text-gray-800 hover:bg-primary-400' : 'text-gray-200 hover:bg-gray-700'} btn btn-ghost btn-xs rounded-full pl-1 pr-2 text-sm text-gray-800`}
          onClick={() => setSelectedSceneId(scene.sceneId)}
        >
          {scene.sceneId}
        </button>
      ))}
    </div>
  )
}
