// zig build-exe src/issue.zig -target wasm32-freestanding -fno-entry -fno-strip --export=issue -Debug

// const wasm = await WebAssembly.instantiateStreaming(fetch("./issue.wasm"));
// const { issue, memory } = wasm.instance.exports;
// const memoryView = new Uint8Array(memory.buffer);
// const { written } = new TextEncoder().encodeInto("hi\nhow\nis", memoryView);
// const outputLength = issue(0);

const std = @import("std");

export fn issue(s: [*]u8) i32 {
    const slice = s[0..10];
    var iterator = std.mem.splitScalar(u8, slice, '\n');
    const slice2 = iterator.first();
    return slice2[0];
}
