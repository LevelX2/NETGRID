using System.Diagnostics;
using Microsoft.Win32;
using Netgrid.Windows;

namespace Netgrid.Updater;

internal sealed class UpdateHandoffFailure(Exception cause) : Exception("updater_handoff_failed", cause);

// The sole outer update owner. Failure never implicitly completes a session
// that received Proceed. Only a verified transaction may call Complete.
internal sealed class UpdateSession : IDisposable
{
    private readonly RegistryKey _machine;
    private readonly UpdateRequest _request;
    private readonly bool _ownsRegistry;
    private UpdateSession(RegistryKey machine, UpdateRequest request, bool ownsRegistry)
    { _machine = machine; _request = request; _ownsRegistry = ownsRegistry; }

    public static async Task<UpdateSession?> AcceptAsync(UpdateRequest request)
    {
        var machine = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64);
        string? logDirectory = null;
        try
        {
            using var registration = machine.OpenSubKey(@"SOFTWARE\LevelX2\NETGRID", writable: false);
            if (registration?.GetValue("InstallDirectory") is not string installed ||
                !Path.TrimEndingDirectorySeparator(Path.GetFullPath(installed)).Equals(request.ProgramRoot, StringComparison.OrdinalIgnoreCase) ||
                registration.GetValue("RuntimeDataRoot") is not string dataRoot ||
                !Path.GetFullPath(Path.Combine(dataRoot, "config", "runtime.env")).Equals(request.EnvironmentFile, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("updater_registered_scope_mismatch");
            logDirectory = Path.Combine(dataRoot, "runtime", "logs");
            var result = await AcceptAsync(machine, request, Path.Combine(request.ProgramRoot, "NETGRID.exe"), ownsRegistry: true);
            if (result is null) machine.Dispose();
            return result;
        }
        catch (Exception error)
        {
            machine.Dispose();
            // Only the registry-validated data root is eligible for diagnostics.
            // The initiating launcher owns the user-facing pre-handoff error;
            // an updater dialog would keep its cancellation wait blocked.
            if (logDirectory is not null)
            {
                try
                {
                    Directory.CreateDirectory(logDirectory);
                    var code = error is InvalidOperationException && error.Message.StartsWith("installation_gate_", StringComparison.Ordinal)
                        ? error.Message : error.GetType().Name;
                    File.AppendAllText(Path.Combine(logDirectory, "updater-handoff.log"), $"{DateTimeOffset.UtcNow:O} owner=updater-handoff code={code} hresult=0x{error.HResult:X8}{Environment.NewLine}");
                }
                catch (Exception diagnostic) { throw new UpdateHandoffFailure(new AggregateException("updater_handoff_diagnostic_failed", error, diagnostic)); }
            }
            throw new UpdateHandoffFailure(error);
        }
    }

    internal static async Task<UpdateSession?> AcceptAsync(RegistryKey machine, UpdateRequest request, string parentImage, bool ownsRegistry = false)
    {
        using var parent = UpdateHandoff.OpenParent(request.ParentPid, request.ParentStart, parentImage);
        using var owner = Process.GetCurrentProcess();
        InstallationLease.BeginPreparing(machine, request.ProgramRoot, request.Lease, parent.Id,
            parent.StartTime.ToUniversalTime().Ticks, owner.Id, owner.StartTime.ToUniversalTime().Ticks);
        var proceeded = false;
        try
        {
            using var deadline = new CancellationTokenSource(TimeSpan.FromMinutes(2));
            using var peer = await UpdateHandoff.ConnectAsync(request.Session, parent, deadline.Token);
            proceeded = await peer.ReceiveDecisionAsync(deadline.Token);
            if (!proceeded)
            {
                if (!InstallationLease.ReleaseOwned(machine, request.ProgramRoot, request.Lease))
                    throw new InvalidOperationException("updater_cancel_lease_unresolved");
                return null;
            }
            InstallationLease.StopPrepared(machine, request.ProgramRoot, request.Lease);
            using var stopDeadline = new CancellationTokenSource(TimeSpan.FromSeconds(30));
            await parent.WaitForExitAsync(stopDeadline.Token);
            return new(machine, request, ownsRegistry);
        }
        catch (Exception operation)
        {
            if (!proceeded)
            {
                try
                {
                    var state = InstallationGate.Read(machine, InstallationGate.KeyFor(request.ProgramRoot));
                    if (state?.Phase == InstallationGate.GateState.Preparing && state.Lease == request.Lease &&
                        !InstallationLease.ReleaseOwned(machine, request.ProgramRoot, request.Lease))
                        throw new InvalidOperationException("updater_cancel_lease_unresolved");
                }
                catch (Exception cleanup) { throw new AggregateException("updater_preparation_cancel_failed", operation, cleanup); }
            }
            throw;
        }
    }

    public void Complete()
    {
        if (!InstallationLease.ReleaseOwned(_machine, _request.ProgramRoot, _request.Lease))
            throw new InvalidOperationException("updater_completion_lease_unresolved");
    }
    public void Dispose() { if (_ownsRegistry) _machine.Dispose(); }
}
