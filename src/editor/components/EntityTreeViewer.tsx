import React from 'react'
import { EntityTree } from '../graphic-editor'

type Props = {
  entityTree: EntityTree
}

export function EntityTreeViewer({ entityTree }: Props) {
  return <div>{entityTree.rootNodes}</div>
}
