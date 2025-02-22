import React, { createContext, useContext, useState } from 'react'
import { SceneId } from '../../engine/scenes/Scene'
import { useEditor } from './EditorProvider'

const SelectedSceneIdContext = createContext<string | undefined>(undefined)
const SetSelectedSceneIdContext = createContext<(entityId: SceneId) => void>(() => {})

type Props = {
  children: JSX.Element[] | JSX.Element
}

export function SceneSelctionProvider({ children }: Props) {
  const [selectedSceneId, setSelectedSceneId] = useState<SceneId | undefined>(undefined)

  return (
    <SelectedSceneIdContext.Provider value={selectedSceneId}>
      <SetSelectedSceneIdContext.Provider value={setSelectedSceneId}>{children}</SetSelectedSceneIdContext.Provider>
    </SelectedSceneIdContext.Provider>
  )
}

export function useSelectedSceneId() {
  return useContext(SelectedSceneIdContext)
}

export function useSetSelectedSceneId() {
  return useContext(SetSelectedSceneIdContext)
}

export function useSelectedScene() {
  const editor = useEditor()!
  const selectedSceneId = useSelectedSceneId()
  if (selectedSceneId != undefined) {
    return editor.game.engine.sceneManager.getScene(selectedSceneId)
  }
}
