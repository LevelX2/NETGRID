#nullable enable
using System;
using System.IO;
using System.Text;

namespace Netgrid.Windows
{
    // Installer-owned evidence, never an archive's claim about itself.
    internal sealed class MsiDataBinding
    {
        public const string Preparing = "preparing", Captured = "captured", Verified = "verified", Restored = "restored";
        public string Lease { get; }
        public string ProductCode { get; }
        public string DataRoot { get; }
        public string Phase { get; }
        public string SnapshotId { get; }
        public string ManifestSha256 { get; }

        public MsiDataBinding(string lease, string productCode, string dataRoot, string phase, string snapshotId = "", string manifestSha256 = "")
        {
            InstallationGate.ValidateLease(lease);
            InstallationGate.ValidateProductCode(productCode);
            InstallationGate.KeyFor(dataRoot);
            if (phase == Preparing)
            {
                if (snapshotId != "" || manifestSha256 != "") throw Invalid();
            }
            else
            {
                if (phase != Captured && phase != Verified && phase != Restored) throw Invalid();
                InstallationGate.ValidateLease(snapshotId);
                if (manifestSha256 == null || manifestSha256.Length != 64) throw Invalid();
                foreach (var c in manifestSha256) if (!((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f'))) throw Invalid();
            }
            Lease = lease; ProductCode = productCode; DataRoot = Path.GetFullPath(dataRoot).TrimEnd(Path.DirectorySeparatorChar);
            Phase = phase; SnapshotId = snapshotId; ManifestSha256 = manifestSha256;
        }
        public string Encode() => "1|" + Lease + "|" + ProductCode + "|" + Convert.ToBase64String(Encoding.UTF8.GetBytes(DataRoot)) +
            "|" + Phase + "|" + SnapshotId + "|" + ManifestSha256;

        public static MsiDataBinding Decode(string record)
        {
            if (record == null || record.Length > 32768) throw Invalid();
            var fields = record.Split('|');
            if (fields.Length != 7 || fields[0] != "1") throw Invalid();
            try
            {
                var result = new MsiDataBinding(fields[1], fields[2], new UTF8Encoding(false, true).GetString(Convert.FromBase64String(fields[3])),
                    fields[4], fields[5], fields[6]);
                if (result.Encode() != record) throw Invalid();
                return result;
            }
            catch (Exception error) when (error is FormatException || error is ArgumentException)
            { throw new InvalidOperationException("installation_gate_msi_data_invalid", error); }
        }
        private static InvalidOperationException Invalid() => new InvalidOperationException("installation_gate_msi_data_invalid");
    }
}
