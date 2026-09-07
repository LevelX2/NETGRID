using System.ComponentModel;
using System.Diagnostics;
using System.IO.Pipes;
using Microsoft.Win32;
using Netgrid.Windows;

namespace Netgrid.Launcher;

internal static class UpdateTransfer
{
    public static async Task<int?> RunAsync(LauncherRuntime runtime, string setupPath, string setupHash)
    {
        using var current = Process.GetCurrentProcess();
        var request = new UpdateRequest(current.Id, current.StartTime.ToUniversalTime().Ticks, setupPath, setupHash,
            runtime.ProgramRoot, runtime.EnvironmentFile, Guid.NewGuid().ToString("N"), Guid.NewGuid().ToString("N"), Restart: true);
        UpdateRequest.Parse(request.Arguments());
        using var staged = StagedUpdater.Create(runtime.ProgramRoot, runtime.DataRoot);
        using var pipe = UpdateHandoff.CreateServer(request.Session);
        var start = new ProcessStartInfo(staged.Path) { UseShellExecute = true, Verb = "runas" };
        foreach (var argument in request.Arguments()) start.ArgumentList.Add(argument);
        Process worker;
        try { worker = Process.Start(start) ?? throw new InvalidOperationException("updater_start_failed"); }
        catch (Win32Exception error) when (error.NativeErrorCode == 1223) { return null; } // Explicit Windows consent cancellation.
        using (worker)
        {
            using var machine = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64);
            return await TransferAsync(runtime, request, worker, pipe, machine);
        }
    }

    internal static async Task<int?> TransferAsync(LauncherRuntime runtime, UpdateRequest request, Process worker,
        NamedPipeServerStream pipe, RegistryKey machine, UpdatePreparationClient? preparationClient = null)
    {
        using var current = Process.GetCurrentProcess();
        _ = worker.Handle;
        using var deadline = new CancellationTokenSource(TimeSpan.FromMinutes(2));
        UpdateHandoff.Endpoint? peer = null;
        var stopAttempted = false;
        try
        {
            peer = await AwaitPeerAsync(pipe, worker, deadline.Token);
            var state = InstallationGate.Read(machine, InstallationGate.KeyFor(runtime.ProgramRoot));
            if (state is null || state.Lease != request.Lease || state.Phase != InstallationGate.GateState.Preparing ||
                state.AllowedParentId != current.Id || state.AllowedParentStart != request.ParentStart ||
                state.OwnerId != worker.Id || state.OwnerStart != worker.StartTime.ToUniversalTime().Ticks)
                throw new InvalidOperationException("updater_preparation_binding_invalid");
            await using var prepared = preparationClient is null ? await runtime.PrepareUpdateAsync() : await runtime.PrepareUpdateAsync(preparationClient);
            if (!prepared.Status.Allowed)
            {
                await prepared.CancelAsync();
                await peer.SendDecisionAsync(proceed: false, deadline.Token);
                await worker.WaitForExitAsync(deadline.Token);
                var cancelled = InstallationGate.Read(machine, InstallationGate.KeyFor(runtime.ProgramRoot));
                if (worker.ExitCode != 0 || cancelled is null || cancelled.Lease != request.Lease ||
                    cancelled.Phase != InstallationGate.GateState.Completed || cancelled.AllowedParentId != current.Id ||
                    cancelled.AllowedParentStart != request.ParentStart)
                    throw new InvalidOperationException("updater_cancel_unresolved");
                return prepared.Status.ActiveMatchCount;
            }
            stopAttempted = true;
            await prepared.StopAsync();
            await peer.SendDecisionAsync(proceed: true, deadline.Token);
            return 0; // Caller must exit this already-terminal launcher.
        }
        catch (Exception operation)
        {
            // Closing the pipe before Proceed prevents a transaction. Once
            // our runtime is terminal (including an ambiguous Ack), never
            // resume it or await a worker that is waiting for our exit.
            peer?.Dispose();
            pipe.Dispose();
            if (!stopAttempted && !runtime.IsTerminallyStopping)
            {
                using var cancelDeadline = new CancellationTokenSource(TimeSpan.FromSeconds(35));
                try { await worker.WaitForExitAsync(cancelDeadline.Token); }
                catch (Exception cleanup) { throw new AggregateException("updater_transfer_cancel_unresolved", operation, cleanup); }
            }
            throw;
        }
        finally { peer?.Dispose(); }
    }

    private static async Task<UpdateHandoff.Endpoint> AwaitPeerAsync(NamedPipeServerStream pipe, Process worker, CancellationToken cancellation)
    {
        using var pending = CancellationTokenSource.CreateLinkedTokenSource(cancellation);
        var accepted = UpdateHandoff.AcceptAsync(pipe, worker, pending.Token);
        var exited = worker.WaitForExitAsync(pending.Token);
        try
        {
            await Task.WhenAny(accepted, exited);
            if (accepted.IsCompleted) return await accepted;
            pending.Cancel();
            try { using var unused = await accepted; }
            catch (OperationCanceledException) when (pending.IsCancellationRequested) { }
            throw new InvalidOperationException("updater_handoff_worker_exited");
        }
        finally
        {
            pending.Cancel();
            try { await exited; }
            catch (OperationCanceledException) when (pending.IsCancellationRequested) { }
        }
    }
}
