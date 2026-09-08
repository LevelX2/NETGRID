using System;
using System.Diagnostics;
using System.Reflection;
using Microsoft.Win32;
using Netgrid.Windows;

internal static class MsiHelperExitTests
{
    private const string Prefix = @"SOFTWARE\LevelX2\NETGRID.MsiHelperExit.Tests\";
    private const string Root = @"C:\NETGRID-msi-helper-exit-fixture\program";
    internal static bool TryChild(string[] args)
    {
        if (args.Length == 1 && args[0] == "--msi-helper-peer")
        {
            Console.WriteLine("READY"); Console.Out.Flush();
            if (ReadControl() != "EXIT") throw new Exception("peer_control_invalid");
            return true;
        }
        if (args.Length != 7 || args[0] != "--msi-helper-owner") return false;
        var path = args[1]; var lease = args[2]; var product = args[3];
        var mode = args[4]; var peerId = args[5]; var peerStart = args[6];
        RequirePath(path);
        using var fixture = Registry.CurrentUser.OpenSubKey(path, writable: true)!;
        InstallationLease.BeginMsiOperation(fixture, Root, lease, product);
        InstallationLease.BeginMsiData(fixture, Root, lease, product, @"C:\NETGRID-msi-helper-exit-fixture\data");
        if (mode != "preparing")
            InstallationLease.BindMsiSnapshot(fixture, Root, lease, product, Guid.NewGuid().ToString("N"), new string('a', 64));
        if (mode == "verifying") InstallationLease.BeginVerification(fixture, Root, lease, int.Parse(peerId), long.Parse(peerStart));
        Console.WriteLine("READY"); Console.Out.Flush();
        if (ReadControl() != "EXIT") throw new Exception("helper_control_invalid");
        // Deliberately leave operation ownership behind, as after abrupt exit.
        if (mode == "returned") InstallationLease.EndMsiOperation(fixture, Root, lease, product);
        return true;
    }

    internal static int Run()
    {
        var checks = 0;
        foreach (var mode in new[] { "preparing", "captured", "verifying", "returned" })
        {
            var path = Prefix + Guid.NewGuid().ToString("N");
            var lease = Guid.NewGuid().ToString("N");
            var product = Guid.NewGuid().ToString("B").ToUpperInvariant();
            using var peer = Start("--msi-helper-peer");
            Ready(peer);
            try
            {
                using var fixture = Registry.CurrentUser.CreateSubKey(path, writable: true)!;
                InstallationLease.BeginMsi(fixture, Root, lease, product, "");
                using var child = Start("--msi-helper-owner", path, lease, product, mode,
                    peer.Id.ToString(), peer.StartTime.ToUniversalTime().Ticks.ToString());
                var childStart = child.StartTime.ToUniversalTime().Ticks;
                try
                {
                    Ready(child);
                    var original = State().Encode();
                    using var key = fixture.OpenSubKey(InstallationGate.KeyFor(Root))!;
                    var data = (string)key.GetValue("MsiData")!;
                    // Existing behavior reproduces the dead helper's barrier.
                    if (mode == "captured")
                    {
                        // A real abrupt exit of this test's own retained child,
                        // not a fabricated PID or a hand-written lease record.
                        child.Kill();
                        Check(child.WaitForExit(15000) && child.ExitCode != 0, "abrupt_helper_exit_proven");
                    }
                    else Exit(child);
                    if (mode != "returned")
                    {
                        Reject(() => InstallationLease.BeginMsiOperation(fixture, Root, lease, product),
                            mode == "verifying" ? "installation_gate_msi_owner_missing" : "installation_gate_msi_operation_already_owned");
                        Check(State().Encode() == original, "dead_helper_barrier_preserved");
                    }
                    var method = typeof(InstallationLease).GetMethod("ReturnExitedMsiOperation")
                        ?? throw new Exception("msi_helper_exit_recovery_missing:dead_helper_blocks_native_rollback");
                    bool Return(Process process, long started, Func<bool> remain, string? expectedLease = null, string? expectedProduct = null)
                    {
                        try { return (bool)method.Invoke(null, [fixture, Root, expectedLease ?? lease, expectedProduct ?? product, process, started, remain])!; }
                        catch (TargetInvocationException error) when (error.InnerException is not null)
                        { System.Runtime.ExceptionServices.ExceptionDispatchInfo.Capture(error.InnerException).Throw(); throw; }
                    }
                    Reject(() => Return(peer, peer.StartTime.ToUniversalTime().Ticks, () => false), "installation_gate_msi_helper_alive");
                    if (mode != "returned")
                    {
                        Reject(() => Return(child, childStart + 1, () => false), "installation_gate_msi_helper_identity_invalid");
                        Reject(() => Return(child, childStart, () => false, Guid.NewGuid().ToString("N")), "installation_gate_msi_helper_scope_invalid");
                        Reject(() => Return(child, childStart, () => false, expectedProduct: Guid.NewGuid().ToString("B").ToUpperInvariant()), "installation_gate_msi_helper_scope_invalid");
                        Reject(() => Return(child, childStart, () => true), "installation_gate_msi_data_products_remain");
                        if (mode == "verifying")
                            Reject(() => Return(child, childStart, () => false), "installation_gate_msi_verifier_alive");
                        Check(State().Encode() == original && (string)key.GetValue("MsiData")! == data, "rejections_changed_authority_or_snapshot");
                    }
                    Exit(peer);
                    if (mode != "returned")
                        Reject(() => Return(peer, peer.StartTime.ToUniversalTime().Ticks, () => false), "installation_gate_msi_helper_identity_invalid");
                    Check(Return(child, childStart, () => false) == (mode != "returned"), "returned_state_classification");
                    var current = State();
                    Check(current.Active && current.Phase == InstallationGate.GateState.Stopping && current.Lease == lease &&
                        current.MsiLease == lease && current.MsiProductCode == product && current.OwnerId == 0 && current.AllowedParentId == 0,
                        "only_helper_permit_returned_msi_still_active");
                    Check((string)key.GetValue("MsiData")! == data, "snapshot_binding_not_rewritten");
                    Check(!Return(child, childStart, () => false), "normal_return_is_idempotent");
                    // MSI rollback can now borrow the SAME operation, never a
                    // second lease or a guessed snapshot from another attempt.
                    InstallationLease.BeginMsiOperation(fixture, Root, lease, product);
                    Reject(() => Return(child, childStart, () => false), "installation_gate_msi_helper_identity_invalid");
                    if (mode != "preparing") InstallationLease.MarkMsiData(fixture, Root, lease, product, restored: true);
                    InstallationLease.EndMsiOperation(fixture, Root, lease, product);
                    Check(InstallationLease.RollbackMsi(fixture, Root, lease, product), "same_msi_rollback_can_complete");
                    Check(!State().Active, "rollback_completion_releases_gate");
                    var outer = Guid.NewGuid().ToString("N");
                    var nestedMsi = Guid.NewGuid().ToString("N");
                    using var self = Process.GetCurrentProcess();
                    using var nextParent = Start("--msi-helper-peer");
                    try
                    {
                        Ready(nextParent);
                        InstallationLease.BeginPreparing(fixture, Root, outer, nextParent.Id, nextParent.StartTime.ToUniversalTime().Ticks,
                            self.Id, self.StartTime.ToUniversalTime().Ticks);
                        InstallationLease.StopPrepared(fixture, Root, outer);
                        InstallationLease.BeginMsi(fixture, Root, nestedMsi, product, outer);
                        var outerState = State().Encode();
                        Reject(() => Return(child, childStart, () => false, nestedMsi), "installation_gate_msi_helper_scope_invalid");
                        Check(State().Encode() == outerState, "outer_updater_lease_never_reclaimed");
                        Check(InstallationLease.CompleteMsi(fixture, Root, nestedMsi, product) &&
                            InstallationLease.ReleaseOwned(fixture, Root, outer), "outer_fixture_cleanup");
                        Exit(nextParent);
                    }
                    finally { Cleanup(nextParent); }
                    InstallationGate.GateState State() => InstallationGate.Read(fixture, InstallationGate.KeyFor(Root))!;
                }
                finally { Cleanup(child); }
            }
            finally
            {
                Cleanup(peer);
                RequirePath(path); Registry.CurrentUser.DeleteSubKeyTree(path, throwOnMissingSubKey: false);
            }
            using var absent = Registry.CurrentUser.OpenSubKey(path);
            Check(absent is null, "fixture_removed");
        }
        return checks;
        void Check(bool value, string name) { checks++; if (!value) throw new Exception("msi_helper_exit_test_failed:" + name); }
        void Reject(Action action, string code)
        {
            checks++;
            try { action(); }
            catch (InvalidOperationException error) when (error.Message == code) { return; }
            throw new Exception("msi_helper_exit_test_accepted:" + code);
        }
    }
    private static Process Start(params string[] args)
    {
#if NETFRAMEWORK
        using var self = Process.GetCurrentProcess();
        var executable = self.MainModule!.FileName;
#else
        var executable = Environment.ProcessPath!;
#endif
        var start = new ProcessStartInfo(executable)
        { UseShellExecute = false, CreateNoWindow = true, RedirectStandardInput = true, RedirectStandardOutput = true };
#if NETFRAMEWORK
        start.Arguments = string.Join(" ", Array.ConvertAll(args, value => "\"" + value + "\""));
#else
        foreach (var arg in args) start.ArgumentList.Add(arg);
#endif
        var process = Process.Start(start) ?? throw new Exception("fixture_start_failed");
        _ = process.Handle;
        return process;
    }
    private static void Ready(Process process)
    {
        var ready = process.StandardOutput.ReadLineAsync();
        if (!ready.Wait(TimeSpan.FromSeconds(15)) || ready.GetAwaiter().GetResult() != "READY")
            throw new Exception("fixture_not_ready");
    }
    private static void Exit(Process process)
    {
        process.StandardInput.WriteLine("EXIT"); process.StandardInput.Flush();
        if (!process.WaitForExit(15000) || process.ExitCode != 0) throw new Exception("fixture_exit_unproven");
    }
    private static void Cleanup(Process process)
    {
        if (!process.HasExited) { process.Kill(); if (!process.WaitForExit(5000)) throw new Exception("fixture_cleanup_failed"); }
    }
    private static string? ReadControl()
    {
        // Process.StandardInput is UTF-8 (with a BOM on Framework). Decode
        // that explicit test wire encoding, not the inherited console OEM page.
        using var reader = new System.IO.StreamReader(Console.OpenStandardInput(),
            new System.Text.UTF8Encoding(false, true), detectEncodingFromByteOrderMarks: true);
        return reader.ReadLine();
    }
    private static void RequirePath(string path)
    {
        if (!path.StartsWith(Prefix, StringComparison.Ordinal) || !Guid.TryParseExact(path.Substring(Prefix.Length), "N", out _))
            throw new Exception("fixture_scope_invalid");
    }
}
