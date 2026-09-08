using System.Security.AccessControl;
using System.Security.Principal;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Netgrid.Windows;

internal sealed partial class UpdateDataSnapshot
{
    private const int MaxManifestBytes = 64 * 1024 * 1024;
    private const int MaxEntries = 100000;

    // The expected ID/hash must come from the protected transaction binding,
    // never from the archive itself or an untrusted caller's arbitrary path.
    // This method verifies data; it does not acquire/release an installer lease.
    public static UpdateDataSnapshot Reopen(UpdateDataLayout layout, string id, string expectedHash)
    {
        using var identity = WindowsIdentity.GetCurrent();
        if (!new WindowsPrincipal(identity).IsInRole(WindowsBuiltInRole.Administrator))
            throw new InvalidOperationException("update_data_administrator_required");
        return Reopen(layout, id, expectedHash, UpdateDataLayout.PrivateArchiveSecurity());
    }

    internal static UpdateDataSnapshot Reopen(UpdateDataLayout layout, string id, string expectedHash, DirectorySecurity archiveSecurity)
    {
        if (!Guid.TryParseExact(id, "N", out var parsed) || parsed == Guid.Empty || id != parsed.ToString("N") || !Digest(expectedHash))
            throw new InvalidOperationException("update_data_binding_invalid");
        var held = new List<IDisposable>();
        try
        {
            held.AddRange(UpdateDataFiles.PinAncestors(layout.Root));
            held.Add(UpdateDataFiles.PinDirectory(Path.Combine(layout.Root, "config")));
            held.Add(UpdateDataFiles.PinDirectory(layout.ArchiveRoot));
            RequireArchiveSecurity(layout.ArchiveRoot, archiveSecurity);
            var directory = Path.Combine(layout.ArchiveRoot, id);
            held.Add(UpdateDataFiles.PinDirectory(directory));
            RequireArchiveSecurity(directory, archiveSecurity);
            var file = UpdateDataFiles.ReadLocked(Path.Combine(directory, "manifest.json"));
            held.Add(file);
            if (file.Length <= 0 || file.Length > MaxManifestBytes) throw new InvalidOperationException("update_data_manifest_excessive");
            if (Hash(file) != expectedHash) throw new InvalidOperationException("update_data_manifest_changed");
            file.Position = 0;
            Manifest manifest;
            try
            {
                using var document = JsonDocument.Parse(file, new JsonDocumentOptions { MaxDepth = 16 });
                RequireFields(document.RootElement, ["Version", "DataRoot", "RootDacl", "Excluded", "ProtectedFiles", "Entries"]);
                foreach (var entry in document.RootElement.GetProperty("Entries").EnumerateArray())
                    RequireFields(entry, ["Path", "Directory", "Size", "Sha256", "Dacl"]);
                manifest = document.Deserialize<Manifest>(new JsonSerializerOptions { UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow })
                    ?? throw new InvalidOperationException("update_data_manifest_invalid");
            }
            catch (Exception error) when (error is JsonException or InvalidOperationException or KeyNotFoundException)
            { throw new InvalidOperationException("update_data_manifest_invalid", error); }
            ValidateManifest(manifest, layout);

            var payload = Path.Combine(directory, "files");
            held.Add(UpdateDataFiles.PinDirectory(payload));
            foreach (var entry in manifest.Entries)
            {
                var path = Path.Combine(payload, entry.Path);
                if (entry.Directory) held.Add(UpdateDataFiles.PinDirectory(path));
                else
                {
                    var archived = UpdateDataFiles.ReadLocked(path);
                    held.Add(archived);
                    if (archived.Length != entry.Size || Hash(archived) != entry.Sha256)
                        throw new InvalidOperationException("update_data_snapshot_changed");
                }
            }
            // Pin the current target tree and re-establish credential/config
            // locks. Neither a missing nor changed protected file is repaired.
            _ = Inventory(layout, held);
            foreach (var path in layout.ProtectedFiles)
                if (manifest.Entries.Any(entry => !entry.Directory && UpdateDataLayout.Same(layout.Target(entry.Path), path)))
                    held.Add(UpdateDataFiles.ReadLocked(path));
            var result = new UpdateDataSnapshot(layout, directory, manifest.Entries, manifest.RootDacl, expectedHash, held);
            result.AssertProtectedFilesUnchanged();
            return result;
        }
        catch { foreach (var item in held.AsEnumerable().Reverse()) item.Dispose(); throw; }
    }

    private static void RequireFields(JsonElement element, string[] expected)
    {
        if (element.ValueKind != JsonValueKind.Object) throw new InvalidOperationException("update_data_manifest_invalid");
        var names = element.EnumerateObject().Select(property => property.Name).ToArray();
        if (names.Length != expected.Length || names.Distinct(StringComparer.Ordinal).Count() != expected.Length ||
            expected.Except(names, StringComparer.Ordinal).Any()) throw new InvalidOperationException("update_data_manifest_invalid");
    }
    private static void ValidateManifest(Manifest manifest, UpdateDataLayout layout)
    {
        if (manifest.Version != 2 || !UpdateDataLayout.Same(manifest.DataRoot ?? "", layout.Root) ||
            manifest.Excluded is null || !manifest.Excluded.SequenceEqual(layout.Excluded, StringComparer.OrdinalIgnoreCase) ||
            manifest.ProtectedFiles is null || !manifest.ProtectedFiles.SequenceEqual(layout.ProtectedFiles, StringComparer.OrdinalIgnoreCase) ||
            manifest.Entries is null || manifest.Entries.Length > MaxEntries)
            throw new InvalidOperationException("update_data_manifest_scope_invalid");
        RequireDacl(manifest.RootDacl);
        var seen = new Dictionary<string, Entry>(StringComparer.OrdinalIgnoreCase);
        foreach (var entry in manifest.Entries)
        {
            if (entry is null) throw new InvalidOperationException("update_data_manifest_invalid");
            _ = layout.Target(entry.Path);
            if (!seen.TryAdd(entry.Path, entry)) throw new InvalidOperationException("update_data_manifest_duplicate_path");
            if (entry.Directory ? entry.Size != 0 || entry.Sha256 != "" : entry.Size < 0 || !Digest(entry.Sha256))
                throw new InvalidOperationException("update_data_manifest_entry_invalid");
            var parent = Path.GetDirectoryName(entry.Path);
            if (!string.IsNullOrEmpty(parent) && (!seen.TryGetValue(parent, out var directory) || !directory.Directory))
                throw new InvalidOperationException("update_data_manifest_parent_invalid");
            if (entry.Directory && layout.IsProtected(layout.Target(entry.Path)))
                throw new InvalidOperationException("update_data_protected_file_invalid");
            RequireDacl(entry.Dacl);
        }
        // The on-disk producer and restore verification use depth-first,
        // case-insensitive sibling ordering. Reject a different tree ordering.
        var expectedOrder = new List<string>();
        var children = manifest.Entries.GroupBy(entry => Path.GetDirectoryName(entry.Path) ?? "", StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.OrderBy(entry => entry.Path, StringComparer.OrdinalIgnoreCase).ToArray(), StringComparer.OrdinalIgnoreCase);
        Visit("");
        if (!expectedOrder.SequenceEqual(manifest.Entries.Select(entry => entry.Path)))
            throw new InvalidOperationException("update_data_manifest_order_invalid");
        void Visit(string parent)
        {
            if (!children.TryGetValue(parent, out var entries)) return;
            foreach (var entry in entries) { expectedOrder.Add(entry.Path); if (entry.Directory) Visit(entry.Path); }
        }
    }
    private static bool Digest(string? value) => value is { Length: 64 } && value.All(character => character is >= '0' and <= '9' or >= 'a' and <= 'f');
    private static void RequireDacl(string? sddl)
    {
        try
        {
            if (sddl is null || !sddl.StartsWith("D:", StringComparison.Ordinal)) throw new ArgumentException();
            var security = new RawSecurityDescriptor(sddl);
            if (security.DiscretionaryAcl is null || security.Owner is not null || security.Group is not null || security.SystemAcl is not null)
                throw new ArgumentException();
        }
        catch (ArgumentException error) { throw new InvalidOperationException("update_data_manifest_acl_invalid", error); }
    }
}
