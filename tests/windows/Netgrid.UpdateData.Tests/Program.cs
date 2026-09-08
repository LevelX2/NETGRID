using System.ComponentModel;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Text.Json;
using Netgrid.Windows;

if (ReopenTests.TryChild(args)) return;

var scratch = Path.Combine(Path.GetTempPath(), "netgrid-update-data-" + Guid.NewGuid().ToString("N"));
Directory.CreateDirectory(scratch);
var assertions = 0;
try
{
    var fixtureSecurity = new DirectorySecurity();
    fixtureSecurity.SetAccessRuleProtection(true, false);
    using var identity = WindowsIdentity.GetCurrent();
    fixtureSecurity.SetOwner(identity.User!);
    fixtureSecurity.AddAccessRule(new FileSystemAccessRule(identity.User!, FileSystemRights.FullControl,
        InheritanceFlags.ContainerInherit | InheritanceFlags.ObjectInherit, PropagationFlags.None, AccessControlType.Allow));
    var productionSecurity = UpdateDataLayout.PrivateArchiveSecurity();
    var rules = productionSecurity.GetAccessRules(true, true, typeof(SecurityIdentifier)).Cast<FileSystemAccessRule>().ToArray();
    Assert(productionSecurity.AreAccessRulesProtected && rules.Length == 2, "private_acl_not_protected");
    Assert(productionSecurity.GetOwner(typeof(SecurityIdentifier))?.Value == "S-1-5-32-544", "archive_owner_is_original_user");
    Assert(rules.All(rule => rule.AccessControlType == AccessControlType.Allow && rule.FileSystemRights == FileSystemRights.FullControl &&
        (rule.IdentityReference.Value == "S-1-5-18" || rule.IdentityReference.Value == "S-1-5-32-544")), "archive_acl_exposes_secrets");

    var root = NewRoot("Daten mit Umlauten ä");
    var env = EnvironmentFor(root);
    var layout = new UpdateDataLayout(root, env);
    Assert(layout.ProtectedFiles.Count == 2, "protected_owners_missing");
    foreach (var invalid in new[] { @"C:\", "relative", @"\\server\data", @"C:\data:stream", @"C:\data?" })
        Reject(() => new UpdateDataLayout(invalid, env), "invalid_root_accepted");
    foreach (var key in new[] { "NETGRID_SQLITE_STORAGE_PATH", "NETGRID_ACCOUNT_SQLITE_PATH", "NETGRID_MAINTENANCE_AUTH_PATH", "NETGRID_DECK_LIBRARY_PATH", "NETGRID_CONNECTION_AUDIT_LOG_PATH", "NETGRID_STORAGE_BACKUP_DIR" })
    {
        Reject(() => new UpdateDataLayout(root, new Dictionary<string, string>(env) { [key] = Path.Combine(scratch, "outside") }), "external_override_accepted");
        Reject(() => new UpdateDataLayout(root, new Dictionary<string, string>(env) { [key] = "relative" }), "relative_override_accepted");
    }
    Reject(() => new UpdateDataLayout(root, new Dictionary<string, string>(env) { ["NETGRID_STORAGE_BACKUP_DIR"] = Path.Combine(root, "runtime") }), "backup_swallowed_live_data");
    Reject(() => new UpdateDataLayout(root, new Dictionary<string, string>(env) { ["NETGRID_DECK_LIBRARY_PATH"] = layout.ArchiveRoot }), "live_archive_override_accepted");
    Reject(() => layout.Target(@"..\outside"), "manifest_traversal_accepted");
    Reject(() => layout.Target(@"runtime\..\config\runtime.env"), "manifest_alias_accepted");
    Reject(() => layout.Target(@"config\update-backups\anything"), "manifest_archive_target_accepted");
    Reject(() => layout.Target(@"config\installer\product\cached.msi"), "manifest_msi_cache_target_accepted");
    foreach (var key in new[] { "NETGRID_SQLITE_STORAGE_PATH", "NETGRID_ACCOUNT_SQLITE_PATH", "NETGRID_MAINTENANCE_AUTH_PATH", "NETGRID_DECK_LIBRARY_PATH", "NETGRID_CONNECTION_AUDIT_LOG_PATH", "NETGRID_STORAGE_BACKUP_DIR" })
        Reject(() => new UpdateDataLayout(root, new Dictionary<string, string>(env) { [key] = Path.Combine(root, "config", "installer", "overlap") }), "live_or_backup_msi_cache_overlap_accepted");
    Reject(() => new UpdateDataLayout(root, new Dictionary<string, string>(env) { ["NETGRID_RUNTIME_PROFILE"] = "development" }), "development_snapshot_accepted");

    var originals = new Dictionary<string, string>
    {
        [@"runtime\multiplayer\netgrid.sqlite"] = "synthetic-match-database-before",
        [@"runtime\multiplayer\netgrid.sqlite-wal"] = "synthetic-wal-before",
        [@"runtime\accounts\separate.sqlite"] = "synthetic-account-database-before",
        [@"runtime\decks\persönlich.json"] = "synthetic-personal-deck-before",
        [@"card-images\managed\image.png"] = "synthetic-private-image-before",
        [@"card-image-packs\source\pack.json"] = "synthetic-pack-before",
        [@"card-image-import\inbox\image.png"] = "synthetic-inbox-before",
        [@"runtime\maintenance\auth.json"] = "synthetic-never-overwrite-credential",
        [@"runtime\logs\diagnostic.log"] = "synthetic-log-before",
        [@"config\runtime.env"] = "synthetic-never-overwrite-configuration"
    };
    foreach (var pair in originals) Write(root, pair.Key, pair.Value);
    Directory.CreateDirectory(Path.Combine(root, "runtime", "empty"));
    var cache = Write(root, @"config\updates\NETGRID-Setup.exe", "cached-setup");
    var msiCache = Write(root, @"config\installer\base-product\base.msi", "cached-msi-before");
    var historic = Write(root, @"runtime\backups\old\database", "historic-backup");
    var staging = Write(root, @"runtime\updates\staging\candidate.exe", "staged-candidate");
    env["NETGRID_ACCOUNT_SQLITE_PATH"] = Path.Combine(root, "runtime", "accounts", "separate.sqlite");
    layout = new UpdateDataLayout(root, env);
    using (var snapshot = UpdateDataSnapshot.Capture(layout, fixtureSecurity))
    {
        snapshot.Verify();
        Assert(snapshot.ManifestSha256.Length == 64, "snapshot_digest_missing");
        var manifestText = File.ReadAllText(Path.Combine(snapshot.DirectoryPath, "manifest.json"));
        Assert(!manifestText.Contains("synthetic-never-overwrite"), "manifest_contains_secret_contents");
        using var manifest = JsonDocument.Parse(manifestText);
        var entries = manifest.RootElement.GetProperty("Entries").EnumerateArray().ToArray();
        Assert(entries.Count(entry => !entry.GetProperty("Directory").GetBoolean()) == originals.Count, "snapshot_not_full_live_data");
        foreach (var pair in originals)
            Assert(File.ReadAllText(Path.Combine(snapshot.DirectoryPath, "files", pair.Key)) == pair.Value, "snapshot_bytes_changed");
        Assert(!Directory.Exists(Path.Combine(snapshot.DirectoryPath, "files", "runtime", "backups")), "recursive_backup_copied");
        Assert(!Directory.Exists(Path.Combine(snapshot.DirectoryPath, "files", "config", "updates")), "setup_cache_copied");
        Assert(!Directory.Exists(Path.Combine(snapshot.DirectoryPath, "files", "config", "installer")), "msi_cache_copied");
        Assert(!Directory.Exists(Path.Combine(snapshot.DirectoryPath, "files", "runtime", "updates")), "staging_copied");
        Reject(() => File.WriteAllText(Path.Combine(root, "runtime", "maintenance", "auth.json"), "changed"), "credential_not_locked");
        Reject(() => File.Delete(Path.Combine(root, "config", "runtime.env")), "configuration_not_locked");
        Reject(() => Directory.Move(Path.Combine(root, "runtime", "decks"), Path.Combine(root, "renamed")), "source_directory_not_pinned");
        Reject(() => File.WriteAllText(Path.Combine(snapshot.DirectoryPath, "manifest.json"), "tampered"), "manifest_not_locked");
        new DirectoryInfo(Path.Combine(root, "runtime", "decks")).SetAccessControl(fixtureSecurity);
        foreach (var pair in originals.Where(pair => !layout.IsProtected(Path.Combine(root, pair.Key))))
            File.WriteAllText(Path.Combine(root, pair.Key), "failed-upgrade-" + pair.Value);
        File.Delete(Path.Combine(root, "runtime", "multiplayer", "netgrid.sqlite-wal"));
        var added = Write(root, @"runtime\new-data\created.json", "created-by-failed-upgrade");
        File.WriteAllText(cache, "pending-cache-owner-state");
        File.WriteAllText(msiCache, "installer-owned-msi-state");
        var newMsiCache = Write(root, @"config\installer\new-product\new.msi", "new-installer-owned-msi");
        using var failed = UpdateDataSnapshot.Capture(layout, fixtureSecurity);
        var preserved = snapshot.RestoreWithPreserved(failed);
        Assert(preserved == failed.DirectoryPath, "failed_state_location_missing");
        foreach (var pair in originals)
            Assert(File.ReadAllText(Path.Combine(root, pair.Key)) == pair.Value, "restore_bytes_changed");
        Assert(!File.Exists(added), "new_upgrade_file_survived_rollback");
        Assert(File.ReadAllText(Path.Combine(preserved, "files", "runtime", "new-data", "created.json")) == "created-by-failed-upgrade", "added_file_not_recoverable");
        Assert(File.ReadAllText(cache) == "pending-cache-owner-state" && File.ReadAllText(historic) == "historic-backup" && File.ReadAllText(staging) == "staged-candidate", "excluded_owner_changed");
        Assert(File.ReadAllText(msiCache) == "installer-owned-msi-state" && File.ReadAllText(newMsiCache) == "new-installer-owned-msi", "restore_changed_msi_cache_owner_state");
        Assert(Directory.Exists(Path.Combine(root, "runtime", "empty")), "empty_directory_lost");
        snapshot.AssertProtectedFilesUnchanged();
    }

    var absentRoot = NewRoot("never-initialized");
    var absentLayout = new UpdateDataLayout(absentRoot, EnvironmentFor(absentRoot));
    using (var snapshot = UpdateDataSnapshot.Capture(absentLayout, fixtureSecurity))
    {
        Assert(!Directory.Exists(Path.Combine(absentRoot, "runtime")), "snapshot_initialized_runtime");
        Write(absentRoot, @"runtime\maintenance\auth.json", "concurrently-created-credential");
        RejectCode(snapshot.AssertProtectedFilesUnchanged, "update_data_protected_file_changed");
        Assert(File.ReadAllText(Path.Combine(absentRoot, "runtime", "maintenance", "auth.json")) == "concurrently-created-credential", "new_credential_overwritten");
    }

    var emptyRoot = NewRoot("empty-before-upgrade");
    var emptyLayout = new UpdateDataLayout(emptyRoot, EnvironmentFor(emptyRoot));
    using (var snapshot = UpdateDataSnapshot.Capture(emptyLayout, fixtureSecurity))
    {
        var newDatabase = Write(emptyRoot, @"runtime\multiplayer\netgrid.sqlite", "initialized-by-upgrade");
        using var failed = UpdateDataSnapshot.Capture(emptyLayout, fixtureSecurity);
        snapshot.RestoreWithPreserved(failed);
        Assert(!File.Exists(newDatabase), "original_database_absence_not_restored");
        Assert(File.ReadAllText(Path.Combine(failed.DirectoryPath, "files", "runtime", "multiplayer", "netgrid.sqlite")) == "initialized-by-upgrade", "new_database_not_preserved");
    }

    var damagedRoot = NewRoot("damaged-backup");
    Write(damagedRoot, @"runtime\decks\deck.json", "old-deck");
    var damagedLayout = new UpdateDataLayout(damagedRoot, EnvironmentFor(damagedRoot));
    using (var snapshot = UpdateDataSnapshot.Capture(damagedLayout, fixtureSecurity))
    {
        File.WriteAllText(Path.Combine(snapshot.DirectoryPath, "files", "runtime", "decks", "deck.json"), "bad-backup");
        RejectCode(snapshot.Verify, "update_data_snapshot_changed");
        using var failed = UpdateDataSnapshot.Capture(damagedLayout, fixtureSecurity);
        RejectCode(() => snapshot.RestoreWithPreserved(failed), "update_data_snapshot_changed");
        Assert(File.ReadAllText(Path.Combine(damagedRoot, "runtime", "decks", "deck.json")) == "old-deck", "invalid_restore_mutated_target");
    }
    var busyRoot = NewRoot("busy-writer");
    var busyFile = Write(busyRoot, @"runtime\decks\deck.json", "open-for-write");
    using (var writer = new FileStream(busyFile, FileMode.Open, FileAccess.ReadWrite, FileShare.ReadWrite))
        Reject(() => UpdateDataSnapshot.Capture(new UpdateDataLayout(busyRoot, EnvironmentFor(busyRoot)), fixtureSecurity), "live_writer_snapshot_accepted");

    var aclRoot = NewRoot("untrusted-archive-parent");
    var aclLayout = new UpdateDataLayout(aclRoot, EnvironmentFor(aclRoot));
    Directory.CreateDirectory(aclLayout.ArchiveRoot);
    RejectCode(() => UpdateDataSnapshot.Capture(aclLayout, fixtureSecurity), "update_data_archive_acl_invalid");

    var linkedRoot = NewRoot("hardlinked-source");
    var originalLinkFile = Write(linkedRoot, @"runtime\linked.json", "hardlink-fixture");
    if (!Native.CreateHardLinkW(Path.Combine(scratch, "second-hardlink.json"), originalLinkFile, IntPtr.Zero))
        throw new Win32Exception(Marshal.GetLastWin32Error(), "test_hardlink_creation_failed");
    RejectCode(() => UpdateDataSnapshot.Capture(new UpdateDataLayout(linkedRoot, EnvironmentFor(linkedRoot)), fixtureSecurity), "update_data_file_link_or_invalid");

    var junctionRoot = NewRoot("junction-source");
    var outsideRoot = NewRoot("junction-target");
    var outsideFile = Write(outsideRoot, "untouched.txt", "outside-live-data-root");
    var junction = Path.Combine(junctionRoot, "linked-directory");
    Junction(junction, outsideRoot);
    try
    {
        Assert((File.GetAttributes(junction) & FileAttributes.ReparsePoint) != 0, "junction_fixture_not_reparse");
        RejectCode(() => UpdateDataSnapshot.Capture(new UpdateDataLayout(junctionRoot, EnvironmentFor(junctionRoot)), fixtureSecurity), "update_data_reparse_point");
        RejectCode(() => UpdateDataSnapshot.Capture(new UpdateDataLayout(junction, EnvironmentFor(junction)), fixtureSecurity), "update_data_directory_reparse_or_invalid");
        Assert(File.ReadAllText(outsideFile) == "outside-live-data-root", "junction_target_changed");
    }
    finally { Directory.Delete(junction); } // remove only the fixture link, not its target

    var raceRoot = NewRoot("changed-after-preservation");
    var raceFile = Write(raceRoot, @"runtime\decks\deck.json", "original");
    var raceLayout = new UpdateDataLayout(raceRoot, EnvironmentFor(raceRoot));
    using (var before = UpdateDataSnapshot.Capture(raceLayout, fixtureSecurity))
    {
        File.WriteAllText(raceFile, "failed-upgrade");
        using var failed = UpdateDataSnapshot.Capture(raceLayout, fixtureSecurity);
        File.WriteAllText(raceFile, "later-change");
        RejectCode(() => before.RestoreWithPreserved(failed), "update_data_restore_target_changed");
        Assert(File.ReadAllText(raceFile) == "later-change", "restore_changed_unpreserved_data");
    }

    var sqliteRoot = NewRoot("real-sqlite");
    Directory.CreateDirectory(Path.Combine(sqliteRoot, "runtime"));
    var sqliteEnv = EnvironmentFor(sqliteRoot);
    sqliteEnv["NETGRID_SQLITE_STORAGE_PATH"] = Path.Combine(sqliteRoot, "runtime", "matches.sqlite");
    sqliteEnv["NETGRID_ACCOUNT_SQLITE_PATH"] = Path.Combine(sqliteRoot, "runtime", "accounts.sqlite");
    Sqlite("create", sqliteRoot);
    Assert(File.Exists(sqliteEnv["NETGRID_SQLITE_STORAGE_PATH"] + "-wal"), "sqlite_wal_fixture_missing");
    using (var snapshot = UpdateDataSnapshot.Capture(new UpdateDataLayout(sqliteRoot, sqliteEnv), fixtureSecurity))
    {
        foreach (var name in new[] { "matches.sqlite", "accounts.sqlite" })
        {
            File.WriteAllText(Path.Combine(sqliteRoot, "runtime", name), "failed-upgrade-corruption");
            File.Delete(Path.Combine(sqliteRoot, "runtime", name + "-wal"));
            File.Delete(Path.Combine(sqliteRoot, "runtime", name + "-shm"));
        }
        using var failed = UpdateDataSnapshot.Capture(new UpdateDataLayout(sqliteRoot, sqliteEnv), fixtureSecurity);
        snapshot.RestoreWithPreserved(failed);
        Assert(File.ReadAllText(Path.Combine(failed.DirectoryPath, "files", "runtime", "matches.sqlite")) == "failed-upgrade-corruption", "corrupt_database_not_preserved");
        Sqlite("verify", sqliteRoot);
        assertions += 4; // integrity and committed row from each independent database
    }

    assertions += ReopenTests.Run(scratch);
    Console.WriteLine($"WINDOWS_UPDATE_DATA_TEST_OK assertions={assertions} snapshot=full-live-files restore=verified reopen=separate-process protectedFiles=unchanged fixtures=isolated nativeElevation=not-tested");
}
finally
{
    var resolved = Path.GetFullPath(scratch);
    if (Path.GetDirectoryName(resolved) != Path.TrimEndingDirectorySeparator(Path.GetFullPath(Path.GetTempPath())) || !Path.GetFileName(resolved).StartsWith("netgrid-update-data-", StringComparison.Ordinal))
        throw new InvalidOperationException("test_cleanup_scope_invalid");
    Directory.Delete(resolved, true);
}

string NewRoot(string name)
{
    var root = Path.Combine(scratch, name);
    Directory.CreateDirectory(Path.Combine(root, "config"));
    return root;
}
static Dictionary<string, string> EnvironmentFor(string root) => new() { ["NETGRID_RUNTIME_PROFILE"] = "release", ["NETGRID_DATA_ROOT"] = root };
static string Write(string root, string relative, string contents)
{
    var path = Path.Combine(root, relative);
    Directory.CreateDirectory(Path.GetDirectoryName(path)!);
    File.WriteAllText(path, contents);
    return path;
}
void Assert(bool condition, string code)
{
    assertions++;
    if (!condition) throw new InvalidOperationException(code);
}
void Reject(Action action, string code)
{
    assertions++;
    try { action(); }
    catch (Exception exception) when (exception is InvalidOperationException or IOException or Win32Exception or UnauthorizedAccessException) { return; }
    throw new InvalidOperationException(code);
}
void RejectCode(Action action, string expected)
{
    assertions++;
    try { action(); }
    catch (InvalidOperationException exception) when (exception.Message == expected) { return; }
    throw new InvalidOperationException("expected_diagnosis_missing:" + expected);
}
static void Sqlite(string action, string root)
{
    const string script = "import {DatabaseSync} from 'node:sqlite'; import {join} from 'node:path'; " +
        "for(const name of ['matches.sqlite','accounts.sqlite']) { const db = new DatabaseSync(join(process.argv[2],'runtime',name)); " +
        "if(process.argv[1] === 'create') { db.exec('PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0; CREATE TABLE fixture(value TEXT);'); " +
        "db.prepare('INSERT INTO fixture VALUES (?)').run('committed-fixture-value'); } else { " +
        "if(db.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok' || db.prepare('SELECT value FROM fixture').get().value !== 'committed-fixture-value') process.exit(5); db.close(); }} " +
        "process.exit(0);";
    var start = new ProcessStartInfo("node") { UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true };
    start.Environment.Remove("NODE_OPTIONS");
    start.Environment.Remove("NODE_PATH");
    foreach (var argument in new[] { "--input-type=module", "--eval", script, action, root }) start.ArgumentList.Add(argument);
    using var child = Process.Start(start) ?? throw new InvalidOperationException("sqlite_fixture_start_failed");
    var output = child.StandardOutput.ReadToEndAsync();
    var errors = child.StandardError.ReadToEndAsync();
    if (!child.WaitForExit(15000))
    {
        child.Kill();
        if (!child.WaitForExit(5000)) throw new InvalidOperationException("sqlite_fixture_stop_failed");
        throw new InvalidOperationException("sqlite_fixture_timeout");
    }
    Task.WaitAll(output, errors);
    if (child.ExitCode != 0) throw new InvalidOperationException($"sqlite_fixture_failed:{child.ExitCode}:{errors.Result}");
}
static void Junction(string link, string target)
{
    // Native PowerShell creates only a junction between two fresh fixture
    // paths. No elevation, existing product data, or recursive file action.
    var command = "$ErrorActionPreference='Stop'; New-Item -ItemType Junction -Path '" + link.Replace("'", "''") +
        "' -Target '" + target.Replace("'", "''") + "' | Out-Null";
    var start = new ProcessStartInfo("powershell.exe") { UseShellExecute = false, CreateNoWindow = true, RedirectStandardError = true };
    foreach (var argument in new[] { "-NoProfile", "-NonInteractive", "-EncodedCommand", Convert.ToBase64String(System.Text.Encoding.Unicode.GetBytes(command)) })
        start.ArgumentList.Add(argument);
    using var child = Process.Start(start) ?? throw new InvalidOperationException("junction_fixture_start_failed");
    var error = child.StandardError.ReadToEndAsync();
    if (!child.WaitForExit(15000))
    {
        child.Kill();
        if (!child.WaitForExit(5000)) throw new InvalidOperationException("junction_fixture_stop_failed");
        throw new InvalidOperationException("junction_fixture_timeout");
    }
    if (child.ExitCode != 0) throw new InvalidOperationException("junction_fixture_failed:" + error.GetAwaiter().GetResult());
}
internal static class Native
{
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true, ExactSpelling = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool CreateHardLinkW(string name, string existing, IntPtr attributes);
}
