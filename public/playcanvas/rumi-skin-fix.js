function componentSize(type) {
  return ({5120:1,5121:1,5122:2,5123:2,5125:4,5126:4})[type];
}
function componentCount(type) {
  return ({SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16})[type];
}
function readComponent(view, off, type) {
  switch(type) {
    case 5120: return view.getInt8(off);
    case 5121: return view.getUint8(off);
    case 5122: return view.getInt16(off, true);
    case 5123: return view.getUint16(off, true);
    case 5125: return view.getUint32(off, true);
    case 5126: return view.getFloat32(off, true);
    default: throw new Error(`Unsupported component type ${type}`);
  }
}
function writeComponent(view, off, type, value) {
  switch(type) {
    case 5120: return view.setInt8(off, value);
    case 5121: return view.setUint8(off, value);
    case 5122: return view.setInt16(off, value, true);
    case 5123: return view.setUint16(off, value, true);
    case 5125: return view.setUint32(off, value, true);
    case 5126: return view.setFloat32(off, value, true);
    default: throw new Error(`Unsupported component type ${type}`);
  }
}

function pruneUnusedSkinJoints(arrayBuffer) {
  const sourceView = new DataView(arrayBuffer);
  if (sourceView.getUint32(0, true) !== 0x46546c67) throw new Error('Rumi file is not a GLB');

  let offset = 12;
  let jsonBytes = null;
  let binBytes = null;
  while (offset < sourceView.byteLength) {
    const length = sourceView.getUint32(offset, true);
    const type = sourceView.getUint32(offset + 4, true);
    const start = offset + 8;
    if (type === 0x4e4f534a) jsonBytes = new Uint8Array(arrayBuffer, start, length);
    if (type === 0x004e4942) binBytes = new Uint8Array(arrayBuffer, start, length);
    offset = start + length;
  }
  if (!jsonBytes || !binBytes) throw new Error('GLB is missing JSON or BIN chunk');

  const gltf = JSON.parse(new TextDecoder().decode(jsonBytes).replace(/[\u0000 ]+$/, ''));
  const skin = gltf.skins?.[0];
  if (!skin) throw new Error('No skin found in Rumi GLB');
  const oldJointNodes = [...skin.joints];
  if (oldJointNodes.length <= 256) return { buffer: arrayBuffer, before: oldJointNodes.length, after: oldJointNodes.length };

  const bin = new Uint8Array(binBytes);
  const binView = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  const accessorInfo = (index) => {
    const accessor = gltf.accessors[index];
    const bufferView = gltf.bufferViews[accessor.bufferView];
    const comps = componentCount(accessor.type);
    const size = componentSize(accessor.componentType);
    return {
      accessor, bufferView, comps, size,
      start: (bufferView.byteOffset || 0) + (accessor.byteOffset || 0),
      stride: bufferView.byteStride || comps * size
    };
  };

  const used = new Set();
  for (const mesh of gltf.meshes || []) {
    for (const primitive of mesh.primitives || []) {
      const jointIndex = primitive.attributes?.JOINTS_0;
      const weightIndex = primitive.attributes?.WEIGHTS_0;
      if (jointIndex == null || weightIndex == null) continue;
      const J = accessorInfo(jointIndex);
      const W = accessorInfo(weightIndex);
      for (let i = 0; i < J.accessor.count; i++) {
        for (let c = 0; c < 4; c++) {
          const weight = readComponent(binView, W.start + i * W.stride + c * W.size, W.accessor.componentType);
          if (weight > 1e-7) {
            const joint = readComponent(binView, J.start + i * J.stride + c * J.size, J.accessor.componentType);
            used.add(joint);
          }
        }
      }
    }
  }

  const keep = [...used].sort((a,b) => a-b);
  if (keep.length > 256) throw new Error(`Rumi still has ${keep.length} weighted joints after pruning`);
  const remap = new Map(keep.map((oldIndex, newIndex) => [oldIndex, newIndex]));

  for (const mesh of gltf.meshes || []) {
    for (const primitive of mesh.primitives || []) {
      const jointIndex = primitive.attributes?.JOINTS_0;
      if (jointIndex == null) continue;
      const J = accessorInfo(jointIndex);
      for (let i = 0; i < J.accessor.count; i++) {
        for (let c = 0; c < 4; c++) {
          const p = J.start + i * J.stride + c * J.size;
          const oldIndex = readComponent(binView, p, J.accessor.componentType);
          writeComponent(binView, p, J.accessor.componentType, remap.get(oldIndex) ?? 0);
        }
      }
    }
  }

  if (skin.inverseBindMatrices != null) {
    const I = accessorInfo(skin.inverseBindMatrices);
    const elementBytes = I.comps * I.size;
    const compactMatrices = new Uint8Array(keep.length * elementBytes);
    for (let n = 0; n < keep.length; n++) {
      const oldIndex = keep[n];
      compactMatrices.set(bin.subarray(I.start + oldIndex * I.stride, I.start + oldIndex * I.stride + elementBytes), n * elementBytes);
    }
    for (let n = 0; n < keep.length; n++) {
      bin.set(compactMatrices.subarray(n * elementBytes, (n + 1) * elementBytes), I.start + n * I.stride);
    }
    I.accessor.count = keep.length;
    delete I.accessor.min;
    delete I.accessor.max;
  }

  skin.joints = keep.map((oldIndex) => oldJointNodes[oldIndex]);

  const jsonRaw = new TextEncoder().encode(JSON.stringify(gltf));
  const jsonLength = (jsonRaw.length + 3) & ~3;
  const binLength = (bin.length + 3) & ~3;
  const totalLength = 12 + 8 + jsonLength + 8 + binLength;
  const output = new ArrayBuffer(totalLength);
  const outputView = new DataView(output);
  const outputBytes = new Uint8Array(output);

  outputView.setUint32(0, 0x46546c67, true);
  outputView.setUint32(4, 2, true);
  outputView.setUint32(8, totalLength, true);
  outputView.setUint32(12, jsonLength, true);
  outputView.setUint32(16, 0x4e4f534a, true);
  outputBytes.fill(0x20, 20, 20 + jsonLength);
  outputBytes.set(jsonRaw, 20);

  const binHeader = 20 + jsonLength;
  outputView.setUint32(binHeader, binLength, true);
  outputView.setUint32(binHeader + 4, 0x004e4942, true);
  outputBytes.set(bin, binHeader + 8);

  return { buffer: output, before: oldJointNodes.length, after: keep.length };
}


export { pruneUnusedSkinJoints };\n