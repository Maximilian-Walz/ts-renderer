import { Editor } from "../../../../packages/editor/src/Editor"
import { Tab, Tabs } from "../components/Tabs"
import { EditorProvider } from "../state/EditorProvider"
import { EntitySelctionProvider } from "../state/EntitySelectionProvider"
import { SceneSelctionProvider } from "../state/SceneSelectionProvider"
import { GameView } from "./GameView"
import { Viewport } from "./Viewport"

type Props = {
  editor: Editor
}

const tabs: Tab[] = [
  { id: "viewport", displayName: "Viewport", content: <Viewport /> },
  { id: "game", displayName: "Game", content: <GameView /> },
]

export function EditorInterface({ editor }: Props) {
  return (
    <EditorProvider editor={editor}>
      <SceneSelctionProvider>
        <EntitySelctionProvider>
          <div className="h-full w-full overflow-hidden bg-base-100" data-theme="custom">
            <div className="flex h-full grow flex-col">
              <Tabs tabs={tabs} />
            </div>
          </div>
        </EntitySelctionProvider>
      </SceneSelctionProvider>
    </EditorProvider>
  )
}
