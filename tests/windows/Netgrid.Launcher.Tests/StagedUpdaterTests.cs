using System.Diagnostics;
using System.Reflection;
using System.Security.Cryptography;

internal static class StagedUpdaterTests
{
    public static async Task<int> Run(Assembly assembly)
    {
        var checks = 0;
        var scratch = Path.Combine(Path.GetTempPath(), "NETGRID-staging-test-" + Guid.NewGuid().ToString("N"));
        try
        {
            var program = Path.Combine(scratch, "program");
            var data = Path.Combine(scratch, "data");
            Directory.CreateDirectory(program);
            // Inert Windows CLI, not NETGRID or an installer. /q with a fresh
            // absent name performs only a lookup and returns exit code 1.
            var source = Path.Combine(program, "NETGRID.Updater.exe");
            File.Copy(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "where.exe"), source);
            var type = assembly.GetType("Netgrid.Launcher.StagedUpdater", true)!;
            object Create() => type.GetMethod("Create")!.Invoke(null, [program, data])!;
            string GetPath(object value) => (string)type.GetProperty("Path")!.GetValue(value)!;
            var first = (IDisposable)Create();
            var staged = GetPath(first);
            try
            {
                using var second = (IDisposable)Create();
                Assert(GetPath(second) != staged, "attempt_paths_are_not_reused");
                Assert(staged.StartsWith(Path.Combine(data, "runtime", "updates", "staging") + Path.DirectorySeparatorChar, StringComparison.Ordinal), "staging_scoped");
                Assert(SHA256.HashData(File.ReadAllBytes(source)).SequenceEqual(SHA256.HashData(File.ReadAllBytes(staged))), "locked_copy_matches_source");
                foreach (var path in new[] { source, staged })
                {
                    RejectWrite(() => { using var stream = new FileStream(path, FileMode.Open, FileAccess.Write, FileShare.ReadWrite); }, "write_denied");
                    RejectWrite(() => File.Delete(path), "replacement_denied");
                }
                var attemptDirectory = Path.GetDirectoryName(staged)!;
                foreach (var directory in new[] { attemptDirectory, Path.GetDirectoryName(attemptDirectory)!,
                    Path.Combine(data, "runtime", "updates"), Path.Combine(data, "runtime"), data, program })
                {
                    var movedDirectory = directory + "-moved";
                    if (!Path.GetFullPath(directory).StartsWith(Path.GetFullPath(scratch) + Path.DirectorySeparatorChar, StringComparison.Ordinal) ||
                        Directory.Exists(movedDirectory)) throw new Exception("staging_rename_fixture_scope_invalid");
                    try
                    {
                        Directory.Move(directory, movedDirectory);
                        Directory.Move(movedDirectory, directory);
                        throw new Exception("staging_test_failed:ancestor_directory_rename_allowed");
                    }
                    catch (IOException) { checks++; }
                }
                var start = new ProcessStartInfo(staged) { UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true };
                start.ArgumentList.Add("/q");
                start.ArgumentList.Add("NETGRID-absent-" + Guid.NewGuid().ToString("N"));
                using var process = Process.Start(start)!;
                try
                {
                    await process.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(10));
                    Assert(process.ExitCode == 1, "read_lock_allows_executable_mapping");
                }
                finally { if (!process.HasExited) { process.Kill(); await process.WaitForExitAsync(); } }
            }
            finally { first.Dispose(); }
            using (new FileStream(staged, FileMode.Open, FileAccess.Write, FileShare.None)) Assert(true, "dispose_releases_own_staging_lock");
            using (new FileStream(source, FileMode.Open, FileAccess.Write, FileShare.None)) Assert(true, "dispose_releases_source_lock");
        }
        finally
        {
            var resolved = Path.GetFullPath(scratch);
            if (Path.GetDirectoryName(resolved) != Path.TrimEndingDirectorySeparator(Path.GetFullPath(Path.GetTempPath())) ||
                !Path.GetFileName(resolved).StartsWith("NETGRID-staging-test-", StringComparison.Ordinal)) throw new Exception("staging_test_cleanup_scope_invalid");
            if (Directory.Exists(resolved)) Directory.Delete(resolved, recursive: true);
        }
        return checks;
        void Assert(bool value, string name) { if (!value) throw new Exception("staging_test_failed:" + name); checks++; }
        void RejectWrite(Action action, string name)
        {
            try { action(); }
            catch (IOException) { checks++; return; }
            throw new Exception("staging_rejection_missing:" + name);
        }
    }
}
