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

        public static bool IsStartBlocked(string programRoot, DateTime processStartedUtc)
        {
            using (var machine = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64))
                return BlocksStart(Read(machine, KeyFor(programRoot)), processStartedUtc);
        }

        private static readonly DateTime ProcessStartedUtc = ReadProcessStart();
        public static bool IsCurrentProcessBlocked(string programRoot) => IsStartBlocked(programRoot, ProcessStartedUtc);
        private static DateTime ReadProcessStart()
        {
            using (var process = Process.GetCurrentProcess()) return process.StartTime.ToUniversalTime();
        }

        internal static bool BlocksStart(GateState? state, DateTime processStartedUtc) =>
            state != null && (state.Active || processStartedUtc.ToUniversalTime().Ticks <= state.CompletedUtcTicks);

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
                if (fields.Length != 2 || !long.TryParse(fields[1], NumberStyles.None, CultureInfo.InvariantCulture, out var completed) ||
                    completed < 0 || completed > DateTime.MaxValue.Ticks)
                    throw new InvalidOperationException("installation_gate_lease_invalid");
                ValidateLease(fields[0]);
                return new GateState(fields[0], completed);
            }
        }

        internal static void ValidateLease(string lease)
        {
            if (!Guid.TryParseExact(lease, "N", out var id) || id == Guid.Empty || id.ToString("N") != lease)
                throw new InvalidOperationException("installation_gate_lease_invalid");
        }

        internal sealed class GateState
        {
            public GateState(string lease, long completedUtcTicks) { Lease = lease; CompletedUtcTicks = completedUtcTicks; }
            public string Lease { get; }
            public long CompletedUtcTicks { get; }
            public bool Active => CompletedUtcTicks == 0;
        }
    }
}
