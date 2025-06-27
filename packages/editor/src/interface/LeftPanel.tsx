import { LuEarth, LuListTree, LuPlus } from "react-icons/lu"
import { CollapseCard } from "../components/CollapseCard"
import { Tab } from "../components/Tabs"
import { useSetSelectedEntityId } from "../state/EntitySelectionProvider"
import { SceneSelect } from "./SceneSelect"
import { SceneTree } from "./SceneTree"

const tabs: Tab[] = [
  { id: "tree", displayName: "Entities", content: <SceneTree /> },
  { id: "scenes", displayName: "Scenes", content: <SceneSelect /> },
]

export function LeftPanel() {
  const setSelectedEntityId = useSetSelectedEntityId()
  return (
    <div className="flex grow flex-col overflow-auto">
      <div className="basis-2/3" onClick={() => setSelectedEntityId(undefined)}>
        <CollapseCard title="Entities" action={<LuPlus />} icon={<LuListTree />} defaultExpanded>
          <SceneTree />
        </CollapseCard>
      </div>
      <div className="basis-1/3">
        <CollapseCard title="Scenes" icon={<LuEarth />} defaultExpanded>
          <SceneSelect />
        </CollapseCard>
      </div>
    </div>
  )
}
