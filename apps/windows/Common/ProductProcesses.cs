#nullable enable
using System;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;

namespace Netgrid.Windows
{
    internal static class ProductProcesses
    {
        public static Process? FindLauncher(string programRoot)
        {
            InstallationGate.KeyFor(programRoot);
            var expected = Path.Combine(Path.GetFullPath(programRoot).TrimEnd(Path.DirectorySeparatorChar), "NETGRID.exe");
            var processes = Process.GetProcessesByName("NETGRID");
            Process? found = null;
            var returned = false;
            try
            {
                foreach (var process in processes)
                {
                    string image;
                    try
                    {
                        var handle = process.Handle;
                        if (process.HasExited) continue;
                        image = process.MainModule?.FileName ?? throw new InvalidOperationException("installation_gate_process_image_missing");
                    }
                    catch (InvalidOperationException) when (process.HasExited) { continue; }
                    catch (Win32Exception) when (process.HasExited) { continue; }
                    if (!string.Equals(Path.GetFullPath(image), expected, StringComparison.OrdinalIgnoreCase)) continue;
                    if (found != null) throw new InvalidOperationException("installation_gate_launcher_ambiguous");
                    found = process;
                }
                returned = true;
                return found;
            }
            finally { foreach (var process in processes) if (!returned || process != found) process.Dispose(); }
        }

        public static bool Remain(string programRoot)
        {
            InstallationGate.KeyFor(programRoot);
            var root = Path.GetFullPath(programRoot).TrimEnd(Path.DirectorySeparatorChar);
            foreach (var name in new[] { "NETGRID", "node", "NETGRID.FirstRun" })
            {
                var processes = Process.GetProcessesByName(name);
                try
                {
                    foreach (var process in processes)
                    {
                        string image;
                        try
                        {
                            var handle = process.Handle;
                            if (process.HasExited) continue;
                            image = process.MainModule?.FileName ?? throw new InvalidOperationException("installation_gate_process_image_missing");
                        }
                        catch (InvalidOperationException) when (process.HasExited) { continue; }
                        catch (Win32Exception) when (process.HasExited) { continue; }
                        var expected = name == "node" ? Path.Combine(root, "runtime", "node", "node.exe") : Path.Combine(root, name + ".exe");
                        if (string.Equals(Path.GetFullPath(image), expected, StringComparison.OrdinalIgnoreCase)) return true;
                    }
                }
                finally { foreach (var process in processes) process.Dispose(); }
            }
            return false;
        }
    }
}
