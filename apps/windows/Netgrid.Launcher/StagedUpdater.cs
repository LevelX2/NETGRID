using System.Security.Cryptography;
using Microsoft.Win32.SafeHandles;
using Netgrid.Windows;

namespace Netgrid.Launcher;

// Keep both source identity and staged bytes locked through elevation/handoff.
// The attempt path is never reused or overwritten by another update attempt.
internal sealed class StagedUpdater : IDisposable
{
    private readonly FileStream _source;
    private readonly FileStream _staged;
    private readonly List<SafeFileHandle> _directories;
    public string Path { get; }
    private StagedUpdater(string path, FileStream source, FileStream staged, List<SafeFileHandle> directories)
    { Path = path; _source = source; _staged = staged; _directories = directories; }

    public static StagedUpdater Create(string programRoot, string dataRoot)
    {
        var directories = new List<SafeFileHandle>();
        FileStream? source = null;
        FileStream? staged = null;
        try
        {
            programRoot = System.IO.Path.GetFullPath(programRoot);
            dataRoot = System.IO.Path.GetFullPath(dataRoot);
            directories.AddRange(UpdateDataFiles.PinAncestors(programRoot));
            directories.AddRange(UpdateDataFiles.PinAncestors(dataRoot));
            source = UpdateDataFiles.ReadLocked(System.IO.Path.Combine(programRoot, "NETGRID.Updater.exe"));
            var expected = SHA256.HashData(source);
            source.Position = 0;
            var directory = dataRoot;
            foreach (var child in new[] { "runtime", "updates", "staging", "updater-" + Guid.NewGuid().ToString("N") })
            {
                // The parent is already pinned. Inspect and pin each child
                // before creating or opening anything below it.
                directory = System.IO.Path.Combine(directory, child);
                Directory.CreateDirectory(directory);
                directories.Add(UpdateDataFiles.PinDirectory(directory));
            }
            var path = System.IO.Path.Combine(directory, "NETGRID.Updater.exe");
            using (var copy = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None))
            {
                source.CopyTo(copy);
                copy.Flush(flushToDisk: true);
            }
            // Open read-only for executable mapping, then verify while locked.
            // Any replacement in the close/open interval must match the source.
            staged = UpdateDataFiles.ReadLocked(path);
            if (!CryptographicOperations.FixedTimeEquals(expected, SHA256.HashData(staged)))
                throw new InvalidOperationException("updater_staging_hash_mismatch");
            return new(path, source, staged, directories);
        }
        catch
        {
            staged?.Dispose(); source?.Dispose();
            for (var i = directories.Count - 1; i >= 0; i--) directories[i].Dispose();
            throw;
        }
    }

    public void Dispose()
    {
        _staged.Dispose(); _source.Dispose();
        for (var i = _directories.Count - 1; i >= 0; i--) _directories[i].Dispose();
    }
}
