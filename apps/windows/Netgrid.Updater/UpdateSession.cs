using System.Diagnostics;
using Microsoft.Win32;
using Netgrid.Windows;

namespace Netgrid.Updater;

internal sealed class UpdateHandoffFailure(Exception cause) : Exception("updater_handoff_failed", cause);
internal sealed class UpdateRestartFailure(Exception cause) : Exception(
    $"updater_restart_failed:{cause.GetType().Name}:{(cause is System.ComponentModel.Win32Exception native ? native.NativeErrorCode : cause.HResult)}", cause);

// The sole outer update owner. Failure never implicitly completes a session
// that received Proceed. Only a verified transaction may call Complete.
internal sealed class UpdateSession : IDisposable
{
    private readonly RegistryKey _machine;
    private readonly UpdateRequest _request;
    private readonly bool _ownsRegistry;
    private readonly OriginalUserRestart? _restart;
    private bool _completed;
    private UpdateSession(RegistryKey machine, UpdateRequest request, bool ownsRegistry, OriginalUserRestart? restart)
    { _machine = machine; _request = request; _ownsRegistry = ownsRegistry; _restart = restart; }

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
                    var code = DiagnosticCode(error);
                    var nativeCode = error is System.ComponentModel.Win32Exception native ? native.NativeErrorCode.ToString(System.Globalization.CultureInfo.InvariantCulture) : "none";
                    File.AppendAllText(Path.Combine(logDirectory, "updater-handoff.log"), $"{DateTimeOffset.UtcNow:O} owner=updater-handoff code={code} hresult=0x{error.HResult:X8} native={nativeCode}{Environment.NewLine}");
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
        OriginalUserRestart? restart = null;
        var acquired = false;
        var transferred = false;
        var proceeded = false;
        try
        {
            if (request.Restart)
            {
                OriginalUserRestart.RequireLaunchPrivilege();
                restart = OriginalUserRestart.Capture(parent);
            }
            InstallationLaunchFence.Execute(request.ProgramRoot, () =>
            {
                if (parent.HasExited) throw new InvalidOperationException("installation_gate_parent_exited");
                InstallationLease.BeginPreparing(machine, request.ProgramRoot, request.Lease, parent.Id,
                    parent.StartTime.ToUniversalTime().Ticks, owner.Id, owner.StartTime.ToUniversalTime().Ticks);
                acquired = true;
            });
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
            var result = new UpdateSession(machine, request, ownsRegistry, restart);
            transferred = true;
            return result;
        }
        catch (Exception operation)
        {
            if (acquired && !proceeded)
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
        finally { if (!transferred) restart?.Dispose(); }
    }

    public void BindRecovery(string dataRoot, string snapshotId, string manifestSha256, string previousSetupSha256) =>
        InstallationLease.BindRecovery(_machine, _request.ProgramRoot,
            new UpdateRecoveryBinding(_request.Lease, dataRoot, snapshotId, manifestSha256, previousSetupSha256));

    public UpdateDataSnapshot OpenRecoverySnapshot(UpdateDataLayout layout)
    {
        using var owner = InstallationGate.OpenUpdateOwner(_machine, _request.ProgramRoot, _request.Lease);
        if (owner.Id != Environment.ProcessId) throw new InvalidOperationException("updater_recovery_owner_mismatch");
        var binding = InstallationLease.ReadRecovery(_machine, _request.ProgramRoot, _request.Lease);
        if (!UpdateDataLayout.Same(binding.DataRoot, layout.Root) ||
            !UpdateDataLayout.Same(Path.Combine(binding.DataRoot, "config", "runtime.env"), _request.EnvironmentFile))
            throw new InvalidOperationException("updater_recovery_data_root_mismatch");
        return UpdateDataSnapshot.Reopen(layout, binding.SnapshotId, binding.ManifestSha256);
    }

    public void Complete()
    {
        if (!InstallationLease.ReleaseOwned(_machine, _request.ProgramRoot, _request.Lease))
            throw new InvalidOperationException("updater_completion_lease_unresolved");
        _completed = true;
    }
    public void RestartLauncher()
    {
        if (!_completed || !_request.Restart || _restart is null) throw new InvalidOperationException("updater_restart_not_authorized");
        try { _restart.StartLauncher(_request.ProgramRoot); }
        catch (Exception error) { throw new UpdateRestartFailure(error); }
    }
    internal static string DiagnosticCode(Exception error)
    {
        var message = error.Message;
        return message.Length <= 120 && (message.StartsWith("installation_gate_", StringComparison.Ordinal) || message.StartsWith("updater_restart_", StringComparison.Ordinal)) &&
            message.All(character => character is >= 'a' and <= 'z' or >= '0' and <= '9' or '_') ? message : error.GetType().Name;
    }
    public void Dispose() { try { _restart?.Dispose(); } finally { if (_ownsRegistry) _machine.Dispose(); } }
}
