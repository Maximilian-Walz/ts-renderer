import { Editor } from "./Editor"

export function createGame(rootDiv: HTMLDivElement) {
  return new Editor(rootDiv)
}

export * from "./Editor"