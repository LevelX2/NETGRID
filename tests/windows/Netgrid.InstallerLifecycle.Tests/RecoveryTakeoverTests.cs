using System.Diagnostics;
using Microsoft.Win32;
using Netgrid.Windows;

internal static class RecoveryTakeoverTests
{
    private const string Prefix = @"SOFTWARE\LevelX2\NETGRID.RecoveryTakeover.Tests\";
    private const string Root = @"C:\NETGRID-recovery-takeover-fixture\program";
    internal static bool TryChild(string[] args)
    {
        if (args is not ["--recovery-owner-child", var path, var mode]) return false;
        RequirePath(path);
        using var fixture = Registry.CurrentUser.OpenSubKey(path, writable: true)!;
        using var self = Process.GetCurrentProcess();
        var lease = Guid.NewGuid().ToString("N");
        InstallationLease.BeginPreparing(fixture, Root, lease, int.MaxValue, DateTime.UtcNow.Ticks, self.Id, self.StartTime.ToUniversalTime().Ticks);
        InstallationLease.StopPrepared(fixture, Root, lease);
        InstallationLease.BindRecovery(fixture, Root, new UpdateRecoveryBinding(lease, @"C:\NETGRID-recovery-takeover-fixture\data",
            Guid.NewGuid().ToString("N"), new string('a', 64), new string('b', 64)));
        if (mode == "verifying") InstallationLease.BeginVerification(fixture, Root, lease, int.MaxValue - 1, DateTime.UtcNow.Ticks);
        if (mode == "msi") InstallationLease.BeginMsi(fixture, Root, Guid.NewGuid().ToString("N"), Guid.NewGuid().ToString("B").ToUpperInvariant(), lease);
        Console.WriteLine("READY");
        Console.Out.Flush();
        if (Console.ReadLine() != "EXIT") throw new Exception("recovery_owner_fixture_control_invalid");
        return true;
    }

    internal static int Run()
    {
        var checks = 0;
        foreach (var mode in new[] { "stopping", "verifying", "msi" })
        {
            var path = Prefix + Guid.NewGuid().ToString("N");
            try
            {
                using var fixture = Registry.CurrentUser.CreateSubKey(path, writable: true)!;
                var start = new ProcessStartInfo(Environment.ProcessPath!)
                { UseShellExecute = false, CreateNoWindow = true, RedirectStandardInput = true, RedirectStandardOutput = true };
                foreach (var arg in new[] { "--recovery-owner-child", path, mode }) start.ArgumentList.Add(arg);
                using var child = Process.Start(start) ?? throw new Exception("recovery_owner_fixture_start_failed");
                _ = child.Handle;
                try
                {
                    if (child.StandardOutput.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(15)).GetAwaiter().GetResult() != "READY")
                        throw new Exception("recovery_owner_fixture_not_ready");
                    var state = InstallationGate.Read(fixture, InstallationGate.KeyFor(Root))!;
                    var original = state.Encode();
                    var binding = InstallationLease.ReadRecovery(fixture, Root, state.Lease).Encode();
                    Reject(() => InstallationLease.TakeOverRecovery(fixture, Root, state, () => false),
                        mode == "msi" ? "installation_gate_msi_still_active" : "installation_gate_recovery_owner_alive");
                    Check(!child.HasExited, "live_owner_was_killed");
                    Check(InstallationGate.Read(fixture, InstallationGate.KeyFor(Root))!.Encode() == original, "failed_takeover_changed_authority");
                    child.StandardInput.WriteLine("EXIT"); child.StandardInput.Flush();
                    if (!child.WaitForExit(15000)) throw new Exception("recovery_owner_fixture_exit_unproven");
                    Check(child.ExitCode == 0, "fixture_owner_exit_failed");
                    if (mode == "msi")
                    {
                        Reject(() => InstallationLease.TakeOverRecovery(fixture, Root, state, () => false), "installation_gate_msi_still_active");
                        Check(InstallationLease.CompleteMsi(fixture, Root, state.MsiLease, state.MsiProductCode), "fixture_msi_completion_failed");
                        Reject(() => InstallationLease.TakeOverRecovery(fixture, Root, state, () => false), "installation_gate_recovery_state_changed");
                        state = InstallationGate.Read(fixture, InstallationGate.KeyFor(Root))!;
                    }
                    Reject(() => InstallationLease.TakeOverRecovery(fixture, Root, state, () => true), "installation_gate_recovery_products_remain");
                    InstallationLease.TakeOverRecovery(fixture, Root, state, () => false);
                    using var currentProcess = Process.GetCurrentProcess();
                    var current = InstallationGate.Read(fixture, InstallationGate.KeyFor(Root))!;
                    Check(current.Lease == state.Lease && current.Phase == InstallationGate.GateState.Stopping && current.Active,
                        "recovery_did_not_keep_active_lease");
                    Check(current.OwnerId == currentProcess.Id && current.OwnerStart == currentProcess.StartTime.ToUniversalTime().Ticks &&
                        current.AllowedParentId == 0, "recovery_identity_or_verifier_permit_wrong");
                    Check(InstallationLease.ReadRecovery(fixture, Root, state.Lease).Encode() == binding, "recovery_snapshot_reference_changed");
                    Reject(() => InstallationLease.TakeOverRecovery(fixture, Root, state, () => false), "installation_gate_recovery_state_changed");
                    Reject(() => InstallationLease.TakeOverRecovery(fixture, Root, current, () => false), "installation_gate_recovery_owner_alive");
                    Check(InstallationLease.ReleaseOwned(fixture, Root, state.Lease), "fixture_recovery_completion_failed");
                    Reject(() => InstallationLease.TakeOverRecovery(fixture, Root, current, () => false), "installation_gate_recovery_state_changed");
                }
                finally
                {
                    if (!child.HasExited)
                    {
                        child.Kill();
                        if (!child.WaitForExit(5000)) throw new Exception("recovery_fixture_cleanup_exit_unproven");
                    }
                }
            }
            finally { RequirePath(path); Registry.CurrentUser.DeleteSubKeyTree(path, throwOnMissingSubKey: false); }
            using var absent = Registry.CurrentUser.OpenSubKey(path);
            Check(absent is null, "recovery_fixture_registry_not_removed");
        }
        return checks;
        void Check(bool value, string name) { checks++; if (!value) throw new Exception("recovery_takeover_test_failed:" + name); }
        void Reject(Action action, string code)
        {
            checks++;
            try { action(); }
            catch (InvalidOperationException error) when (error.Message == code) { return; }
            throw new Exception("recovery_takeover_test_accepted:" + code);
        }
    }
    private static void RequirePath(string path)
    {
        if (!path.StartsWith(Prefix, StringComparison.Ordinal) || !Guid.TryParseExact(path[Prefix.Length..], "N", out _))
            throw new Exception("recovery_fixture_scope_invalid");
    }
}
