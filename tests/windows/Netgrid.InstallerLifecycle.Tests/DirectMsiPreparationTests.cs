using System.Diagnostics;
using Microsoft.Win32;
using Netgrid.Windows;

internal static class DirectMsiPreparationTests
{
    internal static async Task<bool> TryChildAsync(string[] args)
    {
        if (args is not ["--msi-peer-fixture", var lease, var parentId, var parentStart, var mode]) return false;
        using var parent = UpdateHandoff.OpenParent(int.Parse(parentId), long.Parse(parentStart), Environment.ProcessPath!);
        using var server = UpdateHandoff.CreateServer(lease);
        Console.WriteLine("READY");
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(20));
        using var peer = await UpdateHandoff.AcceptAsync(server, parent, timeout.Token);
        if (mode == "eof") peer.Dispose();
        else await peer.SendDecisionAsync(mode == "proceed", timeout.Token);
        if (mode != "proceed" && await Console.In.ReadLineAsync() != "exit") throw new Exception("msi_peer_fixture_protocol_invalid");
        return true;
    }

    internal static async Task RunAsync(RegistryKey fixture, Action<bool, string> assert)
    {
        async Task Reject(Task task, string code)
        {
            try { await task; throw new Exception("msi_preparation_test_accepted:" + code); }
            catch (Exception error) when (error.Message == code) { assert(true, code); }
        }
        string Root() => @"C:\NETGRID-direct-msi-fixture-" + Guid.NewGuid().ToString("N");
        foreach (var count in new[] { 0, 2, -1 })
        {
            var root = Root(); var lease = Guid.NewGuid().ToString("N"); var product = Guid.NewGuid().ToString("B").ToUpperInvariant();
            var queries = 0; var absenceChecks = 0;
            var prepare = DirectMsiPreparation.BeginAsync(fixture, root, lease, product, true, () => null,
                () => { absenceChecks++; return false; }, () =>
                {
                    queries++;
                    assert(InstallationGate.Read(fixture, InstallationGate.KeyFor(root))?.Phase == InstallationGate.GateState.Stopping,
                        "offline_query_under_exclusive_stopping_lease");
                    return count;
                });
            if (count == 0) await prepare;
            else await Reject(prepare, count > 0 ? "installation_gate_active_games" : "installation_gate_readiness_invalid");
            assert(queries == 1 && absenceChecks == 1, "offline_query_only_after_absence_check");
            var state = InstallationGate.Read(fixture, InstallationGate.KeyFor(root))!;
            assert(state.Active == (count <= 0), "offline_success_or_unknown_retains_lease_until_transaction_resolved");
            InstallationLease.CompleteMsi(fixture, root, lease, product);
        }
        {
            var root = Root(); var lease = Guid.NewGuid().ToString("N"); var product = Guid.NewGuid().ToString("B").ToUpperInvariant();
            await DirectMsiPreparation.BeginAsync(fixture, root, lease, product, false,
                () => throw new Exception("uninstall_must_not_prepare_games"), () => false,
                () => throw new Exception("uninstall_must_not_query_games"));
            assert(InstallationGate.Read(fixture, InstallationGate.KeyFor(root))!.Active, "explicit_uninstall_retains_stop_lease");
            InstallationLease.CompleteMsi(fixture, root, lease, product);
        }

        using var current = Process.GetCurrentProcess();
        {
            var root = Root(); var lease = Guid.NewGuid().ToString("N"); var product = Guid.NewGuid().ToString("B").ToUpperInvariant();
            await DirectMsiPreparation.BeginAsync(fixture, root, lease, product, true, () => null, () => false,
                () => throw new Exception("same_product_repair_must_work_with_missing_cli"), inspectOffline: false);
            assert(InstallationLease.CompleteMsi(fixture, root, lease, product), "offline_repair_can_restore_missing_binaries");
        }
        if (Path.GetFileNameWithoutExtension(Environment.ProcessPath) != "Netgrid.InstallerLifecycle.Tests")
            throw new Exception("direct_msi_fixture_host_invalid");
        foreach (var mode in new[] { "proceed", "cancel", "eof" })
        {
            var root = Root(); var lease = Guid.NewGuid().ToString("N"); var product = Guid.NewGuid().ToString("B").ToUpperInvariant();
            var start = new ProcessStartInfo(Environment.ProcessPath!)
            {
                UseShellExecute = false, CreateNoWindow = true, RedirectStandardInput = true, RedirectStandardOutput = true
            };
            foreach (var value in new[] { "--msi-peer-fixture", lease, current.Id.ToString(), current.StartTime.ToUniversalTime().Ticks.ToString(), mode }) start.ArgumentList.Add(value);
            using var launcher = Process.Start(start)!;
            var launcherStarted = launcher.StartTime.ToUniversalTime();
            try
            {
                assert(await launcher.StandardOutput.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(10)) == "READY", "direct_msi_actual_launcher_peer_ready");
                var prepare = DirectMsiPreparation.BeginAsync(fixture, root, lease, product, true,
                    () => Process.GetProcessById(launcher.Id), () => !launcher.HasExited,
                    () => throw new Exception("online_path_must_use_launcher_not_second_database_reader"));
                if (mode == "proceed")
                {
                    await prepare.WaitAsync(TimeSpan.FromSeconds(10));
                    assert(launcher.HasExited && launcher.ExitCode == 0, "proceed_requires_actual_launcher_exit");
                    assert(InstallationGate.Read(fixture, InstallationGate.KeyFor(root))?.Phase == InstallationGate.GateState.Stopping,
                        "proceed_holds_msi_lease_before_file_changes");
                }
                else
                {
                    await Reject(prepare, mode == "cancel" ? "installation_gate_active_games" : "update_handoff_frame_incomplete");
                    assert(!launcher.HasExited, "rejected_or_lost_preparation_does_not_stop_original_launcher");
                    var state = InstallationGate.Read(fixture, InstallationGate.KeyFor(root))!;
                    assert(!InstallationGate.BlocksStart(state, launcherStarted, launcher.Id), "original_runtime_exception_preserved");
                    assert(state.Phase == (mode == "cancel" ? InstallationGate.GateState.Completed : InstallationGate.GateState.PreparingMsi),
                        "eof_is_not_a_confirmed_stop");
                }
                // Same owner cleanup used by the MSI rollback callback.
                InstallationLease.RollbackMsi(fixture, root, lease, product);
                assert(!InstallationGate.Read(fixture, InstallationGate.KeyFor(root))!.Active, "msi_rollback_resolves_only_own_preparation");
            }
            finally
            {
                if (!launcher.HasExited) { await launcher.StandardInput.WriteLineAsync("exit"); launcher.StandardInput.Close(); }
                await launcher.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(10));
            }
        }
    }
}
