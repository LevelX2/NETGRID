using System.Security.AccessControl;
using System.Security.Cryptography;
using System.Security.Principal;
using System.Text.Json;

namespace Netgrid.Windows;

// Offline byte-for-byte data-root snapshot. The transaction owner must keep
// its installation lease and prove product-process absence before calling.
// Config/credentials are verified and held read-only, never restored over.
internal sealed partial class UpdateDataSnapshot : IDisposable
{
    private sealed record Entry(string Path, bool Directory, long Size, string Sha256, string Dacl);
    private sealed record Manifest(int Version, string DataRoot, string RootDacl, string[] Excluded, string[] ProtectedFiles, Entry[] Entries);
    private readonly UpdateDataLayout _layout;
    private readonly Entry[] _entries;
    private readonly string _rootDacl;
    private readonly List<IDisposable> _held;
    private bool _disposed;
    public string DirectoryPath { get; }
    public string ManifestSha256 { get; }

    private UpdateDataSnapshot(UpdateDataLayout layout, string directory, Entry[] entries, string rootDacl, string hash, List<IDisposable> held)
    { _layout = layout; DirectoryPath = directory; _entries = entries; _rootDacl = rootDacl; ManifestSha256 = hash; _held = held; }

    public static UpdateDataSnapshot Capture(UpdateDataLayout layout)
    {
        using var identity = WindowsIdentity.GetCurrent();
        if (!new WindowsPrincipal(identity).IsInRole(WindowsBuiltInRole.Administrator))
            throw new InvalidOperationException("update_data_administrator_required");
        return Capture(layout, UpdateDataLayout.PrivateArchiveSecurity());
    }

    // Test seam supplies an ACL for its own temporary directory; no CLI or
    // product configuration can weaken the public capture policy above.
    internal static UpdateDataSnapshot Capture(UpdateDataLayout layout, DirectorySecurity archiveSecurity)
    {
        var held = new List<IDisposable>();
        var sources = new List<FileStream>();
        try
        {
            held.AddRange(UpdateDataFiles.PinAncestors(layout.Root));
            var rootDacl = DirectoryAcl(layout.Root);
            var config = Path.Combine(layout.Root, "config");
            held.Add(UpdateDataFiles.PinDirectory(config));
            // The registered config parent is installer-protected. A random
            // child is atomically created with its private DACL before data.
            if (!Directory.Exists(layout.ArchiveRoot)) new DirectoryInfo(layout.ArchiveRoot).Create(archiveSecurity);
            held.Add(UpdateDataFiles.PinDirectory(layout.ArchiveRoot));
            RequireArchiveSecurity(layout.ArchiveRoot, archiveSecurity);
            var directory = Path.Combine(layout.ArchiveRoot, Guid.NewGuid().ToString("N"));
            if (Path.Exists(directory)) throw new InvalidOperationException("update_data_archive_collision");
            new DirectoryInfo(directory).Create(archiveSecurity);
            held.Add(UpdateDataFiles.PinDirectory(directory));
            RequireArchiveSecurity(directory, archiveSecurity);
            var payload = Path.Combine(directory, "files");
            Directory.CreateDirectory(payload);
            var inventory = Inventory(layout, held);
            var entries = new List<Entry>();
            foreach (var item in inventory)
            {
                var path = layout.Target(item.Path);
                var target = Path.Combine(payload, item.Path);
                if (item.Directory)
                {
                    Directory.CreateDirectory(target);
                    entries.Add(new(item.Path, true, 0, "", DirectoryAcl(path)));
                    continue;
                }
                var source = UpdateDataFiles.ReadLocked(path);
                sources.Add(source);
                using (var destination = new FileStream(target, FileMode.CreateNew, FileAccess.Write, FileShare.None))
                { source.CopyTo(destination); destination.Flush(true); }
                source.Position = 0;
                var digest = Hash(source);
                using var copied = UpdateDataFiles.ReadLocked(target);
                if (copied.Length != source.Length || Hash(copied) != digest)
                    throw new InvalidOperationException("update_data_copy_mismatch");
                entries.Add(new(item.Path, false, source.Length, digest, FileAcl(path)));
                if (layout.IsProtected(path)) { held.Add(source); sources.Remove(source); }
            }
            // Reject a concurrent addition/removal instead of blessing a
            // mixed inventory. All copied source files are still locked.
            var finalInventory = Inventory(layout, held);
            if (!inventory.SequenceEqual(finalInventory)) throw new InvalidOperationException("update_data_source_changed");
            var manifest = new Manifest(2, layout.Root, rootDacl, layout.Excluded.ToArray(), layout.ProtectedFiles.ToArray(), entries.ToArray());
            ValidateManifest(manifest, layout);
            var bytes = JsonSerializer.SerializeToUtf8Bytes(manifest);
            if (bytes.Length > MaxManifestBytes) throw new InvalidOperationException("update_data_manifest_excessive");
            var manifestPath = Path.Combine(directory, "manifest.json");
            using (var file = new FileStream(manifestPath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
            { file.Write(bytes); file.Flush(true); }
            var lockedManifest = UpdateDataFiles.ReadLocked(manifestPath);
            held.Add(lockedManifest);
            var result = new UpdateDataSnapshot(layout, directory, manifest.Entries, rootDacl, Hash(lockedManifest), held);
            result.AssertProtectedFilesUnchanged();
            return result;
        }
        catch { foreach (var item in held.AsEnumerable().Reverse()) item.Dispose(); throw; }
        finally { foreach (var source in sources) source.Dispose(); }
    }

    public void AssertProtectedFilesUnchanged()
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        foreach (var path in _layout.ProtectedFiles)
        {
            var saved = _entries.SingleOrDefault(entry => UpdateDataLayout.Same(_layout.Target(entry.Path), path));
            if (saved is null)
            {
                if (Path.Exists(path)) throw new InvalidOperationException("update_data_protected_file_changed");
                continue;
            }
            if (saved.Directory) throw new InvalidOperationException("update_data_protected_file_invalid");
            using var current = UpdateDataFiles.ReadLocked(path);
            if (current.Length != saved.Size || Hash(current) != saved.Sha256 || FileAcl(path) != saved.Dacl)
                throw new InvalidOperationException("update_data_protected_file_changed");
        }
    }

    public void Verify()
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        using var manifest = UpdateDataFiles.ReadLocked(Path.Combine(DirectoryPath, "manifest.json"));
        if (Hash(manifest) != ManifestSha256) throw new InvalidOperationException("update_data_manifest_changed");
        foreach (var entry in _entries.Where(entry => !entry.Directory))
        {
            using var file = UpdateDataFiles.ReadLocked(Path.Combine(DirectoryPath, "files", entry.Path));
            if (file.Length != entry.Size || Hash(file) != entry.Sha256) throw new InvalidOperationException("update_data_snapshot_changed");
        }
    }

    // Returns the preserved failed-state snapshot. It remains available even
    // if a later filesystem operation fails: failure never resumes NETGRID.
    public string Restore()
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        AssertProtectedFilesUnchanged();
        Verify();
        using var preserved = Capture(_layout);
        return RestoreWithPreserved(preserved);
    }
    internal string RestoreWithPreserved(UpdateDataSnapshot preserved)
    {
        if (!UpdateDataLayout.Same(preserved._layout.Root, _layout.Root) || ReferenceEquals(preserved, this))
            throw new InvalidOperationException("update_data_restore_scope_invalid");
        if (!preserved._layout.Excluded.SequenceEqual(_layout.Excluded, StringComparer.OrdinalIgnoreCase) ||
            !preserved._layout.ProtectedFiles.SequenceEqual(_layout.ProtectedFiles, StringComparer.OrdinalIgnoreCase))
            throw new InvalidOperationException("update_data_restore_scope_invalid");
        AssertProtectedFilesUnchanged();
        Verify();
        preserved.Verify();
        var locks = new List<FileStream>();
        try
        {
            // Validate and hold every backup file before changing any target.
            var byPath = new Dictionary<string, FileStream>(StringComparer.OrdinalIgnoreCase);
            foreach (var entry in _entries.Where(entry => !entry.Directory))
            {
                var file = UpdateDataFiles.ReadLocked(Path.Combine(DirectoryPath, "files", entry.Path));
                locks.Add(file);
                if (file.Length != entry.Size || Hash(file) != entry.Sha256) throw new InvalidOperationException("update_data_snapshot_changed");
                file.Position = 0;
                byPath.Add(entry.Path, file);
            }
            var liveLocks = new Dictionary<string, FileStream>(StringComparer.OrdinalIgnoreCase);
            var currentInventory = Inventory(_layout, _held);
            if (!currentInventory.SequenceEqual(preserved._entries.Select(entry => (entry.Path, entry.Directory))))
                throw new InvalidOperationException("update_data_restore_target_changed");
            foreach (var entry in preserved._entries.Where(entry => !entry.Directory))
            {
                var current = UpdateDataFiles.ReadLocked(_layout.Target(entry.Path));
                locks.Add(current);
                if (current.Length != entry.Size || Hash(current) != entry.Sha256)
                    throw new InvalidOperationException("update_data_restore_target_changed");
                liveLocks.Add(entry.Path, current);
            }
            // After process loss original directories can be missing. Recreate
            // only manifest-bound directories, parent first, with their DACL
            // present from creation. A file at that path is not overwritten.
            foreach (var entry in _entries.Where(entry => entry.Directory))
            {
                var target = _layout.Target(entry.Path);
                if (File.Exists(target)) throw new InvalidOperationException("update_data_target_type_changed");
                if (!Directory.Exists(target))
                {
                    var security = new DirectorySecurity();
                    security.SetSecurityDescriptorSddlForm(entry.Dacl, AccessControlSections.Access);
                    new DirectoryInfo(target).Create(security);
                    _held.Add(UpdateDataFiles.PinDirectory(target));
                }
            }
            foreach (var entry in _entries.Where(entry => !entry.Directory))
            {
                var target = _layout.Target(entry.Path);
                if (_layout.IsProtected(target)) continue;
                if (Directory.Exists(target)) throw new InvalidOperationException("update_data_target_type_changed");
                var stage = target + ".restore-" + Guid.NewGuid().ToString("N");
                // The original DACL is installed atomically, before copying
                // bytes, rather than briefly exposing them via the parent ACL.
                using (var output = UpdateDataFiles.CreateRestoreStage(stage, entry.Dacl))
                { byPath[entry.Path].CopyTo(output); output.Flush(true); }
                using (var check = UpdateDataFiles.ReadLocked(stage))
                    if (check.Length != entry.Size || Hash(check) != entry.Sha256) throw new InvalidOperationException("update_data_restore_copy_mismatch");
                // Same-directory replacement never writes through an existing
                // hardlink. No recursive deletion or broad data-root move.
                if (liveLocks.TryGetValue(entry.Path, out var prior)) prior.Dispose();
                File.Move(stage, target, overwrite: true);
            }
            var original = new HashSet<string>(_entries.Select(entry => entry.Path), StringComparer.OrdinalIgnoreCase);
            foreach (var added in preserved._entries.Where(entry => !entry.Directory && !original.Contains(entry.Path)))
            {
                var target = _layout.Target(added.Path);
                if (_layout.IsProtected(target)) throw new InvalidOperationException("update_data_protected_file_changed");
                // These exact files have already been saved and hash-verified
                // in the failed-state archive; don't follow directory links.
                using (var current = UpdateDataFiles.ReadLocked(target))
                    if (current.Length != added.Size || Hash(current) != added.Sha256)
                        throw new InvalidOperationException("update_data_restore_target_changed");
                liveLocks[added.Path].Dispose();
                File.Delete(target);
            }
            // Extra empty directories are harmless and retained, not recursively
            // deleted. Original directory permissions are restored explicitly.
            var rootSecurity = new DirectorySecurity();
            rootSecurity.SetSecurityDescriptorSddlForm(_rootDacl, AccessControlSections.Access);
            new DirectoryInfo(_layout.Root).SetAccessControl(rootSecurity);
            foreach (var entry in _entries.Where(entry => entry.Directory))
            {
                var security = new DirectorySecurity();
                security.SetSecurityDescriptorSddlForm(entry.Dacl, AccessControlSections.Access);
                new DirectoryInfo(_layout.Target(entry.Path)).SetAccessControl(security);
            }
            // Restore original inheritance only after the original parent
            // DACLs are back; credentials/config are still never written.
            foreach (var entry in _entries.Where(entry => !entry.Directory && !_layout.IsProtected(_layout.Target(entry.Path))))
            {
                var security = new FileSecurity();
                security.SetSecurityDescriptorSddlForm(entry.Dacl, AccessControlSections.Access);
                new FileInfo(_layout.Target(entry.Path)).SetAccessControl(security);
            }
            AssertProtectedFilesUnchanged();
            foreach (var entry in _entries.Where(entry => !entry.Directory))
            {
                using var restored = UpdateDataFiles.ReadLocked(_layout.Target(entry.Path));
                if (restored.Length != entry.Size || Hash(restored) != entry.Sha256 || FileAcl(_layout.Target(entry.Path)) != entry.Dacl)
                    throw new InvalidOperationException("update_data_restore_verification_failed");
            }
            if (DirectoryAcl(_layout.Root) != _rootDacl || _entries.Where(entry => entry.Directory)
                .Any(entry => DirectoryAcl(_layout.Target(entry.Path)) != entry.Dacl))
                throw new InvalidOperationException("update_data_restore_acl_mismatch");
            var restoredFiles = Inventory(_layout, _held).Where(entry => !entry.Directory).Select(entry => entry.Path).ToArray();
            if (!restoredFiles.SequenceEqual(_entries.Where(entry => !entry.Directory).Select(entry => entry.Path)))
                throw new InvalidOperationException("update_data_restore_inventory_changed");
            return preserved.DirectoryPath;
        }
        finally { foreach (var file in locks) file.Dispose(); }
    }

    private static List<(string Path, bool Directory)> Inventory(UpdateDataLayout layout, List<IDisposable> pins)
    {
        var result = new List<(string Path, bool Directory)>();
        Visit(layout.Root);
        return result;
        void Visit(string directory)
        {
            foreach (var path in Directory.EnumerateFileSystemEntries(directory).Order(StringComparer.OrdinalIgnoreCase))
            {
                if (layout.IsExcluded(path)) continue;
                var attributes = File.GetAttributes(path);
                if ((attributes & FileAttributes.ReparsePoint) != 0) throw new InvalidOperationException("update_data_reparse_point");
                var isDirectory = (attributes & FileAttributes.Directory) != 0;
                result.Add((layout.Relative(path), isDirectory));
                if (!isDirectory) continue;
                pins.Add(UpdateDataFiles.PinDirectory(path));
                Visit(path);
            }
        }
    }
    private static string Hash(Stream stream) => Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
    private static void RequireArchiveSecurity(string path, DirectorySecurity expected)
    {
        var actual = new DirectoryInfo(path).GetAccessControl(AccessControlSections.Access | AccessControlSections.Owner);
        string[] Rules(DirectorySecurity security) => security.GetAccessRules(true, true, typeof(SecurityIdentifier))
            .Cast<FileSystemAccessRule>().Select(rule => $"{rule.IdentityReference.Value}|{rule.AccessControlType}|{rule.FileSystemRights}|{rule.InheritanceFlags}|{rule.PropagationFlags}|{rule.IsInherited}")
            .Order(StringComparer.Ordinal).ToArray();
        var expectedOwner = expected.GetOwner(typeof(SecurityIdentifier));
        if (!actual.AreAccessRulesProtected || !Rules(actual).SequenceEqual(Rules(expected)) ||
            (expectedOwner is not null && !expectedOwner.Equals(actual.GetOwner(typeof(SecurityIdentifier)))))
            throw new InvalidOperationException("update_data_archive_acl_invalid");
    }
    private static string FileAcl(string path) => new FileInfo(path).GetAccessControl(AccessControlSections.Access).GetSecurityDescriptorSddlForm(AccessControlSections.Access);
    private static string DirectoryAcl(string path) => new DirectoryInfo(path).GetAccessControl(AccessControlSections.Access).GetSecurityDescriptorSddlForm(AccessControlSections.Access);
    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        foreach (var item in _held.AsEnumerable().Reverse()) item.Dispose();
    }
}
