import React from 'react'
import { useSelectedEntity } from '../state/EntitySelectionProvider'

export function RightPanel() {
  const entity = useSelectedEntity()

  if (entity == undefined) {
    return <div>No entity selected</div>
  }

  return <div>{entity.entityId}</div>
}
