using System.Diagnostics;
using System.Globalization;
using System.Security.Cryptography;
using System.Security.Principal;
using Microsoft.Win32;
using Netgrid.Windows;

namespace Netgrid.Updater;

internal sealed record RecoveryRequest(string ProgramRoot, string Lease, int ParentId, long ParentStart)
{
    public static RecoveryRequest Parse(string[] args)
    {
        if (args.Length != 9 || args[0] != "--repair-worker" || args[1] != "--program-root" || args[3] != "--lease" ||
            args[5] != "--parent-pid" || args[7] != "--parent-start" ||
            !int.TryParse(args[6], NumberStyles.None, CultureInfo.InvariantCulture, out var parent) || parent <= 0 ||
            !long.TryParse(args[8], NumberStyles.None, CultureInfo.InvariantCulture, out var started) || started <= 0 || started > DateTime.MaxValue.Ticks)
            throw new InvalidOperationException("updater_recovery_request_invalid");
        InstallationGate.ValidateLease(args[4]);
        return new(UpdateDataLayout.Absolute(args[2]), args[4], parent, started);
    }
    public string[] Arguments() => ["--repair-worker", "--program-root", ProgramRoot, "--lease", Lease,
        "--parent-pid", ParentId.ToString(CultureInfo.InvariantCulture), "--parent-start", ParentStart.ToString(CultureInfo.InvariantCulture)];
}

internal static class UpdateRecovery
{
    public static int Start(string[] args)
    {
        if (args is not ["--repair-update", "--program-root", var value]) throw new InvalidOperationException("updater_recovery_request_invalid");
        var root = UpdateDataLayout.Absolute(value);
        using var machine = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64);
        var dataRoot = RegisteredDataRoot(machine, root);
        var current = InstallationGate.Read(machine, InstallationGate.KeyFor(root)) ?? throw new InvalidOperationException("updater_recovery_transaction_missing");
        InstallationLease.RequireRecoveryOwnerExited(current);
        if (ProductProcesses.Remain(root)) throw new InvalidOperationException("installation_gate_recovery_products_remain");
        var binding = InstallationLease.ReadRecovery(machine, root, current.Lease);
        if (!UpdateDataLayout.Same(dataRoot, binding.DataRoot) ||
            !UpdateDataLayout.Same(Environment.ProcessPath!, Path.Combine(root, "NETGRID.Updater.exe")))
            throw new InvalidOperationException("updater_recovery_bootstrap_scope_invalid");
        if (MessageBox.Show(UiText.Get("updater.repair_confirm"), "NETGRID", MessageBoxButtons.YesNo, MessageBoxIcon.Warning,
            MessageBoxDefaultButton.Button2) != DialogResult.Yes) return 0;
        using var self = Process.GetCurrentProcess();
        using var staged = Netgrid.Launcher.StagedUpdater.Create(root, dataRoot);
        var request = new RecoveryRequest(root, current.Lease, self.Id, self.StartTime.ToUniversalTime().Ticks);
        var start = new ProcessStartInfo(staged.Path) { UseShellExecute = true, Verb = "runas" };
        foreach (var argument in request.Arguments()) start.ArgumentList.Add(argument);
        using var child = Process.Start(start) ?? throw new InvalidOperationException("updater_recovery_start_failed");
        // The worker waits for this installed image to exit before replacing
        // program files. Do not wait for it or keep a completion dialog here.
        return 0;
    }

    public static void Run(RecoveryRequest request)
    {
        using var identity = WindowsIdentity.GetCurrent();
        if (!new WindowsPrincipal(identity).IsInRole(WindowsBuiltInRole.Administrator))
            throw new InvalidOperationException("updater_recovery_administrator_required");
        using var machine = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64);
        var dataRoot = RegisteredDataRoot(machine, request.ProgramRoot);
        ValidateWorkerImage(request.ProgramRoot, dataRoot);
        WaitForBootstrap(request);
        var expected = InstallationGate.Read(machine, InstallationGate.KeyFor(request.ProgramRoot))
            ?? throw new InvalidOperationException("updater_recovery_transaction_missing");
        InstallationLease.RequireRecoveryOwnerExited(expected);
        var binding = InstallationLease.ReadRecovery(machine, request.ProgramRoot, request.Lease);
        if (expected.Lease != request.Lease || !UpdateDataLayout.Same(binding.DataRoot, dataRoot))
            throw new InvalidOperationException("updater_recovery_binding_mismatch");
        if (ProductProcesses.Remain(request.ProgramRoot)) throw new InvalidOperationException("installation_gate_recovery_products_remain");
        var environmentFile = Path.Combine(dataRoot, "config", "runtime.env");
        var environment = UpdateTransaction.ReadEnvironment(environmentFile);
        using var snapshot = UpdateDataSnapshot.Reopen(new UpdateDataLayout(dataRoot, environment), binding.SnapshotId, binding.ManifestSha256);
        using var previousSetup = snapshot.OpenPreviousSetup(binding.PreviousSetupSha256);
        InstallationLease.TakeOverRecovery(machine, request.ProgramRoot, expected, () => ProductProcesses.Remain(request.ProgramRoot));
        var logDirectory = Path.Combine(dataRoot, "runtime", "logs");
        Directory.CreateDirectory(logDirectory);
        var logPath = Path.Combine(logDirectory, $"updater-recovery-{DateTime.UtcNow:yyyyMMdd-HHmmss}.log");
        try
        {
            Execute(
                () => UpdateTransaction.RunVerified(snapshot.PreviousSetupPath, binding.PreviousSetupSha256,
                    ["--install-update", "--program-root", request.ProgramRoot, "--update-lease", request.Lease]),
                () => snapshot.Restore(),
                () => UpdateVerifier.RunAsync(request.ProgramRoot, environmentFile, request.Lease).GetAwaiter().GetResult(),
                () => ProductProcesses.Remain(request.ProgramRoot),
                () =>
                {
                    snapshot.AssertProtectedFilesUnchanged();
                    UpdateTransaction.PromoteCachedSetup(dataRoot);
                    File.AppendAllText(logPath, $"{DateTimeOffset.UtcNow:O} recovery_health_verified restart=manual-normal-user{Environment.NewLine}");
                    // No elevated restart: the original user's token is gone.
                    // Release all data locks before allowing a fresh shortcut.
                    snapshot.Dispose();
                    if (!InstallationLease.ReleaseOwned(machine, request.ProgramRoot, request.Lease))
                        throw new InvalidOperationException("updater_recovery_completion_failed");
                });
        }
        catch (Exception error) { UpdateTransaction.WriteFailure(logPath, error, environment); throw; }
    }

    // The ordering gate is tested independently of UAC/MSI. Callbacks are only
    // operations owned by the bound recovery worker above, not CLI extensions.
    internal static void Execute(Func<int> reinstall, Action restore, Func<bool> verify, Func<bool> productsRemain, Action complete)
    {
        Absent();
        if (reinstall() != 0) throw new InvalidOperationException("updater_recovery_program_restore_failed");
        Absent();
        restore();
        if (!verify()) throw new InvalidOperationException("updater_recovery_health_failed");
        Absent();
        complete();
        void Absent() { if (productsRemain()) throw new InvalidOperationException("installation_gate_recovery_products_remain"); }
    }

    private static string RegisteredDataRoot(RegistryKey machine, string root)
    {
        using var key = machine.OpenSubKey(@"SOFTWARE\LevelX2\NETGRID", writable: false);
        if (key?.GetValue("InstallDirectory") is not string registered ||
            !UpdateDataLayout.Same(UpdateDataLayout.Absolute(registered), root) || key.GetValue("RuntimeDataRoot") is not string dataRoot)
            throw new InvalidOperationException("updater_recovery_registered_scope_invalid");
        return UpdateDataLayout.Absolute(dataRoot);
    }
    private static void ValidateWorkerImage(string root, string dataRoot)
    {
        var image = Path.GetFullPath(Environment.ProcessPath!);
        var directory = Path.GetDirectoryName(image)!;
        var name = Path.GetFileName(directory);
        if (!UpdateDataLayout.Same(Path.GetDirectoryName(directory)!, Path.Combine(dataRoot, "runtime", "updates", "staging")) ||
            !name.StartsWith("updater-", StringComparison.Ordinal) || !Guid.TryParseExact(name[8..], "N", out _) ||
            Path.GetFileName(image) != "NETGRID.Updater.exe")
            throw new InvalidOperationException("updater_recovery_staging_required");
        using var staged = UpdateDataFiles.ReadLocked(image);
        using var installed = UpdateDataFiles.ReadLocked(Path.Combine(root, "NETGRID.Updater.exe"));
        if (!CryptographicOperations.FixedTimeEquals(SHA256.HashData(staged), SHA256.HashData(installed)))
            throw new InvalidOperationException("updater_recovery_worker_changed");
    }
    private static void WaitForBootstrap(RecoveryRequest request)
    {
        Process parent;
        try { parent = Process.GetProcessById(request.ParentId); }
        catch (ArgumentException) { return; } // Bootstrap has already exited.
        using (parent)
        {
            _ = parent.Handle;
            if (parent.HasExited || parent.StartTime.ToUniversalTime().Ticks != request.ParentStart) return;
            if (!UpdateDataLayout.Same(parent.MainModule!.FileName, Path.Combine(request.ProgramRoot, "NETGRID.Updater.exe")))
                throw new InvalidOperationException("updater_recovery_parent_image_invalid");
            if (!parent.WaitForExit(30000)) throw new InvalidOperationException("updater_recovery_parent_still_running");
        }
    }
}
