#nullable enable
using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Win32;

namespace Netgrid.Windows
{
    internal static class DirectMsiPreparation
    {
        // Called before any file mutation. Runtime stop remains the launcher's
        // responsibility; a direct MSI never kills another product process.
        internal static async Task BeginAsync(RegistryKey machine, string root, string lease, string productCode,
            bool protectGames, Func<Process?> findLauncher, Func<bool> processesRemain, Func<int> offlineActiveCount, bool inspectOffline = true)
        {
            Process? launcher = null;
            using (var owner = Process.GetCurrentProcess())
            try
            {
                InstallationLaunchFence.Execute(root, () =>
                {
                    launcher = protectGames ? findLauncher() : null;
                    if (launcher == null) InstallationLease.BeginMsi(machine, root, lease, productCode, "");
                    else
                    {
                        var handle = launcher.Handle;
                        if (launcher.HasExited) throw new InvalidOperationException("installation_gate_parent_exited");
                        InstallationLease.BeginMsiPreparation(machine, root, lease, productCode, launcher.Id,
                            launcher.StartTime.ToUniversalTime().Ticks, owner.Id, owner.StartTime.ToUniversalTime().Ticks);
                    }
                });
                if (launcher != null)
                {
                    using (var limit = new CancellationTokenSource(TimeSpan.FromMinutes(2)))
                    using (var peer = await UpdateHandoff.ConnectAsync(lease, launcher, limit.Token))
                    {
                        if (!await peer.ReceiveDecisionAsync(limit.Token))
                        {
                            if (!InstallationLease.RollbackMsi(machine, root, lease, productCode))
                                throw new InvalidOperationException("installation_gate_msi_cancel_unresolved");
                            throw new InvalidOperationException("installation_gate_active_games");
                        }
                    }
                    InstallationLease.StopMsiPrepared(machine, root, lease, productCode);
                }
                var elapsed = Stopwatch.StartNew();
                while (processesRemain())
                {
                    if (elapsed.Elapsed > TimeSpan.FromSeconds(45))
                        throw new InvalidOperationException("installation_gate_runtime_stop_timeout");
                    await Task.Delay(200);
                }
                // Same-product repair may restore a missing Node/CLI binary.
                // It changes no version or stored game schema, so only an active
                // runtime needs preparation; a version change also checks SQLite.
                if (protectGames && inspectOffline && launcher == null)
                {
                    var count = offlineActiveCount();
                    if (count < 0) throw new InvalidOperationException("installation_gate_readiness_invalid");
                    if (count > 0)
                    {
                        if (!InstallationLease.CompleteMsi(machine, root, lease, productCode))
                            throw new InvalidOperationException("installation_gate_msi_cancel_unresolved");
                        throw new InvalidOperationException("installation_gate_active_games");
                    }
                }
            }
            finally { launcher?.Dispose(); }
        }
    }
}
