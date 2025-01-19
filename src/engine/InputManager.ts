export class InputManager {
  public mouseX: number = 0
  public mouseY: number = 0
  public mouseDeltaX: number = 0
  public mouseDeltaY: number = 0
  public wheelDelta: number = 0
  public touchpadPinchDelta: number = 0
  public mouseButtons: Boolean[] = [false, false, false]
  public keys: Map<string, Boolean> = new Map()

  constructor() {
    const options = { passive: false }
    window.addEventListener('keydown', this.onKeyDown.bind(this), options)
    window.addEventListener('keyup', this.onKeyUp.bind(this), options)
  }

  public setTarget(target: HTMLElement) {
    const options = { passive: false }
    target.addEventListener('mousemove', this.onMouseMove.bind(this), options)
    target.addEventListener('mousedown', this.onMouseDown.bind(this), options)
    target.addEventListener('mouseup', this.onMouseUp.bind(this), options)
    target.addEventListener('wheel', this.onWheel.bind(this), options)
  }

  public clearDeltas() {
    this.mouseDeltaX = 0
    this.mouseDeltaY = 0
    this.wheelDelta = 0
    this.touchpadPinchDelta = 0
  }

  private onMouseMove(event: MouseEvent) {
    this.mouseX = event.clientX
    this.mouseY = event.clientY
    this.mouseDeltaX += event.movementX
    this.mouseDeltaY += event.movementY
  }

  private onMouseDown(event: MouseEvent) {
    this.mouseButtons[event.button] = true
  }

  private onMouseUp(event: MouseEvent) {
    this.mouseButtons[event.button] = false
  }

  private onKeyDown(event: KeyboardEvent) {
    this.keys.set(event.code, true)
  }

  private onKeyUp(event: KeyboardEvent) {
    this.keys.set(event.code, false)
  }

  private onWheel(event: WheelEvent) {
    // Detect touchpad pinch
    if (event.ctrlKey) {
      this.touchpadPinchDelta += event.deltaY
    } else {
      this.wheelDelta += event.deltaY
    }
    event.preventDefault()
  }
}
