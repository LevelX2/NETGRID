using System.Diagnostics;
using Microsoft.Win32;
using Netgrid.Windows;
using Netgrid.Updater;

internal static class SessionTests
{
    private const string Prefix = @"Software\NETGRID-UpdateSession-Tests\";
    private static int checks;
    internal static async Task<bool> TryChildAsync(string[] args)
    {
        if (args.Length < 3 || args[0] is not ("--session-launcher" or "--session-worker")) return false;
        var path = args[1];
        if (!path.StartsWith(Prefix, StringComparison.Ordinal) || !Guid.TryParseExact(path[Prefix.Length..], "N", out _))
            throw new Exception("session_fixture_scope_invalid");
        using var fixture = Registry.CurrentUser.OpenSubKey(path, writable: true)!;
        var mode = args[2];
        if (args[0] == "--session-worker")
        {
            try
            {
                var request = UpdateRequest.Parse(args.Skip(3).ToArray());
                using var session = await UpdateSession.AcceptAsync(fixture, request, Environment.ProcessPath!);
                if (session is null) fixture.SetValue("Outcome", "cancelled");
                else
                {
                    try { session.RestartLauncher(); throw new Exception("restart_without_completion_accepted"); }
                    catch (InvalidOperationException error) when (error.Message == "updater_restart_not_authorized") { }
                    Assert(!ProcessExists(request.ParentPid, request.ParentStart), "parent_exit_required_for_admission");
                    var state = InstallationGate.Read(fixture, InstallationGate.KeyFor(request.ProgramRoot))!;
                    Assert(state.Phase == InstallationGate.GateState.Stopping && state.AllowedParentId == 0 && state.OwnerId == Environment.ProcessId,
                        "admission_owns_stopping_lease");
                    fixture.SetValue("Outcome", "admitted");
                    var snapshotId = Guid.NewGuid().ToString("N");
                    session.BindRecovery(Path.Combine(request.ProgramRoot, "data"), snapshotId, new string('a', 64), new string('b', 64));
                    Assert(InstallationLease.ReadRecovery(fixture, request.ProgramRoot, request.Lease).SnapshotId == snapshotId,
                        "session_persists_exact_recovery_binding");
                    if (mode == "proceed")
                    {
                        session.Complete();
                        try { session.RestartLauncher(); throw new Exception("restart_without_request_accepted"); }
                        catch (InvalidOperationException error) when (error.Message == "updater_restart_not_authorized") { }
                    }
                    // abandon intentionally disposes without completing.
                }
                fixture.Flush();
            }
            catch (Exception error) when (error is IOException or InvalidOperationException or OperationCanceledException)
            {
                fixture.SetValue("Outcome", "rejected");
                fixture.Flush();
                Environment.ExitCode = 2;
            }
            return true;
        }
        using var current = Process.GetCurrentProcess();
        var root = (string)fixture.GetValue("Root")!;
        var requestForWorker = new UpdateRequest(current.Id, current.StartTime.ToUniversalTime().Ticks,
            Path.Combine(root, "setup.exe"), new string('a', 64), root, Path.Combine(root, "runtime.env"),
            Guid.NewGuid().ToString("N"), Guid.NewGuid().ToString("N"), false);
        using var pipe = UpdateHandoff.CreateServer(requestForWorker.Session);
        var start = OwnStart();
        foreach (var arg in new[] { "--session-worker", path, mode }.Concat(requestForWorker.Arguments())) start.ArgumentList.Add(arg);
        using var worker = Process.Start(start)!;
        _ = worker.Handle;
        using var deadline = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        using var peer = await UpdateHandoff.AcceptAsync(pipe, worker, deadline.Token);
        var preparing = InstallationGate.Read(fixture, InstallationGate.KeyFor(root))!;
        Assert(preparing.Phase == InstallationGate.GateState.Preparing && preparing.AllowedParentId == current.Id && preparing.OwnerId == worker.Id,
            "preparation_published_before_connect");
        Console.WriteLine($"WORKER {worker.Id}");
        if (await Console.In.ReadLineAsync() != "GO") throw new Exception("fixture_go_missing");
        if (mode == "eof") pipe.Dispose();
        else await peer.SendDecisionAsync(mode != "cancel", deadline.Token);
        if (mode is "cancel" or "eof") await worker.WaitForExitAsync(deadline.Token);
        // For Proceed, this launcher actually exits. The updater session
        // cannot admit a backup while its original image is still running.
        return true;
    }

    internal static async Task RunAsync()
    {
        foreach (var mode in new[] { "proceed", "cancel", "eof", "abandon" })
        {
            var path = Prefix + Guid.NewGuid().ToString("N");
            Process? worker = null;
            try
            {
                using var fixture = Registry.CurrentUser.CreateSubKey(path, writable: true);
                var root = Path.Combine(Path.GetTempPath(), "NETGRID-session-" + Guid.NewGuid().ToString("N"));
                fixture.SetValue("Root", root);
                var start = OwnStart();
                foreach (var arg in new[] { "--session-launcher", path, mode }) start.ArgumentList.Add(arg);
                using var parent = Process.Start(start)!;
                _ = parent.Handle;
                try
                {
                    var line = await parent.StandardOutput.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(15));
                    Assert(line?.StartsWith("WORKER ", StringComparison.Ordinal) == true, "fixture_worker_bound_" + mode);
                    worker = Process.GetProcessById(int.Parse(line![7..]));
                    _ = worker.Handle;
                    var state = InstallationGate.Read(fixture, InstallationGate.KeyFor(root))!;
                    Assert(state.Phase == InstallationGate.GateState.Preparing && worker.Id == state.OwnerId, "no_backup_before_decision_" + mode);
                    Assert(fixture.GetValue("Outcome") is null, "no_early_admission_" + mode);
                    await parent.StandardInput.WriteLineAsync("GO");
                    await parent.StandardInput.FlushAsync();
                    await parent.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(15));
                    await worker.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(15));
                    Assert(parent.ExitCode == 0, "launcher_fixture_completed_" + mode);
                    Assert(worker.ExitCode == (mode == "eof" ? 2 : 0), "worker_exit_" + mode);
                    var outcome = fixture.GetValue("Outcome") as string;
                    Assert(outcome == (mode == "cancel" ? "cancelled" : mode == "eof" ? "rejected" : "admitted"), "explicit_decision_" + mode);
                    state = InstallationGate.Read(fixture, InstallationGate.KeyFor(root))!;
                    Assert(state.Active == (mode == "abandon"), "only_explicit_completion_releases_" + mode);
                    Assert(state.AllowedParentId == (mode is "cancel" or "eof" ? parent.Id : 0), "only_cancel_preserves_original_exception_" + mode);
                }
                finally { if (!parent.HasExited) { parent.Kill(); await parent.WaitForExitAsync(); } }
            }
            finally
            {
                if (worker is not null) { if (!worker.HasExited) { worker.Kill(); await worker.WaitForExitAsync(); } worker.Dispose(); }
                Registry.CurrentUser.DeleteSubKeyTree(path, throwOnMissingSubKey: false);
            }
        }
        Console.WriteLine($"UPDATE_SESSION_TESTS_OK checks={checks} nativePipes=true actualParentExit=true registry=isolatedHKCU installationStarted=false");
    }

    private static bool ProcessExists(int id, long start)
    {
        Process process;
        try { process = Process.GetProcessById(id); }
        catch (ArgumentException) { return false; }
        using (process) return !process.HasExited && process.StartTime.ToUniversalTime().Ticks == start;
    }
    private static ProcessStartInfo OwnStart() => new(Environment.ProcessPath!)
    { UseShellExecute = false, CreateNoWindow = true, RedirectStandardInput = true, RedirectStandardOutput = true, RedirectStandardError = true };
    private static void Assert(bool value, string name)
    {
        if (!value) throw new Exception("session_test_failed:" + name);
        checks++;
    }
}
