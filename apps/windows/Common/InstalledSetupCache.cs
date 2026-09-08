using System.Security.Cryptography;
using Microsoft.Win32;
using Microsoft.Win32.SafeHandles;

namespace Netgrid.Windows;

// MSI owns CurrentProductCode and restores that selector with its registry
// transaction. Cache entries are immutable and never promoted between slots.
internal static class InstalledSetupCache
{
    internal const string RegistryPath = @"SOFTWARE\LevelX2\NETGRID";

    public static string PathFor(string dataRoot, string productCode)
    {
        if (!Guid.TryParseExact(productCode, "B", out var product) || product == Guid.Empty ||
            product.ToString("B").ToUpperInvariant() != productCode)
            throw new InvalidOperationException("setup_cache_product_code_invalid");
        return Path.Combine(Root(dataRoot), "config", "updates", productCode, "NETGRID-Setup.exe");
    }

    public static void Store(string dataRoot, string productCode, string source, string expectedHash)
    {
        if (expectedHash.Length != 64 || expectedHash.Any(c => !Uri.IsHexDigit(c)))
            throw new InvalidOperationException("setup_cache_hash_invalid");
        var destination = PathFor(dataRoot, productCode);
        var held = UpdateDataFiles.PinAncestors(Path.Combine(Root(dataRoot), "config"));
        try
        {
            var updates = Path.GetDirectoryName(Path.GetDirectoryName(destination)!)!;
            Directory.CreateDirectory(updates);
            held.Add(UpdateDataFiles.PinDirectory(updates));
            var product = Path.GetDirectoryName(destination)!;
            Directory.CreateDirectory(product);
            held.Add(UpdateDataFiles.PinDirectory(product));
            using var input = UpdateDataFiles.ReadLocked(source);
            if (!Hash(input).Equals(expectedHash, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("setup_cache_hash_mismatch");
            if (File.Exists(destination))
            {
                using var current = UpdateDataFiles.ReadLocked(destination);
                if (!Hash(current).Equals(expectedHash, StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException("setup_cache_product_identity_conflict");
                return; // Same product and bytes: repair does not rewrite it.
            }
            var stage = Path.Combine(product, Guid.NewGuid().ToString("N") + ".tmp");
            try
            {
                input.Position = 0;
                using (var output = new FileStream(stage, FileMode.CreateNew, FileAccess.Write, FileShare.None))
                {
                    input.CopyTo(output);
                    output.Flush(flushToDisk: true);
                }
                using (var check = UpdateDataFiles.ReadLocked(stage))
                    if (!Hash(check).Equals(expectedHash, StringComparison.OrdinalIgnoreCase))
                        throw new InvalidOperationException("setup_cache_copy_hash_mismatch");
                File.Move(stage, destination, overwrite: false);
            }
            finally { if (File.Exists(stage)) File.Delete(stage); }
        }
        finally { Dispose(held); }
    }

    public static Entry OpenRegistered(RegistryKey machine, string programRoot, string dataRoot)
    {
        using var product = machine.OpenSubKey(RegistryPath, writable: false);
        if (product is null) throw new InvalidOperationException("setup_cache_registered_identity_invalid");
        var registeredProgram = RegisteredString(product, "InstallDirectory");
        var registeredData = RegisteredString(product, "RuntimeDataRoot");
        var code = RegisteredString(product, "CurrentProductCode");
        if (!Root(registeredProgram).Equals(Root(programRoot), StringComparison.OrdinalIgnoreCase) ||
            !Root(registeredData).Equals(Root(dataRoot), StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("setup_cache_registered_identity_invalid");
        return Open(dataRoot, code);
    }

    private static string RegisteredString(RegistryKey product, string name)
    {
        if (product.GetValue(name, null, RegistryValueOptions.DoNotExpandEnvironmentNames) is not string value ||
            product.GetValueKind(name) != RegistryValueKind.String)
            throw new InvalidOperationException("setup_cache_registered_identity_invalid");
        return value;
    }

    internal static Entry Open(string dataRoot, string productCode)
    {
        var path = PathFor(dataRoot, productCode);
        var held = UpdateDataFiles.PinAncestors(Path.GetDirectoryName(path)!);
        FileStream? file = null;
        try
        {
            file = UpdateDataFiles.ReadLocked(path);
            return new Entry(path, Hash(file), file, held);
        }
        catch { file?.Dispose(); Dispose(held); throw; }
    }

    private static string Root(string value)
    {
        if (!Path.IsPathFullyQualified(value) || value.StartsWith(@"\\", StringComparison.Ordinal))
            throw new InvalidOperationException("setup_cache_root_invalid");
        var root = Path.TrimEndingDirectorySeparator(Path.GetFullPath(value));
        if (root.Length <= 3) throw new InvalidOperationException("setup_cache_root_invalid");
        return root;
    }
    private static string Hash(Stream stream) => Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
    private static void Dispose(List<SafeFileHandle> held)
    {
        for (var index = held.Count - 1; index >= 0; index--) held[index].Dispose();
    }

    internal sealed class Entry(string path, string sha256, FileStream file, List<SafeFileHandle> held) : IDisposable
    {
        public string Path { get; } = path;
        public string Sha256 { get; } = sha256;
        public void Dispose() { file.Dispose(); InstalledSetupCache.Dispose(held); }
    }
}
