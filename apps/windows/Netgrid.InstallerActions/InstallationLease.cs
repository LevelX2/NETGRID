using System;
using System.Globalization;
using Microsoft.Win32;
using Netgrid.Windows;

namespace Netgrid.InstallerActions
{
    // Windows Installer serializes execute transactions. Callers must execute
    // Begin in a non-impersonated deferred action, never from the launcher.
    internal static class InstallationLease
    {
        public static void Begin(RegistryKey root, string programRoot, string lease)
        {
            InstallationGate.ValidateLease(lease);
            var path = InstallationGate.KeyFor(programRoot);
            if (InstallationGate.Read(root, path)?.Active == true)
                throw new InvalidOperationException("installation_gate_already_owned");
            using (var key = root.CreateSubKey(path, writable: true))
            {
                if (key == null) throw new InvalidOperationException("installation_gate_write_failed");
                key.SetValue("Lease", lease + "|0", RegistryValueKind.String);
                key.Flush();
            }
        }

        public static bool ReleaseOwned(RegistryKey root, string programRoot, string lease)
        {
            InstallationGate.ValidateLease(lease);
            var path = InstallationGate.KeyFor(programRoot);
            var current = InstallationGate.Read(root, path);
            // Rollback can run before Begin acquired anything. It must not
            // clear a different (including a stale earlier) transaction.
            if (current == null || !current.Active || current.Lease != lease) return false;
            using (var key = root.OpenSubKey(path, writable: true))
            {
                if (key == null) throw new InvalidOperationException("installation_gate_owner_disappeared");
                // A process may be created during the transaction but not get
                // CPU time until after commit. Keep the completion cutoff so
                // such a stale executable cannot start against replaced files.
                key.SetValue("Lease", lease + "|" + DateTime.UtcNow.Ticks.ToString(CultureInfo.InvariantCulture), RegistryValueKind.String);
                key.Flush();
            }
            return true;
        }
    }
}
