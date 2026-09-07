#nullable enable
using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Globalization;
using System.Diagnostics;
using Microsoft.Win32;

namespace Netgrid.Windows
{
    // One per-program-root, installer-owned transaction lease. Runtime code
    // only opens HKLM read-only; no credential/configuration file is involved.
    internal static class InstallationGate
    {
        internal const string Prefix = @"SOFTWARE\LevelX2\NETGRID.InstallerLifecycle";

        public static string KeyFor(string programRoot)
        {
            if (string.IsNullOrWhiteSpace(programRoot) || programRoot.Length < 3 || !char.IsLetter(programRoot[0]) ||
                programRoot[1] != ':' || (programRoot[2] != '\\' && programRoot[2] != '/'))
                throw new InvalidOperationException("installation_gate_root_invalid");
            var normalized = Path.GetFullPath(programRoot).TrimEnd(Path.DirectorySeparatorChar).ToUpperInvariant();
            if (normalized.Length <= 3) throw new InvalidOperationException("installation_gate_root_too_broad");
            using (var sha = SHA256.Create())
                return Prefix + "\\" + BitConverter.ToString(sha.ComputeHash(Encoding.UTF8.GetBytes(normalized))).Replace("-", "");
        }

        public static bool IsActive(string programRoot)
        {
            using (var machine = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64))
                return Read(machine, KeyFor(programRoot))?.Active == true;
        }

        public static bool IsStartBlocked(string programRoot, DateTime processStartedUtc, int processId = 0)
        {
            using (var machine = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64))
                return BlocksStart(Read(machine, KeyFor(programRoot)), processStartedUtc, processId);
        }

        private static readonly ProcessStamp CurrentProcess = ReadProcessStart();
        public static bool IsCurrentProcessBlocked(string programRoot) => IsStartBlocked(programRoot, CurrentProcess.StartedUtc, CurrentProcess.Id);
        private static ProcessStamp ReadProcessStart()
        {
            using (var process = Process.GetCurrentProcess()) return new ProcessStamp(process.Id, process.StartTime.ToUniversalTime());
        }

        internal static bool BlocksStart(GateState? state, DateTime processStartedUtc, int processId = 0)
        {
            if (state == null) return false;
            var started = processStartedUtc.ToUniversalTime().Ticks;
            if (state.AllowedParentId > 0 && state.AllowedParentId == processId && state.AllowedParentStart == started)
                return state.Phase == GateState.Verifying && !OwnerIsAlive(state);
            return state.Active || started <= state.CompletedUtcTicks;
        }

        internal static GateState? Read(RegistryKey root, string keyPath)
        {
            using (var key = root.OpenSubKey(keyPath, writable: false))
            {
                if (key == null) return null;
                var value = key.GetValue("Lease", null, RegistryValueOptions.DoNotExpandEnvironmentNames);
                if (value == null) return null;
                if (!(value is string record) || key.GetValueKind("Lease") != RegistryValueKind.String)
                    throw new InvalidOperationException("installation_gate_lease_invalid");
                var fields = record.Split('|');
                if (fields.Length != 10 || fields[0] != "3" ||
                    !long.TryParse(fields[3], NumberStyles.None, CultureInfo.InvariantCulture, out var completed) ||
                    !int.TryParse(fields[4], NumberStyles.None, CultureInfo.InvariantCulture, out var parentId) ||
                    !long.TryParse(fields[5], NumberStyles.None, CultureInfo.InvariantCulture, out var parentStart) ||
                    !int.TryParse(fields[6], NumberStyles.None, CultureInfo.InvariantCulture, out var ownerId) ||
                    !long.TryParse(fields[7], NumberStyles.None, CultureInfo.InvariantCulture, out var ownerStart))
                    throw new InvalidOperationException("installation_gate_lease_invalid");
                return new GateState(fields[1], fields[2], completed, parentId, parentStart, ownerId, ownerStart, fields[8], fields[9]);
            }
        }

        internal static void ValidateLease(string lease)
        {
            if (!Guid.TryParseExact(lease, "N", out var id) || id == Guid.Empty || id.ToString("N") != lease)
                throw new InvalidOperationException("installation_gate_lease_invalid");
        }

        internal static void ValidateProductCode(string productCode)
        {
            if (!Guid.TryParseExact(productCode, "B", out var id) || id == Guid.Empty ||
                id.ToString("B").ToUpperInvariant() != productCode)
                throw new InvalidOperationException("installation_gate_product_code_invalid");
        }

        // Read-only identity binding for an updater-owned child operation.
        // A present registry record is not proof that its process still lives.
        internal static Process OpenUpdateOwner(RegistryKey machine, string root, string lease)
        {
            ValidateLease(lease);
            var current = Read(machine, KeyFor(root));
            if (current == null || current.Lease != lease || current.Phase != GateState.Stopping ||
                current.OwnerId <= 0 || current.MsiLease != "")
                throw new InvalidOperationException("installation_gate_update_owner_missing");
            Process owner;
            try { owner = Process.GetProcessById(current.OwnerId); }
            catch (ArgumentException) { throw new InvalidOperationException("installation_gate_update_owner_missing"); }
            try
            {
                var handle = owner.Handle;
                if (owner.HasExited || owner.StartTime.ToUniversalTime().Ticks != current.OwnerStart)
                    throw new InvalidOperationException("installation_gate_update_owner_missing");
                return owner;
            }
            catch { owner.Dispose(); throw; }
        }

        private static bool OwnerIsAlive(GateState state)
        {
            Process owner;
            try { owner = Process.GetProcessById(state.OwnerId); }
            catch (ArgumentException) { return false; } // Owner exit revokes verification.
            using (owner)
            {
                var handle = owner.Handle;
                return !owner.HasExited && owner.StartTime.ToUniversalTime().Ticks == state.OwnerStart;
            }
        }

        internal static bool IsCurrentVerificationAllowed(RegistryKey machine, string root, string lease)
        {
            ValidateLease(lease);
            var state = Read(machine, KeyFor(root));
            return state != null && state.Lease == lease && state.Phase == GateState.Verifying &&
                state.AllowedParentId == CurrentProcess.Id && state.AllowedParentStart == CurrentProcess.StartedUtc.Ticks &&
                !BlocksStart(state, CurrentProcess.StartedUtc, CurrentProcess.Id);
        }

        public static bool IsCurrentVerificationAllowed(string root, string lease)
        {
            using (var machine = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64))
                return IsCurrentVerificationAllowed(machine, root, lease);
        }

        internal sealed class GateState
        {
            public const string Preparing = "preparing";
            public const string Stopping = "stopping";
            public const string Verifying = "verifying";
            public const string Completed = "completed";
            public GateState(string lease, string phase, long completedUtcTicks,
                int allowedParentId = 0, long allowedParentStart = 0, int ownerId = 0, long ownerStart = 0,
                string msiLease = "", string msiProductCode = "")
            {
                ValidateLease(lease);
                if (msiLease != "" || msiProductCode != "")
                {
                    ValidateLease(msiLease);
                    ValidateProductCode(msiProductCode);
                    if (phase != Stopping) throw new InvalidOperationException("installation_gate_msi_phase_invalid");
                    if (ownerId == 0 && msiLease != lease) throw new InvalidOperationException("installation_gate_msi_owner_invalid");
                }
                if ((phase != Preparing && phase != Stopping && phase != Verifying && phase != Completed) ||
                    completedUtcTicks < 0 || completedUtcTicks > DateTime.MaxValue.Ticks ||
                    !ValidIdentity(allowedParentId, allowedParentStart) || !ValidIdentity(ownerId, ownerStart) ||
                    ((phase == Preparing || phase == Verifying) && (allowedParentId == 0 || ownerId == 0 || ownerId == allowedParentId)) ||
                    (phase == Stopping && allowedParentId != 0) ||
                    (phase == Completed && (completedUtcTicks == 0 || ownerId != 0)))
                    throw new InvalidOperationException("installation_gate_lease_invalid");
                Lease = lease; Phase = phase; CompletedUtcTicks = completedUtcTicks;
                AllowedParentId = allowedParentId; AllowedParentStart = allowedParentStart;
                OwnerId = ownerId; OwnerStart = ownerStart;
                MsiLease = msiLease; MsiProductCode = msiProductCode;
            }
            public string Lease { get; }
            public string Phase { get; }
            public long CompletedUtcTicks { get; }
            public int AllowedParentId { get; }
            // The single process exception: original launcher in Preparing,
            // explicitly bound verifier child in Verifying. Never both.
            public long AllowedParentStart { get; }
            public int OwnerId { get; }
            public long OwnerStart { get; }
            public string MsiLease { get; }
            public string MsiProductCode { get; }
            public bool Active => Phase != Completed;

            public string Encode() => string.Join("|", new[] { "3", Lease, Phase,
                CompletedUtcTicks.ToString(CultureInfo.InvariantCulture), AllowedParentId.ToString(CultureInfo.InvariantCulture),
                AllowedParentStart.ToString(CultureInfo.InvariantCulture), OwnerId.ToString(CultureInfo.InvariantCulture),
                OwnerStart.ToString(CultureInfo.InvariantCulture), MsiLease, MsiProductCode });

            public GateState WithMsi(string lease, string product) => new GateState(Lease, Phase, CompletedUtcTicks,
                AllowedParentId, AllowedParentStart, OwnerId, OwnerStart, lease, product);

            private static bool ValidIdentity(int id, long start) =>
                (id == 0 && start == 0) || (id > 0 && start > 0 && start <= DateTime.MaxValue.Ticks);
        }

        private sealed class ProcessStamp
        {
            public ProcessStamp(int id, DateTime startedUtc) { Id = id; StartedUtc = startedUtc; }
            public int Id { get; }
            public DateTime StartedUtc { get; }
        }
    }
}
