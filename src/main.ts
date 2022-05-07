import { mat4 } from "gl-matrix";
import vertexShader from "./vertex.wgsl";
import fragmentShader from "./fragment.wgsl";
import { init, createBuffer, createViewProjection } from "./helper";
import { cube } from "./cube";
const createCamera = require('3d-view-controls');

const run = async() => {
    
    const { device, canvas, format, context } = await init();
    const vertexBuffer = createBuffer(device, cube.vertices);
    const colorBuffer = createBuffer(device, cube.colors);

    const pipeline = device.createRenderPipeline({
        vertex: {
            module: device.createShaderModule({
                code: vertexShader
            }),
            entryPoint: "main",
            buffers: [
                {
                    arrayStride: 12,
                    attributes: [{
                        shaderLocation: 0,
                        format: "float32x3",
                        offset: 0
                    }]
                },
                {
                    arrayStride: 12,
                    attributes: [{
                        shaderLocation: 1,
                        format: "float32x3",
                        offset: 0
                    }]
                },
            ],
        },
        fragment: {
            module: device.createShaderModule({
                code: fragmentShader
            }),
            entryPoint: "main",
            targets: [{
                format: format as GPUTextureFormat
            }]
        },
        primitive: {
            topology: "triangle-list",
            cullMode: 'back',
        },
        depthStencil: {
            format: "depth24plus",
            depthWriteEnabled: true,
            depthCompare: "less",
        },
    });

    const { 
        projectionMatrix,
        viewProjectionMatrix,
        cameraOption,
     } = createViewProjection(canvas.width / canvas.height);

    const uniformBuffer = device.createBuffer({
        size: 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height, 1],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    }).createView();

    const textureView = context.getCurrentTexture().createView();

    const renderPassDescriptior: GPURenderPassDescriptor = {
        colorAttachments: [{
            view: textureView,
            clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
            loadOp: 'clear',
            storeOp: 'store',
        }],
        depthStencilAttachment: {
            view: depthTexture,
            depthClearValue: 1.0,
            depthLoadOp: "clear",
            depthStoreOp:"store",
            stencilClearValue: 0,
            stencilStoreOp: "store",
            stencilLoadOp: "load",
        }
    };

    const uniformBindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{
            binding: 0,
            resource: {
                buffer: uniformBuffer,
                offset: 0,
                size: 64,
            },
        }],
    });

    const model = mat4.create();
    let vMatrix = mat4.create();
    let vpMatrix = viewProjectionMatrix;
    let camera = createCamera(canvas, cameraOption);

    const frame = () => {
        if(camera.tick()){
            const pMatrix = projectionMatrix;
            vMatrix = camera.matrix;
            mat4.multiply(vpMatrix, pMatrix, vMatrix);
        }

        const rotate = mat4.create();
        mat4.fromYRotation(rotate, 0.01);
        mat4.multiply(model, rotate, model);
        const mvp = mat4.create();
        mat4.multiply(mvp, vpMatrix, model);
        device.queue.writeBuffer(uniformBuffer, 0, mvp as ArrayBuffer);

        (renderPassDescriptior as any).colorAttachments[0].view = context.getCurrentTexture().createView();
        
        const commandEncoder = device.createCommandEncoder();
        const renderPass = commandEncoder.beginRenderPass(renderPassDescriptior);
        renderPass.setPipeline(pipeline);
        renderPass.setVertexBuffer(0, vertexBuffer);
        renderPass.setVertexBuffer(1, colorBuffer);
        renderPass.setBindGroup(0, uniformBindGroup);
        renderPass.draw(cube.vertices.length / 3, 1, 0, 0);
        renderPass.end();
    
        device.queue.submit([commandEncoder.finish()]);
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
    
}

run();