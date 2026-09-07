#nullable enable
using System;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Win32;

namespace Netgrid.Windows
{
    internal static class MsiOfflineReadiness
    {
        public static int Read(RegistryKey machine, string root)
        {
            string dataRoot;
            using (var product = machine.OpenSubKey(@"SOFTWARE\LevelX2\NETGRID", writable: false))
                dataRoot = product?.GetValue("RuntimeDataRoot") as string ?? throw new InvalidOperationException("installation_gate_data_root_missing");
            InstallationGate.KeyFor(dataRoot);
            var node = Path.Combine(root, "runtime", "node", "node.exe");
            var cli = Path.Combine(root, "app", "storage-admin.mjs");
            var environment = Path.Combine(dataRoot, "config", "runtime.env");
            if (!File.Exists(node) || !File.Exists(cli) || !File.Exists(environment))
                throw new InvalidOperationException("installation_gate_readiness_files_missing");
            var start = new ProcessStartInfo(node)
            {
                Arguments = "--env-file=" + Quote(environment) + " " + Quote(cli) + " update-readiness",
                WorkingDirectory = root, UseShellExecute = false, CreateNoWindow = true,
                RedirectStandardOutput = true, RedirectStandardError = true
            };
            foreach (var key in start.EnvironmentVariables.Keys.Cast<string>().ToArray())
                if (key.StartsWith("NETGRID_", StringComparison.OrdinalIgnoreCase) ||
                    key.Equals("NODE_OPTIONS", StringComparison.OrdinalIgnoreCase) || key.Equals("NODE_PATH", StringComparison.OrdinalIgnoreCase))
                    start.EnvironmentVariables.Remove(key);
            using (var child = Process.Start(start) ?? throw new InvalidOperationException("installation_gate_readiness_start_failed"))
            {
                var output = ReadBounded(child.StandardOutput);
                var errors = ReadBounded(child.StandardError);
                if (!child.WaitForExit(30000))
                {
                    // Only this own read-only probe, never the live runtime.
                    child.Kill();
                    if (!child.WaitForExit(5000)) throw new InvalidOperationException("installation_gate_readiness_probe_stop_failed");
                    throw new InvalidOperationException("installation_gate_readiness_timeout");
                }
                Task.WaitAll(output, errors);
                if (child.ExitCode != 0) throw new InvalidOperationException("installation_gate_readiness_failed");
                return Parse(output.Result);
            }
        }

        private static string Quote(string value)
        {
            if (value.IndexOf('"') >= 0 || value.IndexOf('\r') >= 0 || value.IndexOf('\n') >= 0)
                throw new InvalidOperationException("installation_gate_readiness_path_invalid");
            return "\"" + value + "\"";
        }

        private static async Task<string> ReadBounded(StreamReader reader)
        {
            var buffer = new char[4097];
            var length = 0;
            while (length < buffer.Length)
            {
                var count = await reader.ReadAsync(buffer, length, buffer.Length - length);
                if (count == 0) return new string(buffer, 0, length);
                length += count;
            }
            throw new InvalidOperationException("installation_gate_readiness_output_excessive");
        }

        internal static int Parse(string output)
        {
            // The storage CLI emits this exact bounded, non-secret JSON shape.
            var match = Regex.Match(output, "\\A\\{\"ok\":true,\"updateAllowed\":(true|false),\"activeMatchCount\":(0|[1-9][0-9]*)\\}\\r?\\n?\\z", RegexOptions.CultureInvariant);
            if (!match.Success || !int.TryParse(match.Groups[2].Value, NumberStyles.None, CultureInfo.InvariantCulture, out var count) ||
                (match.Groups[1].Value == "true") != (count == 0))
                throw new InvalidOperationException("installation_gate_readiness_invalid");
            return count;
        }
    }
}
