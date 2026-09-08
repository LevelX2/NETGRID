using System.Diagnostics;
using System.Runtime.ExceptionServices;
using Microsoft.Win32;
using Netgrid.Windows;

namespace Netgrid.Updater;

internal static class UpdateVerifier
{
    public static async Task<bool> RunAsync(string programRoot, string environmentFile, string lease)
    {
        using var machine = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64);
        return await RunAsync(machine, programRoot, environmentFile, lease,
            start => Process.Start(start) ?? throw new InvalidOperationException("update_verifier_start_failed"), TimeSpan.FromMinutes(3));
    }

    internal static async Task<bool> RunAsync(RegistryKey machine, string programRoot, string environmentFile, string lease,
        Func<ProcessStartInfo, Process> startProcess, TimeSpan timeout)
    {
        using var owner = InstallationGate.OpenVerificationOwner(machine, programRoot, lease);
        if (owner.Id != Environment.ProcessId) throw new InvalidOperationException("update_verifier_not_lease_owner");
        var session = Guid.NewGuid().ToString("N");
        using var pipe = UpdateHandoff.CreateServer(session);
        using var deadline = new CancellationTokenSource(timeout);
        using var child = startProcess(UpdateVerification.CreateStart(programRoot, environmentFile, lease, session));
        var granted = false;
        var healthy = false;
        var failures = new List<Exception>();
        try
        {
            _ = child.Handle;
            using var peer = await UpdateHandoff.AcceptAsync(pipe, child, deadline.Token);
            InstallationLease.BeginVerification(machine, programRoot, lease, child.Id, child.StartTime.ToUniversalTime().Ticks);
            granted = true;
            await peer.SendDecisionAsync(proceed: true, deadline.Token);
            await child.WaitForExitAsync(deadline.Token);
            healthy = child.ExitCode == 0;
        }
        catch (Exception error) { failures.Add(error); }
        // Preserve both the operation failure and any cleanup failure. A
        // failed revocation must not skip tracking our already-started child.
        try
        {
            // Revoke via the same authoritative registry gate, not a second
            // permissive switch. A live verifier's normal watcher then stops it.
            if (granted) InstallationLease.EndVerification(machine, programRoot, lease);
        }
        catch (Exception error) { failures.Add(error); }
        pipe.Dispose();
        try
        {
            if (!child.HasExited)
            {
                using var stopping = new CancellationTokenSource(TimeSpan.FromSeconds(45));
                try { await child.WaitForExitAsync(stopping.Token); }
                catch (OperationCanceledException error)
                {
                    // Do not kill the verifier/server and then claim that
                    // rollback is safe. The outer update must remain stopped.
                    throw new InvalidOperationException("update_verifier_exit_unproven", error);
                }
            }
        }
        catch (Exception error) { failures.Add(error); }
        if (failures.Count == 1) ExceptionDispatchInfo.Capture(failures[0]).Throw();
        if (failures.Count > 1) throw new AggregateException("update_verifier_failed", failures);
        return healthy;
    }
}
