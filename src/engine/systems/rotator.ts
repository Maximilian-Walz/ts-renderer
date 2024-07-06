import { mat4 } from "wgpu-matrix";
import { AutoRotateComponent, TransformComponent } from "../components";

export class Rotator {
    rotate(models: [TransformComponent, AutoRotateComponent][]) {
        models.forEach(([transform, autoRotate]) => {
            const angle = Math.sin(Date.now() / 100000000000000)
            mat4.rotate(transform.transformationMatrix, autoRotate.axis, angle, transform.transformationMatrix)
        })
    }
}