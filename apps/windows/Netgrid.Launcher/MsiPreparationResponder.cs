using Netgrid.Windows;

namespace Netgrid.Launcher;

internal static class MsiPreparationResponder
{
    public static async Task RunAsync(LauncherRuntime runtime, InstallationGate.GateState request, CancellationToken cancellationToken)
    {
        await RunAsync(runtime, request, () => InstallationGate.CurrentMsiPreparation(runtime.ProgramRoot), null, cancellationToken);
    }

    internal static async Task RunAsync(LauncherRuntime runtime, InstallationGate.GateState request,
        Func<InstallationGate.GateState?> readCurrent, UpdatePreparationClient? preparationClient, CancellationToken cancellationToken)
    {
        using var owner = UpdateHandoff.QueriedProcess.Open(request.OwnerId, request.OwnerStart);
        void RequireBinding()
        {
            if (request.Phase != InstallationGate.GateState.PreparingMsi || readCurrent()?.Encode() != request.Encode())
                throw new InvalidOperationException("installation_gate_msi_preparation_binding_invalid");
            owner.RequireAlive();
        }
        RequireBinding();
        using var pipe = UpdateHandoff.CreateServer(request.Lease);
        using var limit = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        limit.CancelAfter(TimeSpan.FromMinutes(2));
        using var peer = await UpdateHandoff.AcceptReadOnlyPeerAsync(pipe, owner, limit.Token);
        RequireBinding();
        await using var prepared = preparationClient == null ? await runtime.PrepareUpdateAsync() : await runtime.PrepareUpdateAsync(preparationClient);
        RequireBinding();
        if (!prepared.Status.Allowed)
        {
            await prepared.CancelAsync();
            await peer.SendDecisionAsync(false, limit.Token);
            return;
        }
        await prepared.StopAsync();
        await peer.SendDecisionAsync(true, limit.Token);
    }
}
