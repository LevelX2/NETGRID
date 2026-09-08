using System.Diagnostics;
using Microsoft.Win32;
using Netgrid.Windows;
using Netgrid.Updater;

internal static class VerificationTests
{
    private const string Prefix = @"Software\NETGRID-UpdateVerification-Tests\";
    private static int checks;

    internal static async Task<bool> TryChildAsync(string[] args)
    {
        if (args is ["--verification-owner-child"])
        {
            Console.WriteLine("READY");
            await Console.In.ReadLineAsync();
            return true;
        }
        if (args is not ["--verification-child", var fixturePath, var mode, var root, var lease, var session]) return false;
        if (!fixturePath.StartsWith(Prefix, StringComparison.Ordinal) ||
            !Guid.TryParseExact(fixturePath[Prefix.Length..], "N", out _))
            throw new InvalidOperationException("fixture_scope_invalid");
        using var fixture = Registry.CurrentUser.OpenSubKey(fixturePath, writable: false)
            ?? throw new InvalidOperationException("fixture_missing");
        await UpdateVerification.AcceptPermitAsync(fixture, root, lease, session);
        Assert(InstallationGate.IsCurrentVerificationAllowed(fixture, root, lease), "child_exact_permit");
        if (mode == "revoked")
        {
            using var deadline = new CancellationTokenSource(TimeSpan.FromSeconds(15));
            while (InstallationGate.IsCurrentVerificationAllowed(fixture, root, lease))
                await Task.Delay(20, deadline.Token);
            Console.WriteLine("REVOKED");
            Environment.ExitCode = 2;
        }
        else if (mode is "diagnostic" or "success-diagnostic" or "malformed" or "oversized")
        {
            Console.Error.WriteLine(mode == "malformed" ? "private-text-not-forwarded" : mode == "oversized" ? new string('x', 65536) :
                UpdateVerification.FormatFailure("stop", new InvalidOperationException("launcher_child_stop_failed:server", new TaskCanceledException("private-text-not-forwarded")), false));
            Environment.ExitCode = mode == "success-diagnostic" ? 0 : 2;
        }
        else if (mode == "unhealthy") Environment.ExitCode = 7;
        else if (mode != "healthy") throw new InvalidOperationException("fixture_mode_invalid");
        return true;
    }

    internal static async Task RunAsync()
    {
        Console.WriteLine($"UPDATE_VERIFICATION_DIAGNOSTIC_TESTS_OK checks={await VerificationDiagnosticTests.RunAsync()}");
        var fixturePath = Prefix + Guid.NewGuid().ToString("N");
        try
        {
            using var fixture = Registry.CurrentUser.CreateSubKey(fixturePath, writable: true);
            using var owner = Process.GetCurrentProcess();
            var stamp = owner.StartTime.ToUniversalTime().Ticks;
            var root = Path.Combine(Path.GetTempPath(), "NETGRID-verification-" + Guid.NewGuid().ToString("N"));
            var lease = Guid.NewGuid().ToString("N");
            var foreign = Guid.NewGuid().ToString("N");
            var childId = owner.Id == 101 ? 303 : 101;
            var childStart = DateTime.UtcNow;
            Begin(fixture, root, lease, owner);
            Reject(() => InstallationLease.BeginVerification(fixture, root, foreign, childId, childStart.Ticks), "foreign_begin");
            InstallationLease.BeginVerification(fixture, root, lease, childId, childStart.Ticks);
            var state = InstallationGate.Read(fixture, InstallationGate.KeyFor(root))!;
            Assert(state.Active && state.Phase == InstallationGate.GateState.Verifying, "verification_keeps_outer_active");
            Assert(!InstallationGate.BlocksStart(state, childStart, childId), "exact_child_allowed");
            Assert(InstallationGate.BlocksStart(state, childStart.AddTicks(1), childId), "reused_child_pid_blocked");
            Assert(InstallationGate.BlocksStart(state, childStart, childId + 1), "different_child_blocked");
            Assert(InstallationGate.BlocksStart(state, owner.StartTime.ToUniversalTime(), owner.Id), "owner_not_runtime_exception");
            Assert(!InstallationGate.IsCurrentVerificationAllowed(fixture, root, lease), "caller_not_child");
            Reject(() => InstallationLease.ReleaseOwned(fixture, root, lease), "cannot_release_live_verification");
            Reject(() => InstallationLease.BeginMsi(fixture, root, foreign, Guid.NewGuid().ToString("B").ToUpperInvariant(), lease), "msi_cannot_overlap");
            Reject(() => InstallationLease.EndVerification(fixture, root, foreign), "foreign_end");
            Reject(() => InstallationLease.BeginVerification(fixture, root, lease, childId + 1, childStart.Ticks), "second_verifier_cannot_replace_first");
            Reject(() => InstallationGate.OpenUpdateOwner(fixture, root, lease), "second_operation_cannot_bind_during_verify");
            InstallationLease.EndVerification(fixture, root, lease);
            var ended = InstallationGate.Read(fixture, InstallationGate.KeyFor(root))!;
            Assert(ended.Phase == InstallationGate.GateState.Stopping && ended.OwnerId == owner.Id && ended.OwnerStart == stamp && ended.AllowedParentId == 0,
                "revocation_preserves_outer_owner");
            Assert(InstallationGate.BlocksStart(ended, childStart, childId), "revoked_child_blocked");
            Reject(() => InstallationLease.EndVerification(fixture, root, lease), "duplicate_end");
            Assert(InstallationLease.ReleaseOwned(fixture, root, lease), "release_after_verification");

            foreach (var (pid, time) in new[] { (int.MaxValue, stamp), (owner.Id, stamp + 1) })
            {
                var invalidOwner = new InstallationGate.GateState(lease, InstallationGate.GateState.Verifying, 0,
                    childId, childStart.Ticks, pid, time);
                Assert(InstallationGate.BlocksStart(invalidOwner, childStart, childId), "absent_or_reused_owner_revokes");
            }
            foreach (var fields in new[] { (0, 0L, owner.Id, stamp), (childId, childStart.Ticks, 0, 0L), (owner.Id, stamp, owner.Id, stamp) })
                Reject(() => new InstallationGate.GateState(lease, InstallationGate.GateState.Verifying, 0, fields.Item1, fields.Item2, fields.Item3, fields.Item4), "invalid_verification_identity");

            await OwnerExitAsync(fixture, root + "-owner-exit", lease);
            foreach (var mode in new[] { "healthy", "unhealthy", "revoked", "diagnostic", "success-diagnostic", "malformed", "oversized" })
            {
                await VerifierAsync(fixture, fixturePath, root + "-" + mode, lease, mode, owner);
                await VerifierAsync(fixture, fixturePath, root + "-msi-" + mode, lease, mode, owner, directMsi: true);
            }
        }
        finally
        {
            // Exact random HKCU fixture created above; no product key/data.
            Registry.CurrentUser.DeleteSubKeyTree(fixturePath, throwOnMissingSubKey: false);
        }
        Console.WriteLine($"UPDATE_VERIFICATION_TESTS_OK checks={checks} nativePipes=true registry=isolatedHKCU installationStarted=false");
    }

    private static async Task OwnerExitAsync(RegistryKey fixture, string root, string lease)
    {
        var start = OwnStart();
        start.ArgumentList.Add("--verification-owner-child");
        using var child = Process.Start(start)!;
        _ = child.Handle;
        try
        {
            Assert(await child.StandardOutput.ReadLineAsync() == "READY", "owner_fixture_ready");
            Begin(fixture, root, lease, child);
            using var current = Process.GetCurrentProcess();
            InstallationLease.BeginVerification(fixture, root, lease, current.Id, current.StartTime.ToUniversalTime().Ticks);
            Assert(InstallationGate.IsCurrentVerificationAllowed(fixture, root, lease), "live_owner_permits_current_verifier");
            Assert(!InstallationGate.IsCurrentVerificationAllowed(fixture, root, Guid.NewGuid().ToString("N")), "foreign_lease_cannot_use_current_permit");
            await child.StandardInput.WriteLineAsync("EXIT");
            await child.StandardInput.FlushAsync();
            using var limit = new CancellationTokenSource(TimeSpan.FromSeconds(10));
            await child.WaitForExitAsync(limit.Token);
            Assert(!InstallationGate.IsCurrentVerificationAllowed(fixture, root, lease), "actual_owner_exit_revokes_without_writer");
            Assert(InstallationGate.Read(fixture, InstallationGate.KeyFor(root))!.Active, "owner_exit_does_not_unlock_installation");
            Reject(() => InstallationLease.ReleaseOwned(fixture, root, lease), "owner_exit_does_not_authorize_release");
        }
        finally { if (!child.HasExited) { child.Kill(); await child.WaitForExitAsync(); } }
    }

    private static async Task VerifierAsync(RegistryKey fixture, string fixturePath, string root, string lease, string mode, Process owner, bool directMsi = false)
    {
        var product = Guid.NewGuid().ToString("B").ToUpperInvariant();
        if (directMsi)
        {
            InstallationLease.BeginMsi(fixture, root, lease, product, "");
            InstallationLease.BeginMsiOperation(fixture, root, lease, product);
        }
        else Begin(fixture, root, lease, owner);
        Process? observer = null;
        try
        {
            async Task<bool> Run() => await UpdateVerifier.RunAsync(fixture, root, Path.Combine(root, "runtime.env"), lease, requested =>
            {
                Assert(requested.FileName == Path.Combine(root, "NETGRID.exe") && !requested.UseShellExecute && requested.CreateNoWindow && requested.RedirectStandardError,
                    "exact_headless_image_and_start_mode");
                Assert(requested.ArgumentList.Count == 9 && requested.ArgumentList[0] == "--headless-verify" &&
                    requested.ArgumentList[5] == "--update-lease" && requested.ArgumentList[6] == lease &&
                    requested.ArgumentList[7] == "--verification-session", "explicit_bound_arguments");
                var start = OwnStart();
                foreach (var arg in new[] { "--verification-child", fixturePath, mode, root, lease, requested.ArgumentList[8] }) start.ArgumentList.Add(arg);
                var child = Process.Start(start)!;
                observer = Process.GetProcessById(child.Id);
                _ = observer.Handle;
                return child;
            }, TimeSpan.FromSeconds(mode == "revoked" ? 3 : 10));
            if (mode == "revoked")
            {
                try { await Run(); throw new Exception("verification_expected_timeout_missing"); }
                catch (OperationCanceledException) { checks++; }
            }
            else if (mode is "diagnostic" or "success-diagnostic" or "malformed" or "oversized")
            {
                var expected = mode == "diagnostic" ? "installation_gate_verification_stop_server_timeout_cleanup_ok" :
                    mode == "success-diagnostic" ? "installation_gate_verification_diagnostic_success_conflict" : "installation_gate_verification_diagnostic_invalid";
                try { await Run(); throw new Exception("verification_expected_diagnostic_missing"); }
                catch (InvalidOperationException error) { Assert(error.Message == expected, "bounded_diagnostic_from_actual_child_" + mode); }
            }
            else Assert(await Run() == (mode == "healthy"), "health_exit_classification_" + mode);
            Assert(observer is not null && observer.HasExited, "actual_child_exit_proven_" + mode);
            Assert(observer!.ExitCode == (mode is "healthy" or "success-diagnostic" ? 0 : mode == "unhealthy" ? 7 : 2), "exact_child_exit_" + mode);
            var state = InstallationGate.Read(fixture, InstallationGate.KeyFor(root))!;
            Assert(state.Phase == InstallationGate.GateState.Stopping && state.Lease == lease && state.OwnerId == owner.Id,
                "outer_lease_retained_after_" + mode);
            if (directMsi)
            {
                Assert(state.MsiLease == lease && state.MsiProductCode == product, "direct_msi_binding_retained_" + mode);
                Reject(() => InstallationLease.CompleteMsi(fixture, root, lease, product), "direct_msi_cannot_commit_before_helper_returns");
                InstallationLease.EndMsiOperation(fixture, root, lease, product);
                Assert(InstallationGate.Read(fixture, InstallationGate.KeyFor(root))!.Active, "returning_helper_keeps_msi_blocked");
                // Fixture cleanup only. Real MSI commit additionally requires
                // its transaction's successful backup/verification evidence.
                Assert(InstallationLease.RollbackMsi(fixture, root, lease, product), "fixture_msi_released_after_verifier_exit");
            }
        }
        finally
        {
            if (observer is not null) { if (!observer.HasExited) { observer.Kill(); await observer.WaitForExitAsync(); } observer.Dispose(); }
        }
    }

    private static void Begin(RegistryKey fixture, string root, string lease, Process owner)
    {
        var parent = owner.Id == 101 ? 303 : 101;
        InstallationLease.BeginPreparing(fixture, root, lease, parent, DateTime.UtcNow.Ticks, owner.Id, owner.StartTime.ToUniversalTime().Ticks);
        InstallationLease.StopPrepared(fixture, root, lease);
    }
    private static ProcessStartInfo OwnStart() => new(Environment.ProcessPath!)
    {
        UseShellExecute = false, CreateNoWindow = true, RedirectStandardInput = true,
        RedirectStandardOutput = true, RedirectStandardError = true,
    };
    private static void Assert(bool value, string name)
    {
        if (!value) throw new Exception("verification_test_failed:" + name);
        checks++;
    }
    private static void Reject(Action action, string name)
    {
        try { action(); }
        catch (InvalidOperationException) { checks++; return; }
        throw new Exception("verification_rejection_missing:" + name);
    }
}
