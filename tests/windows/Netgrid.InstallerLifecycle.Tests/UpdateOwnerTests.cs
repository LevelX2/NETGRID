using System.Diagnostics;
using Microsoft.Win32;
using Netgrid.Windows;

internal static class UpdateOwnerTests
{
    public static void Run(RegistryKey fixture, string program, Action<bool, string> assert, Action<Action, string> reject)
    {
        using var current = Process.GetCurrentProcess();
        var start = current.StartTime.ToUniversalTime().Ticks;
        var parentId = current.Id == 101 ? 303 : 101;
        var root = program + "-live-owner";
        var lease = Guid.NewGuid().ToString("N");
        var wrong = Guid.NewGuid().ToString("N");
        reject(() => InstallationGate.OpenUpdateOwner(fixture, root, lease), "installation_gate_update_owner_missing");
        InstallationLease.BeginPreparing(fixture, root, lease, parentId, start - 1, current.Id, start);
        reject(() => InstallationGate.OpenUpdateOwner(fixture, root, lease), "installation_gate_update_owner_missing");
        InstallationLease.StopPrepared(fixture, root, lease);
        using (var opened = InstallationGate.OpenUpdateOwner(fixture, root, lease))
            assert(opened.Id == current.Id && !opened.HasExited && opened.StartTime.ToUniversalTime().Ticks == start, "owner_binding_holds_exact_live_process");
        reject(() => InstallationGate.OpenUpdateOwner(fixture, root, wrong), "installation_gate_update_owner_missing");
        var product = Guid.NewGuid().ToString("B").ToUpperInvariant();
        InstallationLease.BeginMsi(fixture, root, wrong, product, lease);
        reject(() => InstallationGate.OpenUpdateOwner(fixture, root, lease), "installation_gate_update_owner_missing");
        InstallationLease.CompleteMsi(fixture, root, wrong, product);
        using (InstallationGate.OpenUpdateOwner(fixture, root, lease)) assert(true, "next_child_can_bind_same_owner_after_msi_completion");
        InstallationLease.ReleaseOwned(fixture, root, lease);
        reject(() => InstallationGate.OpenUpdateOwner(fixture, root, lease), "installation_gate_update_owner_missing");

        foreach (var (suffix, pid, time) in new[] { ("-reused", current.Id, start + 1), ("-absent", int.MaxValue, start) })
        {
            var childRoot = root + suffix;
            InstallationLease.BeginPreparing(fixture, childRoot, lease, parentId, start - 1, pid, time);
            InstallationLease.StopPrepared(fixture, childRoot, lease);
            reject(() => InstallationGate.OpenUpdateOwner(fixture, childRoot, lease), "installation_gate_update_owner_missing");
        }
    }
}
