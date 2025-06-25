import { createGame } from "@game-entry"

const root = document.createElement("div")
root.className = "big"
document.body.appendChild(root)
const game = createGame(root)
game.init()
