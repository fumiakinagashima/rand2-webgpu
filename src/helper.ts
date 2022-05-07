
import { vec3, mat4 } from "gl-matrix"

export const init = async () => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const adapter = await navigator.gpu?.requestAdapter() as GPUAdapter;
    const device = await adapter?.requestDevice() as GPUDevice;
    const context = canvas.getContext('webgpu') as unknown as GPUCanvasContext;

    const pixelRatio = window.devicePixelRatio || 1;
    const size = [
        canvas.clientWidth * pixelRatio,
        canvas.clientHeight * pixelRatio,
    ];
    const format = context.getPreferredFormat(adapter!);

    context.configure({
        device: device,
        format: format,
        size: size,
        compositingAlphaMode: 'opaque',
    });

    return { device, canvas, format, context };
}

export const createBuffer = (
    device: GPUDevice,
    data: Float32Array,
    flag: GPUBufferUsageFlags = GPUBufferUsage.VERTEX
) => {
    const buffer = device.createBuffer({
        size: data.byteLength,
        usage: flag,
        mappedAtCreation: true,
    });
    
    new Float32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();
    
    return buffer;
}

export const createViewProjection = (aspect = 1.0, eye: vec3 = [2, 2, 3], lookAt: vec3 = [0, 0, 0]) => {
    const up: vec3 = [0, 1, 0];
    const viewMatrix = mat4.create();
    const projectionMatrix = mat4.create();
    const viewProjectionMatrix = mat4.create();

    mat4.lookAt(viewMatrix, eye, lookAt, up);
    mat4.perspective(projectionMatrix, 1.25, aspect, 0.1, 1000.0);
    mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
    
    const cameraOption = {
        eye: eye,
        center: lookAt,
        zoomMax: 100,
        zoomSpeed: 2,
    }

    return { viewMatrix, projectionMatrix, viewProjectionMatrix, cameraOption };
}
