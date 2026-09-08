#nullable enable
using System;
using Microsoft.Win32;

namespace Netgrid.Windows
{
    internal static partial class InstallationLease
    {
        public static void BeginMsiData(RegistryKey root, string programRoot, string lease, string productCode, string dataRoot)
        {
            Mutate(programRoot, () =>
            {
                RequireMsiOperationCaller(RequireMsi(root, programRoot, lease, productCode));
                var previous = ReadMsiDataRecord(root, programRoot);
                if (previous?.Lease == lease) throw new InvalidOperationException("installation_gate_msi_data_already_bound");
                WriteMsiData(root, programRoot, new MsiDataBinding(lease, productCode, dataRoot, MsiDataBinding.Preparing));
                return true;
            });
        }

        public static MsiDataBinding? ReadMsiData(RegistryKey root, string programRoot, string lease, string productCode)
        {
            var current = RequireMsi(root, programRoot, lease, productCode);
            if (current.Lease != lease) throw new InvalidOperationException("installation_gate_msi_data_outer_update");
            var binding = ReadMsiDataRecord(root, programRoot);
            if (binding == null || binding.Lease != lease) return null; // No data operation for this exact transaction.
            if (binding.ProductCode != productCode) throw new InvalidOperationException("installation_gate_msi_data_product_mismatch");
            return binding;
        }

        public static void BindMsiSnapshot(RegistryKey root, string programRoot, string lease, string productCode, string snapshotId, string hash)
        {
            Mutate(programRoot, () =>
            {
                RequireMsiOperationCaller(RequireMsi(root, programRoot, lease, productCode));
                var binding = ReadMsiData(root, programRoot, lease, productCode);
                if (binding == null || binding.Phase != MsiDataBinding.Preparing) throw new InvalidOperationException("installation_gate_msi_data_phase_invalid");
                WriteMsiData(root, programRoot, new MsiDataBinding(lease, productCode, binding.DataRoot, MsiDataBinding.Captured, snapshotId, hash));
                return true;
            });
        }

        public static void MarkMsiData(RegistryKey root, string programRoot, string lease, string productCode, bool restored)
        {
            Mutate(programRoot, () =>
            {
                RequireMsiOperationCaller(RequireMsi(root, programRoot, lease, productCode));
                var binding = ReadMsiData(root, programRoot, lease, productCode);
                if (binding == null || (binding.Phase != MsiDataBinding.Captured && !(restored && binding.Phase == MsiDataBinding.Verified)))
                    throw new InvalidOperationException("installation_gate_msi_data_phase_invalid");
                WriteMsiData(root, programRoot, new MsiDataBinding(lease, productCode, binding.DataRoot,
                    restored ? MsiDataBinding.Restored : MsiDataBinding.Verified, binding.SnapshotId, binding.ManifestSha256));
                return true;
            });
        }

        private static MsiDataBinding? ReadMsiDataRecord(RegistryKey root, string programRoot)
        {
            using (var key = root.OpenSubKey(InstallationGate.KeyFor(programRoot), writable: false))
            {
                var value = key?.GetValue("MsiData", null, RegistryValueOptions.DoNotExpandEnvironmentNames);
                if (value == null) return null;
                if (!(value is string encoded) || key!.GetValueKind("MsiData") != RegistryValueKind.String)
                    throw new InvalidOperationException("installation_gate_msi_data_invalid");
                return MsiDataBinding.Decode(encoded);
            }
        }
        private static void WriteMsiData(RegistryKey root, string programRoot, MsiDataBinding binding)
        {
            using (var key = root.OpenSubKey(InstallationGate.KeyFor(programRoot), writable: true))
            {
                if (key == null) throw new InvalidOperationException("installation_gate_msi_owner_missing");
                key.SetValue("MsiData", binding.Encode(), RegistryValueKind.String);
                key.Flush();
            }
        }
    }
}
