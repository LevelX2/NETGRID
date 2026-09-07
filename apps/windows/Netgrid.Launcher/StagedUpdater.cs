using System.Security.Cryptography;

namespace Netgrid.Launcher;

// Keep both source identity and staged bytes locked through elevation/handoff.
// The attempt path is never reused or overwritten by another update attempt.
internal sealed class StagedUpdater : IDisposable
{
    private readonly FileStream _source;
    private readonly FileStream _staged;
    public string Path { get; }
    private StagedUpdater(string path, FileStream source, FileStream staged) { Path = path; _source = source; _staged = staged; }

    public static StagedUpdater Create(string programRoot, string dataRoot)
    {
        var source = new FileStream(System.IO.Path.Combine(programRoot, "NETGRID.Updater.exe"), FileMode.Open, FileAccess.Read, FileShare.Read);
        FileStream? staged = null;
        try
        {
            var expected = SHA256.HashData(source);
            source.Position = 0;
            var directory = System.IO.Path.Combine(dataRoot, "runtime", "updates", "staging", "updater-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(directory);
            var path = System.IO.Path.Combine(directory, "NETGRID.Updater.exe");
            using (var copy = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None))
            {
                source.CopyTo(copy);
                copy.Flush(flushToDisk: true);
            }
            // Open read-only for executable mapping, then verify while locked.
            // Any replacement in the close/open interval must match the source.
            staged = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read);
            if (!CryptographicOperations.FixedTimeEquals(expected, SHA256.HashData(staged)))
                throw new InvalidOperationException("updater_staging_hash_mismatch");
            return new(path, source, staged);
        }
        catch { staged?.Dispose(); source.Dispose(); throw; }
    }

    public void Dispose() { _staged.Dispose(); _source.Dispose(); }
}
