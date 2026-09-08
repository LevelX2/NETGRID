#nullable enable
using System;
using System.Threading;
using System.Diagnostics;
using Microsoft.Win32;

namespace Netgrid.Windows
{
    // The only lease writer, shared by the elevated updater and MSI actions.
    // Runtime components link the read-only InstallationGate, never this file.
    internal static class InstallationLease
    {
        public static void TakeOverRecovery(RegistryKey root, string programRoot, InstallationGate.GateState expected,
            Func<bool> productProcessesRemain)
        {
            InstallationLaunchFence.Execute(programRoot, () => Mutate(programRoot, () =>
            {
                var current = InstallationGate.Read(root, InstallationGate.KeyFor(programRoot));
                if (current == null || current.Encode() != expected.Encode() || current.OwnerId == 0 ||
                    (current.Phase != InstallationGate.GateState.Stopping && current.Phase != InstallationGate.GateState.Verifying))
                    throw new InvalidOperationException("installation_gate_recovery_state_changed");
                RequireRecoveryOwnerExited(current);
                // A reused PID belongs to somebody else and is never killed.
                // A verifier or product process must also have actually exited.
                if (productProcessesRemain()) throw new InvalidOperationException("installation_gate_recovery_products_remain");
                ReadRecovery(root, programRoot, current.Lease);
                using (var owner = Process.GetCurrentProcess())
                    Write(root, programRoot, new InstallationGate.GateState(current.Lease, InstallationGate.GateState.Stopping,
                        current.CompletedUtcTicks, ownerId: owner.Id, ownerStart: owner.StartTime.ToUniversalTime().Ticks));
                return true;
            }));
        }

        public static void RequireRecoveryOwnerExited(InstallationGate.GateState current)
        {
            if (current.OwnerId == 0 || (current.Phase != InstallationGate.GateState.Stopping && current.Phase != InstallationGate.GateState.Verifying))
                throw new InvalidOperationException("installation_gate_recovery_state_changed");
            if (current.MsiLease != "") throw new InvalidOperationException("installation_gate_msi_still_active");
            Process? prior = null;
            try
            {
                try { prior = Process.GetProcessById(current.OwnerId); }
                catch (ArgumentException) { } // This exact PID no longer exists.
                if (prior != null)
                {
                    var handle = prior.Handle;
                    if (!prior.HasExited && prior.StartTime.ToUniversalTime().Ticks == current.OwnerStart)
                        throw new InvalidOperationException("installation_gate_recovery_owner_alive");
                }
            }
            finally { prior?.Dispose(); }
        }

        public static void BindRecovery(RegistryKey root, string programRoot, UpdateRecoveryBinding binding)
        {
            Mutate(programRoot, () =>
            {
                var current = InstallationGate.Read(root, InstallationGate.KeyFor(programRoot));
                using (var owner = Process.GetCurrentProcess())
                    if (current == null || current.Lease != binding.Lease || current.Phase != InstallationGate.GateState.Stopping ||
                        current.MsiLease != "" || current.OwnerId != owner.Id || current.OwnerStart != owner.StartTime.ToUniversalTime().Ticks)
                        throw new InvalidOperationException("installation_gate_recovery_owner_missing");
                using (var key = root.OpenSubKey(InstallationGate.KeyFor(programRoot), writable: true))
                {
                    if (key == null) throw new InvalidOperationException("installation_gate_recovery_owner_missing");
                    var prior = key.GetValue("Recovery");
                    if (prior != null)
                    {
                        if (!(prior is string encoded) || key.GetValueKind("Recovery") != RegistryValueKind.String)
                            throw new InvalidOperationException("installation_gate_recovery_binding_invalid");
                        var previous = UpdateRecoveryBinding.Decode(encoded);
                        if (previous.Lease == binding.Lease && encoded != binding.Encode())
                            throw new InvalidOperationException("installation_gate_recovery_already_bound");
                    }
                    key.SetValue("Recovery", binding.Encode(), RegistryValueKind.String);
                    key.Flush();
                }
                return true;
            });
        }

        public static UpdateRecoveryBinding ReadRecovery(RegistryKey root, string programRoot, string lease)
        {
            InstallationGate.ValidateLease(lease);
            var current = InstallationGate.Read(root, InstallationGate.KeyFor(programRoot));
            if (current == null || !current.Active || current.Lease != lease)
                throw new InvalidOperationException("installation_gate_recovery_owner_missing");
            using (var key = root.OpenSubKey(InstallationGate.KeyFor(programRoot), writable: false))
            {
                if (!(key?.GetValue("Recovery") is string encoded) || key.GetValueKind("Recovery") != RegistryValueKind.String)
                    throw new InvalidOperationException("installation_gate_recovery_binding_missing");
                var binding = UpdateRecoveryBinding.Decode(encoded);
                if (binding.Lease != lease) throw new InvalidOperationException("installation_gate_recovery_binding_mismatch");
                return binding;
            }
        }

        public static void BeginMsiPreparation(RegistryKey root, string programRoot, string lease, string productCode,
            int parentId, long parentStart, int ownerId, long ownerStart)
        {
            Mutate(programRoot, () =>
            {
                var current = InstallationGate.Read(root, InstallationGate.KeyFor(programRoot));
                if (current?.Active == true) throw new InvalidOperationException("installation_gate_already_owned");
                var next = new InstallationGate.GateState(lease, InstallationGate.GateState.PreparingMsi,
                    current?.CompletedUtcTicks ?? 0, parentId, parentStart, ownerId, ownerStart, lease, productCode);
                if (InstallationGate.BlocksStart(current, new DateTime(parentStart, DateTimeKind.Utc), parentId))
                    throw new InvalidOperationException("installation_gate_parent_already_blocked");
                Write(root, programRoot, next);
                return true;
            });
        }

        public static void StopMsiPrepared(RegistryKey root, string programRoot, string lease, string productCode)
        {
            Mutate(programRoot, () =>
            {
                var current = RequireMsiPreparation(root, programRoot, lease, productCode);
                // The preparation owner is MSI itself, not an outer updater.
                // Commit/rollback must therefore complete the standalone lease.
                Write(root, programRoot, new InstallationGate.GateState(lease, InstallationGate.GateState.Stopping,
                    current.CompletedUtcTicks, msiLease: lease, msiProductCode: productCode));
                return true;
            });
        }

        private static InstallationGate.GateState RequireMsiPreparation(RegistryKey root, string programRoot, string lease, string productCode)
        {
            InstallationGate.ValidateLease(lease);
            InstallationGate.ValidateProductCode(productCode);
            var current = InstallationGate.Read(root, InstallationGate.KeyFor(programRoot));
            if (current == null || current.Phase != InstallationGate.GateState.PreparingMsi ||
                current.Lease != lease || current.MsiLease != lease || current.MsiProductCode != productCode)
                throw new InvalidOperationException("installation_gate_msi_preparation_owner_missing");
            return current;
        }

        public static void BeginMsi(RegistryKey root, string programRoot, string msiLease, string productCode, string outerLease)
        {
            Mutate(programRoot, () =>
            {
                InstallationGate.ValidateLease(msiLease);
                InstallationGate.ValidateProductCode(productCode);
                var current = InstallationGate.Read(root, InstallationGate.KeyFor(programRoot));
                if (outerLease == "")
                {
                    if (current?.Active == true) throw new InvalidOperationException("installation_gate_already_owned");
                    Write(root, programRoot, new InstallationGate.GateState(msiLease, InstallationGate.GateState.Stopping,
                        current?.CompletedUtcTicks ?? 0, msiLease: msiLease, msiProductCode: productCode));
                }
                else
                {
                    InstallationGate.ValidateLease(outerLease);
                    if (msiLease == outerLease) throw new InvalidOperationException("installation_gate_msi_outer_identity_conflict");
                    if (current == null || current.Lease != outerLease || current.Phase != InstallationGate.GateState.Stopping ||
                        current.OwnerId == 0 || current.MsiLease != "")
                        throw new InvalidOperationException("installation_gate_update_owner_missing");
                    Write(root, programRoot, current.WithMsi(msiLease, productCode));
                }
                return true;
            });
        }

        // The nested old-product uninstall may only join the exact new-product
        // transaction. It never acquires or completes the outer ownership.
        public static InstallationGate.GateState RequireMsi(RegistryKey root, string programRoot, string msiLease, string productCode)
        {
            InstallationGate.ValidateLease(msiLease);
            InstallationGate.ValidateProductCode(productCode);
            var current = InstallationGate.Read(root, InstallationGate.KeyFor(programRoot));
            if (current == null || current.Phase != InstallationGate.GateState.Stopping ||
                current.MsiLease != msiLease || current.MsiProductCode != productCode)
                throw new InvalidOperationException("installation_gate_msi_owner_missing");
            return current;
        }

        public static bool CompleteMsi(RegistryKey root, string programRoot, string msiLease, string productCode)
            => FinishMsi(root, programRoot, msiLease, productCode, allowPreparationCancel: false);

        // A synchronous direct-MSI helper borrows operation ownership without
        // releasing or replacing the MSI transaction. Only its exact process
        // can return ownership; an interrupted helper leaves the MSI blocked.
        public static void BeginMsiOperation(RegistryKey root, string programRoot, string msiLease, string productCode)
        {
            InstallationLaunchFence.Execute(programRoot, () => Mutate(programRoot, () =>
            {
                var current = RequireMsi(root, programRoot, msiLease, productCode);
                if (current.Lease != msiLease || current.OwnerId != 0)
                    throw new InvalidOperationException("installation_gate_msi_operation_already_owned");
                using (var owner = Process.GetCurrentProcess())
                    Write(root, programRoot, new InstallationGate.GateState(current.Lease, current.Phase,
                        current.CompletedUtcTicks, ownerId: owner.Id, ownerStart: owner.StartTime.ToUniversalTime().Ticks,
                        msiLease: current.MsiLease, msiProductCode: current.MsiProductCode));
                return true;
            }));
        }

        public static void EndMsiOperation(RegistryKey root, string programRoot, string msiLease, string productCode)
        {
            Mutate(programRoot, () =>
            {
                var current = RequireMsi(root, programRoot, msiLease, productCode);
                using (var owner = Process.GetCurrentProcess())
                    if (current.Lease != msiLease || current.OwnerId != owner.Id || current.OwnerStart != owner.StartTime.ToUniversalTime().Ticks)
                        throw new InvalidOperationException("installation_gate_msi_operation_owner_missing");
                Write(root, programRoot, new InstallationGate.GateState(current.Lease, current.Phase,
                    current.CompletedUtcTicks, msiLease: current.MsiLease, msiProductCode: current.MsiProductCode));
                return true;
            });
        }

        public static bool RollbackMsi(RegistryKey root, string programRoot, string msiLease, string productCode)
            => FinishMsi(root, programRoot, msiLease, productCode, allowPreparationCancel: true);

        private static bool FinishMsi(RegistryKey root, string programRoot, string msiLease, string productCode, bool allowPreparationCancel)
        {
            return Mutate(programRoot, () =>
            {
                InstallationGate.ValidateLease(msiLease);
                InstallationGate.ValidateProductCode(productCode);
                var current = InstallationGate.Read(root, InstallationGate.KeyFor(programRoot));
                if (current == null || (current.Phase != InstallationGate.GateState.Stopping &&
                    !(allowPreparationCancel && current.Phase == InstallationGate.GateState.PreparingMsi)) ||
                    current.MsiLease != msiLease || current.MsiProductCode != productCode) return false;
                if (current.Phase == InstallationGate.GateState.PreparingMsi)
                {
                    Write(root, programRoot, new InstallationGate.GateState(current.Lease, InstallationGate.GateState.Completed,
                        Math.Max(DateTime.UtcNow.Ticks, current.CompletedUtcTicks), current.AllowedParentId, current.AllowedParentStart));
                    return true;
                }
                if (current.OwnerId > 0 && current.Lease == current.MsiLease)
                    throw new InvalidOperationException("installation_gate_msi_operation_still_active");
                if (current.OwnerId > 0) Write(root, programRoot, current.WithMsi("", ""));
                else Write(root, programRoot, new InstallationGate.GateState(current.Lease, InstallationGate.GateState.Completed,
                    Math.Max(DateTime.UtcNow.Ticks, current.CompletedUtcTicks)));
                return true;
            });
        }

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
                if (current.MsiLease != "") throw new InvalidOperationException("installation_gate_msi_still_active");
                if (current.Phase == InstallationGate.GateState.Verifying)
                    throw new InvalidOperationException("installation_gate_verification_still_active");
                // Cancelling preparation preserves exactly the original live
                // launcher, not every executable born before this timestamp.
                var preserveParent = current.Phase == InstallationGate.GateState.Preparing;
                Write(root, programRoot, new InstallationGate.GateState(lease, InstallationGate.GateState.Completed,
                    Math.Max(DateTime.UtcNow.Ticks, current.CompletedUtcTicks),
                    preserveParent ? current.AllowedParentId : 0, preserveParent ? current.AllowedParentStart : 0));
                return true;
            });
        }

        public static void BeginVerification(RegistryKey root, string programRoot, string lease, int verifierId, long verifierStart)
        {
            Mutate(programRoot, () =>
            {
                InstallationGate.ValidateLease(lease);
                var current = InstallationGate.Read(root, InstallationGate.KeyFor(programRoot));
                if (current == null || current.Lease != lease || current.Phase != InstallationGate.GateState.Stopping ||
                    current.OwnerId == 0 || (current.MsiLease != "" && current.MsiLease != current.Lease))
                    throw new InvalidOperationException("installation_gate_verification_owner_missing");
                RequireMsiOperationCaller(current);
                Write(root, programRoot, new InstallationGate.GateState(lease, InstallationGate.GateState.Verifying,
                    current.CompletedUtcTicks, verifierId, verifierStart, current.OwnerId, current.OwnerStart, current.MsiLease, current.MsiProductCode));
                return true;
            });
        }

        public static void EndVerification(RegistryKey root, string programRoot, string lease)
        {
            Mutate(programRoot, () =>
            {
                InstallationGate.ValidateLease(lease);
                var current = InstallationGate.Read(root, InstallationGate.KeyFor(programRoot));
                if (current == null || current.Lease != lease || current.Phase != InstallationGate.GateState.Verifying)
                    throw new InvalidOperationException("installation_gate_verification_owner_missing");
                RequireMsiOperationCaller(current);
                Write(root, programRoot, new InstallationGate.GateState(lease, InstallationGate.GateState.Stopping,
                    current.CompletedUtcTicks, ownerId: current.OwnerId, ownerStart: current.OwnerStart,
                    msiLease: current.MsiLease, msiProductCode: current.MsiProductCode));
                return true;
            });
        }

        private static void RequireMsiOperationCaller(InstallationGate.GateState current)
        {
            if (current.MsiLease == "") return;
            using (var owner = Process.GetCurrentProcess())
                if (current.Lease != current.MsiLease || current.OwnerId != owner.Id || current.OwnerStart != owner.StartTime.ToUniversalTime().Ticks)
                    throw new InvalidOperationException("installation_gate_msi_operation_owner_missing");
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
