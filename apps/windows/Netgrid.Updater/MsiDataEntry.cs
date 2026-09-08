using System.Security.Principal;
using Microsoft.Win32;
using Netgrid.Windows;

namespace Netgrid.Updater;

internal static class MsiDataEntry
{
    public static int Run(string[] args)
    {
        try
        {
            var request = MsiDataRequest.Parse(args);
            using var identity = WindowsIdentity.GetCurrent();
            if (!new WindowsPrincipal(identity).IsInRole(WindowsBuiltInRole.Administrator))
                throw new InvalidOperationException("installation_gate_msi_data_administrator_required");
            using var machine = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64);
            using var registered = machine.OpenSubKey(@"SOFTWARE\LevelX2\NETGRID", writable: false);
            if (registered?.GetValue("InstallDirectory") is not string root ||
                !UpdateDataLayout.Same(UpdateDataLayout.Absolute(root), request.ProgramRoot) ||
                registered.GetValue("RuntimeDataRoot") is not string data ||
                !UpdateDataLayout.Same(Environment.ProcessPath!, Path.Combine(request.ProgramRoot, "NETGRID.Updater.exe")))
                throw new InvalidOperationException("installation_gate_msi_data_registered_scope_invalid");
            var dataRoot = UpdateDataLayout.Absolute(data);
            var environmentFile = Path.Combine(dataRoot, "config", "runtime.env");
            var layout = new UpdateDataLayout(dataRoot, UpdateTransaction.ReadEnvironment(environmentFile));
            MsiDataTransaction.Execute(machine, request, dataRoot,
                () => UpdateDataSnapshot.Capture(layout),
                binding => UpdateDataSnapshot.Reopen(layout, binding.SnapshotId, binding.ManifestSha256),
                snapshot => snapshot.Restore(),
                () => UpdateVerifier.RunAsync(request.ProgramRoot, environmentFile, request.Lease).GetAwaiter().GetResult(),
                () => ProductProcesses.Remain(request.ProgramRoot));
            return 0;
        }
        catch (Exception error)
        {
            // MSI owns the UI. In particular never open a dialog on Session 0.
            // Bound fixed diagnostic only; no environment or credential values.
            var code = UpdateSession.DiagnosticCode(error);
            Console.Error.WriteLine("NETGRID_MSI_DATA_ERROR code=" + code);
            return 3;
        }
    }
}
