using System.Diagnostics;
using Microsoft.Win32;
using Netgrid.Windows;

internal static class MsiPreparationLeaseTests
{
    internal static void Run(RegistryKey fixture, Action<bool, string> assert, Action<Action, string> reject)
    {
        var root = @"C:\NETGRID-msi-preparation-fixture-" + Guid.NewGuid().ToString("N");
        var lease = Guid.NewGuid().ToString("N");
        var product = Guid.NewGuid().ToString("B").ToUpperInvariant();
        var other = Guid.NewGuid().ToString("N");
        var foreignProduct = Guid.NewGuid().ToString("B").ToUpperInvariant();
        using var parent = Process.GetCurrentProcess();
        var started = parent.StartTime.ToUniversalTime();
        InstallationGate.GateState Read() => InstallationGate.Read(fixture, InstallationGate.KeyFor(root))!;
        void Prepare(string value) => InstallationLease.BeginMsiPreparation(fixture, root, value, product,
            parent.Id, started.Ticks, parent.Id + 1, started.Ticks + 1);
        Prepare(lease);
        var initial = Read();
        assert(initial.Phase == InstallationGate.GateState.PreparingMsi && initial.Active, "msi_preparation_phase");
        assert(!InstallationGate.BlocksStart(initial, started, parent.Id), "msi_preparation_preserves_original_games");
        assert(InstallationGate.BlocksStart(initial, started, parent.Id + 2), "msi_preparation_blocks_other_launchers");
        assert(InstallationGate.BlocksStart(initial, started.AddTicks(1), parent.Id), "msi_preparation_rejects_reused_pid");
        assert(InstallationGate.CurrentMsiPreparation(fixture, root)?.Encode() == initial.Encode(), "original_launcher_receives_msi_request");
        reject(() => Prepare(other), "installation_gate_already_owned");
        reject(() => InstallationLease.RequireMsi(fixture, root, lease, product), "installation_gate_msi_owner_missing");
        reject(() => InstallationLease.StopPrepared(fixture, root, lease), "installation_gate_preparation_owner_missing");
        reject(() => InstallationLease.StopMsiPrepared(fixture, root, other, product), "installation_gate_msi_preparation_owner_missing");
        reject(() => InstallationLease.StopMsiPrepared(fixture, root, lease, foreignProduct), "installation_gate_msi_preparation_owner_missing");
        reject(() => InstallationLease.ReleaseOwned(fixture, root, lease), "installation_gate_msi_still_active");
        assert(!InstallationLease.CompleteMsi(fixture, root, other, product), "foreign_msi_cannot_cancel_preparation");
        assert(!InstallationLease.CompleteMsi(fixture, root, lease, foreignProduct), "foreign_product_cannot_cancel_preparation");
        assert(!InstallationLease.CompleteMsi(fixture, root, lease, product), "commit_cannot_certify_unconfirmed_preparation");
        assert(Read().Encode() == initial.Encode(), "rejected_preparation_mutations_preserve_binding");
        assert(InstallationLease.RollbackMsi(fixture, root, lease, product), "preparation_cancel_completes");
        assert(!Read().Active && !InstallationGate.BlocksStart(Read(), started, parent.Id), "cancel_keeps_original_runtime_allowed");
        assert(InstallationGate.CurrentMsiPreparation(fixture, root) == null, "cancelled_request_not_dispatched_again");
        Prepare(other);
        InstallationLease.StopMsiPrepared(fixture, root, other, product);
        var stopping = Read();
        assert(stopping.Phase == InstallationGate.GateState.Stopping && stopping.OwnerId == 0 && stopping.MsiLease == other,
            "confirmed_stop_owned_by_standalone_msi_not_outer_updater");
        assert(InstallationGate.BlocksStart(stopping, started, parent.Id), "confirmed_stop_revokes_original_exception");
        assert(InstallationLease.CompleteMsi(fixture, root, other, product) && !Read().Active, "standalone_commit_completes_after_confirmed_stop");
        assert(InstallationGate.BlocksStart(Read(), started, parent.Id), "old_launcher_cannot_resume_after_success");

        assert(MsiOfflineReadiness.Parse("{\"ok\":true,\"updateAllowed\":true,\"activeMatchCount\":0}\n") == 0, "offline_empty_response");
        assert(MsiOfflineReadiness.Parse("{\"ok\":true,\"updateAllowed\":false,\"activeMatchCount\":17}\r\n") == 17, "offline_active_response");
        foreach (var invalid in new[] { "", "{}", "null", "{\"ok\":false,\"updateAllowed\":true,\"activeMatchCount\":0}",
            "{\"ok\":true,\"updateAllowed\":true,\"activeMatchCount\":1}", "{\"ok\":true,\"updateAllowed\":false,\"activeMatchCount\":0}",
            "{\"ok\":true,\"updateAllowed\":false,\"activeMatchCount\":-1}", "{\"ok\":true,\"updateAllowed\":false,\"activeMatchCount\":99999999999999999}" })
            reject(() => MsiOfflineReadiness.Parse(invalid), "installation_gate_readiness_invalid");
    }
}
