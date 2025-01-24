const std = @import("std");
const funcs = @import("diff.zig");

export fn wasmDiff(s: [*]u8, left_length: usize, right_length: usize, capacity: usize) i32 {
    const lhs = s[1..left_length];
    const rhs = s[left_length .. right_length - 1];

    var output = std.ArrayList(u8).init(std.heap.wasm_allocator);
    const writer = output.writer();

    funcs.diff(std.heap.wasm_allocator, lhs, rhs, writer) catch {
        return -1;
    };

    const outputLength = output.items.len;
    if (outputLength > capacity) {
        return -1;
    }

    @memcpy(s[0..outputLength], output.items);
    return @as(i32, @intCast(outputLength));
}

pub fn main() !void {}
