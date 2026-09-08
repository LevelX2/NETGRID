#nullable enable
using System;
using System.IO;
using System.Text;

namespace Netgrid.Windows
{
    // Stored only in the installer-owned HKLM lifecycle key. No secret,
    // executable path, or archive-controlled hash becomes restore authority.
    internal sealed class UpdateRecoveryBinding
    {
        public string Lease { get; }
        public string DataRoot { get; }
        public string SnapshotId { get; }
        public string ManifestSha256 { get; }
        public string PreviousSetupSha256 { get; }

        public UpdateRecoveryBinding(string lease, string dataRoot, string snapshotId, string manifestSha256, string previousSetupSha256)
        {
            InstallationGate.ValidateLease(lease);
            InstallationGate.KeyFor(dataRoot);
            if (!Guid.TryParseExact(snapshotId, "N", out var id) || id == Guid.Empty || id.ToString("N") != snapshotId ||
                !Digest(manifestSha256) || !Digest(previousSetupSha256))
                throw new InvalidOperationException("installation_gate_recovery_binding_invalid");
            Lease = lease; DataRoot = Path.GetFullPath(dataRoot).TrimEnd(Path.DirectorySeparatorChar);
            SnapshotId = snapshotId; ManifestSha256 = manifestSha256; PreviousSetupSha256 = previousSetupSha256;
        }
        public string Encode() => "1|" + Lease + "|" + Convert.ToBase64String(Encoding.UTF8.GetBytes(DataRoot)) + "|" +
            SnapshotId + "|" + ManifestSha256 + "|" + PreviousSetupSha256;

        public static UpdateRecoveryBinding Decode(string record)
        {
            if (record == null || record.Length > 32768) throw new InvalidOperationException("installation_gate_recovery_binding_invalid");
            var fields = record.Split('|');
            if (fields.Length != 6 || fields[0] != "1") throw new InvalidOperationException("installation_gate_recovery_binding_invalid");
            try
            {
                var dataRoot = new UTF8Encoding(false, true).GetString(Convert.FromBase64String(fields[2]));
                var binding = new UpdateRecoveryBinding(fields[1], dataRoot, fields[3], fields[4], fields[5]);
                if (binding.Encode() != record) throw new InvalidOperationException("installation_gate_recovery_binding_invalid");
                return binding;
            }
            catch (Exception error) when (error is FormatException || error is ArgumentException)
            { throw new InvalidOperationException("installation_gate_recovery_binding_invalid", error); }
        }
        private static bool Digest(string value)
        {
            if (value == null || value.Length != 64) return false;
            foreach (var c in value) if (!((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f'))) return false;
            return true;
        }
    }
}
