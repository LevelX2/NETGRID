using System.Diagnostics;
using System.Security.Cryptography;
using System.Text.Json;
using Netgrid.Windows;

namespace Netgrid.Updater;

internal static class Program
{
    [STAThread]
    private static int Main(string[] args)
    {
        try
        {
            if (args.Length == 2 && args[0] == "--audit-localization")
            {
                File.WriteAllText(Path.GetFullPath(args[1]), JsonSerializer.Serialize(UiText.Audit));
                return 0;
            }
            if (args.Length == 2 && args[0] == "--audit-contract")
            {
                File.WriteAllText(Path.GetFullPath(args[1]), JsonSerializer.Serialize(new
                {
                    schemaVersion = "netgrid-update-transaction-v1",
                    source = "github-releases-only",
                    requiresExplicitConsent = true,
                    requiresBoundParentAndProceed = true,
                    holdsLeaseThroughBackupAndHealth = true,
                    blocksActiveMatches = true,
                    reverifiesSetupAfterLauncherExit = true,
                    stages = new[] { "verified-download", "controlled-stop", "verified-backup", "msi-major-upgrade", "post-install-health", "program-and-data-rollback", "restart" },
                    failureState = "safely-stopped",
                }));
                return 0;
            }
            if (args.Length == 3 && args[0] == "--verify-artifact")
            {
                var actual = Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(Path.GetFullPath(args[1])))).ToLowerInvariant();
                return actual.Equals(args[2], StringComparison.OrdinalIgnoreCase) ? 0 : 2;
            }
            var options = UpdateRequest.Parse(args);
            ApplicationConfiguration.Initialize();
            return UpdateTransaction.Run(options);
        }
        catch (UpdateHandoffFailure)
        {
            // The original launcher is still the UI owner before handoff.
            // Exit lets it resolve cancellation; never claim it is stopped.
            return 3;
        }
        catch (Exception)
        {
            MessageBox.Show(UiText.Get("updater.failed"), "NETGRID Update", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 3;
        }
    }
}

internal static class UpdateTransaction
{
    public static int Run(UpdateRequest options)
    {
        using var session = UpdateSession.AcceptAsync(options).GetAwaiter().GetResult();
        if (session is null) return 0; // Quittierter Abbruch, keine Installation.
        var stopped = Stopwatch.StartNew();
        while (ProductProcesses.Remain(options.ProgramRoot))
        {
            if (stopped.Elapsed > TimeSpan.FromSeconds(45)) throw new InvalidOperationException("updater_product_processes_remain");
            Thread.Sleep(100);
        }
        var environment = ReadEnvironment(options.EnvironmentFile);
        var dataRoot = Required(environment, "NETGRID_DATA_ROOT");
        ValidateScope(options, dataRoot);
        var logDirectory = Path.Combine(dataRoot, "runtime", "logs");
        Directory.CreateDirectory(logDirectory);
        var logPath = Path.Combine(logDirectory, $"updater-{DateTime.UtcNow:yyyyMMdd-HHmmss}.log");
        try
        {
            return RunVerifiedTransaction(options, session, environment, dataRoot, logPath);
        }
        catch (Exception exception)
        {
            WriteFailure(logPath, exception, environment);
            throw;
        }
    }

    private static int RunVerifiedTransaction(UpdateRequest options, UpdateSession session, IReadOnlyDictionary<string, string> environment, string dataRoot, string logPath)
    {
        var previousSetup = Path.Combine(dataRoot, "config", "updates", "NETGRID-Setup.exe");
        if (!File.Exists(previousSetup)) throw new InvalidOperationException("updater_previous_setup_missing");
        var previousHash = Hash(previousSetup);
        if (!Hash(options.SetupPath).Equals(options.SetupSha256, StringComparison.Ordinal)) throw new InvalidOperationException("updater_setup_hash_mismatch");

        WriteLog(logPath, "backup_started");
        var backup = RunStorage(options.ProgramRoot, environment, "backup-update");
        var backupDirectory = JsonDocument.Parse(backup).RootElement.GetProperty("backupDir").GetString()
            ?? throw new InvalidOperationException("updater_backup_invalid");
        WriteLog(logPath, "backup_verified");

        var installCode = RunVerified(options.SetupPath, options.SetupSha256, ["--install-update", "--program-root", options.ProgramRoot, "--update-lease", options.Lease]);
        if (installCode != 0)
        {
            WriteLog(logPath, $"install_failed:{installCode}");
            RestartIfHealthy(options, session, logPath);
            throw new InvalidOperationException($"updater_install_failed:{installCode}");
        }
        if (VerifyInstalled(options))
        {
            PromoteCachedSetup(dataRoot);
            WriteLog(logPath, "update_verified");
            session.Complete();
            if (options.Restart) StartLauncher(options.ProgramRoot);
            MessageBox.Show(UiText.Get("updater.success"), "NETGRID Update", MessageBoxButtons.OK, MessageBoxIcon.Information);
            return 0;
        }

        WriteLog(logPath, "post_install_health_failed:rollback_started");
        // The authored downgrade replaces the new product inside one MSI
        // transaction. A separate uninstall would remove the registered
        // install identity before the bound old Setup can validate it.
        var reinstallCode = RunVerified(previousSetup, previousHash, ["--install-update", "--program-root", options.ProgramRoot, "--update-lease", options.Lease]);
        if (reinstallCode != 0)
            throw new InvalidOperationException($"updater_program_rollback_failed:install={reinstallCode}");
        RunStorage(options.ProgramRoot, environment, "restore", backupDirectory);
        if (!VerifyInstalled(options)) throw new InvalidOperationException("updater_rollback_health_failed");
        WriteLog(logPath, "rollback_verified");
        session.Complete();
        if (options.Restart) StartLauncher(options.ProgramRoot);
        MessageBox.Show(UiText.Get("updater.rollback"), "NETGRID Update", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        return 2;
    }

    private static bool VerifyInstalled(UpdateRequest options) => UpdateVerifier.RunAsync(options.ProgramRoot, options.EnvironmentFile, options.Lease).GetAwaiter().GetResult();

    private static void RestartIfHealthy(UpdateRequest options, UpdateSession session, string logPath)
    {
        if (!VerifyInstalled(options)) return;
        WriteLog(logPath, "previous_install_verified_after_failure");
        session.Complete();
        if (options.Restart) StartLauncher(options.ProgramRoot);
    }

    private static string RunStorage(string programRoot, IReadOnlyDictionary<string, string> environment, params string[] arguments)
    {
        var node = Path.Combine(programRoot, "runtime", "node", "node.exe");
        var entrypoint = Path.Combine(programRoot, "app", "storage-admin.mjs");
        var start = new ProcessStartInfo(node) { WorkingDirectory = Path.Combine(programRoot, "app"), UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true };
        start.ArgumentList.Add(entrypoint);
        foreach (var argument in arguments) start.ArgumentList.Add(argument);
        foreach (var key in start.Environment.Keys.Where(IsRuntimeOverride).ToArray()) start.Environment.Remove(key);
        start.Environment.Remove("NODE_OPTIONS");
        foreach (var pair in environment) start.Environment[pair.Key] = pair.Value;
        using var process = Process.Start(start) ?? throw new InvalidOperationException("updater_storage_start_failed");
        var stdout = process.StandardOutput.ReadToEnd();
        var stderr = process.StandardError.ReadToEnd();
        process.WaitForExit();
        if (process.ExitCode != 0) throw new InvalidOperationException($"updater_storage_failed:{process.ExitCode}:{SafeError(Redact(stderr, environment))}");
        return stdout;
    }

    private static int Run(string executable, IReadOnlyList<string> arguments)
    {
        if (!File.Exists(executable)) return 2;
        var start = new ProcessStartInfo(executable) { UseShellExecute = true };
        foreach (var argument in arguments) start.ArgumentList.Add(argument);
        using var process = Process.Start(start) ?? throw new InvalidOperationException("updater_process_start_failed");
        process.WaitForExit();
        return process.ExitCode;
    }

    private static int RunVerified(string executable, string expectedHash, IReadOnlyList<string> arguments)
    {
        using var locked = new FileStream(executable, FileMode.Open, FileAccess.Read, FileShare.Read);
        var actual = Convert.ToHexString(SHA256.HashData(locked)).ToLowerInvariant();
        if (!actual.Equals(expectedHash, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("updater_setup_hash_changed");
        return Run(executable, arguments);
    }

    private static void StartLauncher(string programRoot) => Process.Start(new ProcessStartInfo(Path.Combine(programRoot, "NETGRID.exe")) { UseShellExecute = true });

    private static IReadOnlyDictionary<string, string> ReadEnvironment(string path)
    {
        var values = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (var raw in File.ReadAllLines(path))
        {
            var line = raw.Trim();
            if (line.Length == 0 || line.StartsWith('#')) continue;
            var separator = line.IndexOf('=');
            if (separator <= 0) throw new InvalidOperationException("updater_environment_invalid");
            var name = line[..separator].Trim();
            var value = line[(separator + 1)..].Trim();
            if (value.StartsWith('"') || value.EndsWith('"'))
            {
                if (value.Length < 2 || value[0] != '"' || value[^1] != '"')
                    throw new InvalidOperationException("updater_environment_quotes_invalid");
                value = value[1..^1];
            }
            if (!values.TryAdd(name, value))
                throw new InvalidOperationException($"updater_environment_duplicate:{name}");
        }
        return values;
    }

    private static void ValidateScope(UpdateRequest options, string dataRoot)
    {
        var expectedEnvironment = Path.GetFullPath(Path.Combine(dataRoot, "config", "runtime.env"));
        if (!options.EnvironmentFile.Equals(expectedEnvironment, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("updater_environment_scope_invalid");
        var staging = Path.GetFullPath(Path.Combine(dataRoot, "runtime", "updates", "staging")) + Path.DirectorySeparatorChar;
        if (!options.SetupPath.StartsWith(staging, StringComparison.OrdinalIgnoreCase) || !File.Exists(options.SetupPath)) throw new InvalidOperationException("updater_setup_scope_invalid");
    }

    private static void PromoteCachedSetup(string dataRoot)
    {
        var root = Path.Combine(dataRoot, "config", "updates");
        var pending = Path.Combine(root, "NETGRID-Setup.pending.exe");
        var current = Path.Combine(root, "NETGRID-Setup.exe");
        if (!File.Exists(pending)) throw new InvalidOperationException("updater_pending_setup_missing");
        File.Move(pending, current, overwrite: true);
    }

    private static string Hash(string path) => Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(path))).ToLowerInvariant();

    private static string Required(IReadOnlyDictionary<string, string> values, string name) => values.TryGetValue(name, out var value) && !string.IsNullOrWhiteSpace(value) ? Path.GetFullPath(value) : throw new InvalidOperationException($"updater_environment_missing:{name}");
    private static bool IsRuntimeOverride(string key) => key.StartsWith("NETGRID_", StringComparison.OrdinalIgnoreCase) || key.Equals("NODE_ENV", StringComparison.OrdinalIgnoreCase) || key.Equals("HOSTNAME", StringComparison.OrdinalIgnoreCase) || key.Equals("PORT", StringComparison.OrdinalIgnoreCase) || key.Equals("NEXT_PUBLIC_NETGRID_SERVER_URL", StringComparison.OrdinalIgnoreCase);
    private static string SafeError(string value) => value.Length <= 300 ? value.Replace('\r', ' ').Replace('\n', ' ') : value[..300].Replace('\r', ' ').Replace('\n', ' ');
    private static string Redact(string value, IReadOnlyDictionary<string, string> environment)
    {
        var redacted = value;
        foreach (var pair in environment.Where(pair => pair.Key.Contains("TOKEN", StringComparison.OrdinalIgnoreCase) || pair.Key.Contains("SECRET", StringComparison.OrdinalIgnoreCase) || pair.Key.Contains("PASSWORD", StringComparison.OrdinalIgnoreCase)))
            if (!string.IsNullOrEmpty(pair.Value)) redacted = redacted.Replace(pair.Value, "<redacted>", StringComparison.Ordinal);
        return redacted;
    }
    private static void WriteLog(string path, string message) => File.AppendAllText(path, $"{DateTimeOffset.Now:O} {message}{Environment.NewLine}");
    private static void WriteFailure(string path, Exception exception, IReadOnlyDictionary<string, string> environment) =>
        WriteLog(path, $"transaction_failed:{exception.GetType().Name}:{SafeError(Redact(exception.Message, environment))}");
}
