import { GUI } from 'dat.gui'
import { CameraComponent } from './components/components'

class Float3 {
  x: number = 0
  y: number = -0.8
  z: number = -2.37
}

export class DebugGui {
  gui: GUI

  constructor() {
    this.gui = new GUI()
  }

  addCameraControls(cameraComponent: CameraComponent) {
    /*
    const position = new Float3()        
    const updatePosition = () => {
        let newPosition = vec3.fromValues(position.x, position.y, position.z)
        cameraComponent.viewMatrix = mat4.translate(mat4.identity(), newPosition)
    }
    const min = -10
    const max = 10
    const step = 0.01
    const cameraFolder = this.gui.addFolder("Camera")
    cameraFolder.open()
    const positionFolder = cameraFolder.addFolder("Position")
    positionFolder.open()
    positionFolder.add(position, "x", min, max, step).onChange(updatePosition)
    positionFolder.add(position, "y", min, max, step).onChange(updatePosition)
    positionFolder.add(position, "z", min, max, step).onChange(updatePosition)
    */
  }
}
