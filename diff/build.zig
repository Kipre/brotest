// zig build-exe src/main.zig -target wasm32-freestanding -fno-entry --export=wasmDiff -O ReleaseSmall
const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.resolveTargetQuery(.{
        .cpu_arch = .wasm32,
        .os_tag = .freestanding,
    });

    // const optimize = b.standardOptimizeOption(.{});

    const exe = b.addExecutable(.{
        .name = "main",
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = .ReleaseSmall,
    });

    // Equivalent to -fno-entry
    exe.entry = .disabled;

    // Equivalent to --export=wasmDiff
    // exe.export_symbol_names = &[_][]const u8{"wasmDiff"};
    exe.rdynamic = true;

    b.installArtifact(exe);
}
