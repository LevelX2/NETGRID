using System;
using System.Threading;
using Microsoft.Win32;

namespace Netgrid.Windows
{
    // The only lease writer, shared by the elevated updater and MSI actions.
    // Runtime components link the read-only InstallationGate, never this file.
    internal static class InstallationLease
    {
        public static void Begin(RegistryKey root, string programRoot, string lease)
        {
            Mutate(programRoot, () =>
            {
                InstallationGate.ValidateLease(lease);
                var current = InstallationGate.Read(root, InstallationGate.KeyFor(programRoot));
                if (current?.Active == true) throw new InvalidOperationException("installation_gate_already_owned");
                Write(root, programRoot, new InstallationGate.GateState(lease, InstallationGate.GateState.Stopping,
                    current?.CompletedUtcTicks ?? 0));
                return true;
            });
        }

        public static void BeginPreparing(RegistryKey root, string programRoot, string lease,
            int parentId, long parentStart, int ownerId, long ownerStart)
        {
            Mutate(programRoot, () =>
            {
                var current = InstallationGate.Read(root, InstallationGate.KeyFor(programRoot));
                if (current?.Active == true) throw new InvalidOperationException("installation_gate_already_owned");
                var next = new InstallationGate.GateState(lease, InstallationGate.GateState.Preparing,
                    current?.CompletedUtcTicks ?? 0, parentId, parentStart, ownerId, ownerStart);
                if (InstallationGate.BlocksStart(current, new DateTime(parentStart, DateTimeKind.Utc), parentId))
                    throw new InvalidOperationException("installation_gate_parent_already_blocked");
                Write(root, programRoot, next);
                return true;
            });
        }

        public static void StopPrepared(RegistryKey root, string programRoot, string lease)
        {
            Mutate(programRoot, () =>
            {
                InstallationGate.ValidateLease(lease);
                var current = InstallationGate.Read(root, InstallationGate.KeyFor(programRoot));
                if (current == null || current.Lease != lease || current.Phase != InstallationGate.GateState.Preparing)
                    throw new InvalidOperationException("installation_gate_preparation_owner_missing");
                Write(root, programRoot, new InstallationGate.GateState(lease, InstallationGate.GateState.Stopping,
                    current.CompletedUtcTicks, ownerId: current.OwnerId, ownerStart: current.OwnerStart));
                return true;
            });
        }

        public static bool ReleaseOwned(RegistryKey root, string programRoot, string lease)
        {
            return Mutate(programRoot, () =>
            {
                InstallationGate.ValidateLease(lease);
                var current = InstallationGate.Read(root, InstallationGate.KeyFor(programRoot));
                if (current == null || !current.Active || current.Lease != lease) return false;
                // Cancelling preparation preserves exactly the original live
                // launcher, not every executable born before this timestamp.
                var preserveParent = current.Phase == InstallationGate.GateState.Preparing;
                Write(root, programRoot, new InstallationGate.GateState(lease, InstallationGate.GateState.Completed,
                    Math.Max(DateTime.UtcNow.Ticks, current.CompletedUtcTicks),
                    preserveParent ? current.AllowedParentId : 0, preserveParent ? current.AllowedParentStart : 0));
                return true;
            });
        }

        private static void Write(RegistryKey root, string programRoot, InstallationGate.GateState state)
        {
            using (var key = root.CreateSubKey(InstallationGate.KeyFor(programRoot), writable: true))
            {
                if (key == null) throw new InvalidOperationException("installation_gate_write_failed");
                // Publish the complete phase/identity record as one value;
                // readers never combine partially written sibling properties.
                key.SetValue("Lease", state.Encode(), RegistryValueKind.String);
                key.Flush();
            }
        }

        private static T Mutate<T>(string programRoot, Func<T> mutation)
        {
            var key = InstallationGate.KeyFor(programRoot);
            var name = @"Global\LevelX2.NETGRID.LifecycleWriter." + key.Substring(key.LastIndexOf('\\') + 1);
            using (var mutex = new Mutex(false, name))
            {
                var held = false;
                try
                {
                    try { held = mutex.WaitOne(TimeSpan.FromSeconds(5)); }
                    catch (AbandonedMutexException)
                    {
                        held = true;
                        throw new InvalidOperationException("installation_gate_writer_abandoned");
                    }
                    if (!held) throw new InvalidOperationException("installation_gate_writer_timeout");
                    return mutation();
                }
                finally { if (held) mutex.ReleaseMutex(); }
            }
        }
    }
}
