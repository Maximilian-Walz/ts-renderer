import React from 'react'
import { Tab, Tabs } from '../components/Tabs'
import { SceneSelect } from './SceneSelect'
import { SceneTree } from './SceneTree'

const tabs: Tab[] = [
  { id: 'tree', displayName: 'Entities', content: <SceneTree /> },
  { id: 'scenes', displayName: 'Scenes', content: <SceneSelect /> },
]

export function LeftPanel() {
  return (
    <div className="">
      <Tabs tabs={tabs} tabStyle="tabs-lifted" />
    </div>
  )
}
