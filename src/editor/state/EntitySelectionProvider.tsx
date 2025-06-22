import React, { createContext, useContext, useEffect, useState } from 'react'
import { EntityId } from '../../engine/scenes/Entity'
import { useEditor } from './EditorProvider'
import { useSelectedScene } from './SceneSelectionProvider'

const SelectedEntityIdContext = createContext<EntityId | undefined>(undefined)
const SetSelectedEntityIdContext = createContext<(entityId: EntityId) => void>(() => {})

type Props = {
  children: JSX.Element[] | JSX.Element
}

export function EntitySelctionProvider({ children }: Props) {
  const [selectedEntityId, setSelectedEntityId] = useState<EntityId | undefined>(undefined)

  const editor = useEditor()
  const selectedScene = useSelectedScene()
  useEffect(() => {
    if (selectedEntityId != undefined) {
      const selectedEntity = selectedScene?.getEntityOrUndefined(selectedEntityId)
      editor?.engine.eventManger.emit({ type: 'entitySelect', entity: selectedEntity! })
    }
  }, [selectedEntityId])

  return (
    <SelectedEntityIdContext.Provider value={selectedEntityId}>
      <SetSelectedEntityIdContext.Provider value={setSelectedEntityId}>{children}</SetSelectedEntityIdContext.Provider>
    </SelectedEntityIdContext.Provider>
  )
}

export function useSelectedEntityId() {
  return useContext(SelectedEntityIdContext)
}

export function useSetSelectedEntityId() {
  return useContext(SetSelectedEntityIdContext)
}

export function useSelectedEntity() {
  const selectedScene = useSelectedScene()
  const selectedEntityId = useSelectedEntityId()
  if (selectedEntityId != undefined) {
    return selectedScene?.getEntityOrUndefined(selectedEntityId)
  }
}
