using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Win32;

try
{
    // Test-only executable, never part of the product or a GitHub release.
    if (Environment.UserName != "WDAGUtilityAccount") throw new InvalidOperationException("fault_fixture_requires_disposable_sandbox");
    var config = JsonSerializer.Deserialize<FaultConfiguration>(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "fault-fixture.json")), new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
        ?? throw new InvalidOperationException("fault_fixture_configuration_missing");
    var leaf = Path.GetFileName(Path.TrimEndingDirectorySeparator(config.ProgramRoot));
    if (!Regex.IsMatch(leaf, "^NETGRID-E2E-[a-f0-9]{32}$") ||
        !Same(config.ProgramRoot, Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), leaf)) ||
        !Same(config.DataRoot, Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), leaf)))
        throw new InvalidOperationException("fault_fixture_scope_invalid");
    using (var registration = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\LevelX2\NETGRID"))
        if (registration?.GetValue("RuntimeDataRoot") is not string registered || !Same(registered, config.DataRoot))
            throw new InvalidOperationException("fault_fixture_registration_mismatch");
    if (args.Length == 0 || args[0] is not ("--install-update" or "--uninstall-update")) throw new InvalidOperationException("fault_fixture_action_invalid");
    if (args[0] == "--install-update" && (args.Length != 3 || args[1] != "--program-root" || !Same(args[2], config.ProgramRoot)))
        throw new InvalidOperationException("fault_fixture_program_root_mismatch");
    if (args[0] == "--uninstall-update" && args.Length != 1) throw new InvalidOperationException("fault_fixture_uninstall_arguments_invalid");
    using var setupLock = new FileStream(config.RealSetup, FileMode.Open, FileAccess.Read, FileShare.Read);
    if (Convert.ToHexString(SHA256.HashData(setupLock)).ToLowerInvariant() != config.RealSetupSha256)
        throw new InvalidOperationException("fault_fixture_real_setup_hash_mismatch");
    var start = new ProcessStartInfo(config.RealSetup) { UseShellExecute = false, CreateNoWindow = true };
    foreach (var argument in args) start.ArgumentList.Add(argument);
    using var installer = Process.Start(start) ?? throw new InvalidOperationException("fault_fixture_setup_start_failed");
    installer.WaitForExit();
    if (installer.ExitCode != 0) return installer.ExitCode;
    if (args[0] == "--install-update")
    {
        var database = Path.Combine(config.DataRoot, "runtime", "multiplayer", "netgrid.sqlite");
        for (var directory = new DirectoryInfo(Path.GetDirectoryName(database)!); directory is not null; directory = directory.Parent)
            if (directory.Exists && directory.Attributes.HasFlag(FileAttributes.ReparsePoint)) throw new InvalidOperationException("fault_fixture_reparse_path");
        if (!File.Exists(database) || File.GetAttributes(database).HasFlag(FileAttributes.ReparsePoint)) throw new InvalidOperationException("fault_fixture_database_invalid");
        using (var input = File.OpenRead(database))
        {
            var header = new byte[16];
            input.ReadExactly(header);
            if (Encoding.ASCII.GetString(header) != "SQLite format 3\0") throw new InvalidOperationException("fault_fixture_database_not_healthy_before_fault");
        }
        File.WriteAllText(database, "NETGRID disposable test: post-install database corruption", Encoding.ASCII);
        File.WriteAllText(Path.Combine(AppContext.BaseDirectory, "fault-applied.json"), JsonSerializer.Serialize(new { applied = true, database, realSetupSha256 = config.RealSetupSha256 }));
    }
    return 0;
}
catch (Exception exception)
{
    Console.Error.WriteLine($"NETGRID_UPDATE_FAULT_FIXTURE_ERROR {exception.Message}");
    return 2;
}

static bool Same(string left, string right) => Path.TrimEndingDirectorySeparator(Path.GetFullPath(left)).Equals(Path.TrimEndingDirectorySeparator(Path.GetFullPath(right)), StringComparison.OrdinalIgnoreCase);
internal sealed record FaultConfiguration(string ProgramRoot, string DataRoot, string RealSetup, string RealSetupSha256);
