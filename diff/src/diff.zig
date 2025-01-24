const std = @import("std");
const testing = std.testing;
const expect = std.testing.expect;

fn writeDiff(array: []i32, lhs: std.ArrayList([]const u8), rhs: std.ArrayList([]const u8), i: i32, j: i32, writer: anytype) !void {
    const n: i32 = @intCast(rhs.items.len + 1);

    if (i > 0 and j > 0 and std.mem.eql(u8, lhs.items[@intCast(i - 1)], rhs.items[@intCast(j - 1)])) {
        try writeDiff(array, lhs, rhs, i - 1, j - 1, writer);
        try writer.writeAll("  ");
        try writer.writeAll(lhs.items[@intCast(i - 1)]);
        try writer.writeAll("\n");
    } else if (j > 0 and (i == 0 or array[@intCast(i * n + j - 1)] >= array[@intCast((i - 1) * n + j)])) {
        try writeDiff(array, lhs, rhs, i, j - 1, writer);
        try writer.writeAll("+ ");
        try writer.writeAll(rhs.items[@intCast(j - 1)]);
        try writer.writeAll("\n");
    } else if (i > 0 and (j == 0 or array[@intCast(i * n + j - 1)] < array[@intCast((i - 1) * n + j)])) {
        try writeDiff(array, lhs, rhs, i - 1, j, writer);
        try writer.writeAll("- ");
        try writer.writeAll(lhs.items[@intCast(i - 1)]);
        try writer.writeAll("\n");
    }
}

pub fn diff(allocator: std.mem.Allocator, lhs_string: []const u8, rhs_string: []const u8, writer: anytype) !void {
    var lhs = std.ArrayList([]const u8).init(allocator);
    defer lhs.deinit();

    var rhs = std.ArrayList([]const u8).init(allocator);
    defer rhs.deinit();

    var lhs_iterator = std.mem.splitScalar(u8, lhs_string, '\n');
    while (lhs_iterator.next()) |line| {
        try lhs.append(line);
    }

    var rhs_iterator = std.mem.splitScalar(u8, rhs_string, '\n');
    while (rhs_iterator.next()) |line| {
        try rhs.append(line);
    }

    const m = lhs.items.len + 1;
    const n = rhs.items.len + 1;

    // Allocate a 2D array
    var array = try allocator.alloc(i32, m * n);
    defer allocator.free(array);

    // Initialize the array
    for (0..m) |i| {
        array[i * n] = 0;
    }
    for (0..n) |j| {
        array[j] = 0;
    }

    for (1..m) |i| {
        for (1..n) |j| {
            if (std.mem.eql(u8, lhs.items[i - 1], rhs.items[j - 1])) {
                array[n * i + j] = array[n * (i - 1) + (j - 1)] + 1;
            } else {
                const top = array[n * (i - 1) + j];
                const left = array[n * i + (j - 1)];
                array[n * i + j] = if (top > left) top else left;
            }
        }
    }

    try writeDiff(array, lhs, rhs, @intCast(m - 1), @intCast(n - 1), writer);
}

test "reference case" {
    var list = std.ArrayList(u8).init(std.testing.allocator);
    defer list.deinit();

    const writer = list.writer();

    const expected =
        \\- X
        \\  M
        \\+ Z
        \\  J
        \\- Y
        \\  A
        \\+ W
        \\+ X
        \\  U
        \\- Z
        \\
    ;
    try diff(std.testing.allocator, "X\nM\nJ\nY\nA\nU\nZ", "M\nZ\nJ\nA\nW\nX\nU", writer);
    try expect(std.mem.eql(u8, list.items, expected));
}

test "simple case" {
    var list = std.ArrayList(u8).init(std.testing.allocator);
    defer list.deinit();

    const writer = list.writer();
    const expected =
        \\  hello
        \\- a
        \\+ b
        \\+ b
        \\
    ;

    try diff(std.testing.allocator, "hello\na", "hello\nb\nb", writer);
    try expect(std.mem.eql(u8, list.items, expected));
}

test "even simpler" {
    var list = std.ArrayList(u8).init(std.testing.allocator);
    defer list.deinit();

    const writer = list.writer();

    try diff(std.testing.allocator, "a", "b", writer);
    try expect(std.mem.eql(u8, list.items, "- a\n+ b\n"));
}

test "modify second line" {
    var list = std.ArrayList(u8).init(std.testing.allocator);
    defer list.deinit();

    const writer = list.writer();

    try diff(std.testing.allocator, "a\nb", "a\nc", writer);
    try expect(std.mem.eql(u8, list.items, "  a\n- b\n+ c\n"));
}

test "more elaborate" {
    var list = std.ArrayList(u8).init(std.testing.allocator);
    defer list.deinit();

    const writer = list.writer();
    const before =
        \\ hi
        \\ this
        \\ is the
        \\ text
    ;
    const after =
        \\ hi
        \\ this
        \\ was the
        \\ modified
        \\ text
    ;

    const expected =
        \\   hi
        \\   this
        \\-  is the
        \\+  was the
        \\+  modified
        \\   text
        \\
    ;

    try diff(std.testing.allocator, before, after, writer);
    try expect(std.mem.eql(u8, list.items, expected));
}

fn ok(buf: [*]u8, number: usize) !void {
    const slice = buf[0..number];
    std.debug.print("{s}\n", .{slice});
    var iterator = std.mem.splitScalar(u8, slice, '\n');
    std.debug.print("{s}\n", .{iterator.first()});
}

test "splitScalar" {
    const s: [*]u8 = @ptrCast(@constCast("hello\nhi"));
    try ok(s, 8);
}
