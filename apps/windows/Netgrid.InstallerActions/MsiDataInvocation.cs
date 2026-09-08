using System;
using System.Diagnostics;
using System.IO;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using WixToolset.Dtf.WindowsInstaller;

namespace Netgrid.InstallerActions
{
    internal static class MsiDataInvocation
    {
        internal static void Run(Session session, string mode)
        {
            var root = Path.GetFullPath(session.CustomActionData["ProgramRoot"]).TrimEnd(Path.DirectorySeparatorChar);
            var image = Path.Combine(root, "NETGRID.Updater.exe");
            var start = new ProcessStartInfo(image)
            {
                UseShellExecute = false, CreateNoWindow = true, WorkingDirectory = root,
                RedirectStandardError = true,
                Arguments = "--msi-data " + Quote(mode) + " --program-root " + Quote(root) +
                    " --msi-lease " + Quote(session.CustomActionData["Lease"]) + " --product-code " + Quote(session.CustomActionData["ProductCode"])
            };
            using (var imageLock = new FileStream(image, FileMode.Open, FileAccess.Read, FileShare.Read))
            using (var child = Process.Start(start) ?? throw new InvalidOperationException("installation_gate_msi_data_start_failed"))
            {
                var errors = ReadError(child.StandardError);
                // A timeout never kills a possibly writing restore or frees its
                // lease. Native failure leaves the binding for diagnosis.
                if (!child.WaitForExit(600000)) throw new InvalidOperationException("installation_gate_msi_data_timeout");
                var output = errors.GetAwaiter().GetResult();
                if (output.Length > 0)
                {
                    if (!Regex.IsMatch(output, @"\ANETGRID_MSI_DATA_ERROR code=[A-Za-z0-9_]{1,120}\r?\n\z"))
                        throw new InvalidOperationException("installation_gate_msi_data_diagnostic_invalid");
                    session.Log(output.TrimEnd());
                }
                if (child.ExitCode != 0) throw new InvalidOperationException("installation_gate_msi_data_failed");
                session.Log("NETGRID_MSI_DATA_OK operation={0}", mode);
            }
        }
        private static string Quote(string value)
        {
            if (value.IndexOfAny(new[] { '"', '\r', '\n' }) >= 0 || value.EndsWith("\\", StringComparison.Ordinal))
                throw new InvalidOperationException("installation_gate_msi_data_argument_invalid");
            return "\"" + value + "\"";
        }
        private static async Task<string> ReadError(StreamReader reader)
        {
            var buffer = new char[513];
            var length = 0;
            while (length < buffer.Length)
            {
                var count = await reader.ReadAsync(buffer, length, buffer.Length - length);
                if (count == 0) return new string(buffer, 0, length);
                length += count;
            }
            throw new InvalidOperationException("installation_gate_msi_data_diagnostic_excessive");
        }
    }
}
