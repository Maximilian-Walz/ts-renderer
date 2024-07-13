import { quat } from 'wgpu-matrix'
import { AutoRotateComponent, TransformComponent } from '../components'

export class Rotator {
  rotate(models: [TransformComponent, AutoRotateComponent][]) {
    models.forEach(([transform, autoRotate]) => {
      const angle = Math.sin(Date.now() / 100000000000000)
      quat.rotateZ(transform.rotation, angle, transform.rotation)
    })
  }
}
