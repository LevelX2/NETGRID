using System.Runtime.ExceptionServices;
using Microsoft.Win32;
using Netgrid.Windows;

namespace Netgrid.Updater;

internal sealed record MsiDataRequest(string Mode, string ProgramRoot, string Lease, string ProductCode)
{
    public static MsiDataRequest Parse(string[] args)
    {
        if (args.Length != 8 || args[0] != "--msi-data" || args[1] is not ("capture" or "verify" or "restore") ||
            args[2] != "--program-root" || args[4] != "--msi-lease" || args[6] != "--product-code")
            throw new InvalidOperationException("installation_gate_msi_data_request_invalid");
        InstallationGate.ValidateLease(args[5]);
        InstallationGate.ValidateProductCode(args[7]);
        return new(args[1], UpdateDataLayout.Absolute(args[3]), args[5], args[7]);
    }
}

internal static class MsiDataTransaction
{
    // Shared snapshot and verifier owners, invoked synchronously by an MSI
    // helper. Returning operation ownership never completes the MSI itself.
    internal static void Execute(RegistryKey machine, MsiDataRequest request, string dataRoot,
        Func<UpdateDataSnapshot> capture, Func<MsiDataBinding, UpdateDataSnapshot> reopen,
        Action<UpdateDataSnapshot> restore, Func<bool> verify, Func<bool> productsRemain)
    {
        InstallationLease.BeginMsiOperation(machine, request.ProgramRoot, request.Lease, request.ProductCode);
        var failures = new List<Exception>();
        try
        {
            if (productsRemain()) throw new InvalidOperationException("installation_gate_msi_data_products_remain");
            if (request.Mode == "capture")
            {
                InstallationLease.BeginMsiData(machine, request.ProgramRoot, request.Lease, request.ProductCode, dataRoot);
                using var snapshot = capture();
                snapshot.Verify();
                snapshot.AssertProtectedFilesUnchanged();
                InstallationLease.BindMsiSnapshot(machine, request.ProgramRoot, request.Lease, request.ProductCode,
                    Path.GetFileName(snapshot.DirectoryPath), snapshot.ManifestSha256);
            }
            else
            {
                var binding = InstallationLease.ReadMsiData(machine, request.ProgramRoot, request.Lease, request.ProductCode)
                    ?? throw new InvalidOperationException("installation_gate_msi_data_missing");
                if (!UpdateDataLayout.Same(binding.DataRoot, dataRoot) ||
                    (binding.Phase != MsiDataBinding.Captured && !(request.Mode == "restore" && binding.Phase == MsiDataBinding.Verified)))
                    throw new InvalidOperationException("installation_gate_msi_data_phase_invalid");
                using var snapshot = reopen(binding);
                snapshot.Verify();
                if (request.Mode == "restore") restore(snapshot);
                else if (request.Mode != "verify") throw new InvalidOperationException("installation_gate_msi_data_request_invalid");
                if (!verify()) throw new InvalidOperationException("installation_gate_msi_data_health_failed");
                if (productsRemain()) throw new InvalidOperationException("installation_gate_msi_data_products_remain");
                snapshot.AssertProtectedFilesUnchanged();
                InstallationLease.MarkMsiData(machine, request.ProgramRoot, request.Lease, request.ProductCode, request.Mode == "restore");
            }
        }
        catch (Exception error) { failures.Add(error); }
        try
        {
            // Never clear a helper permit while a verifier/runtime still lives.
            if (productsRemain()) throw new InvalidOperationException("installation_gate_msi_data_products_remain");
            InstallationLease.EndMsiOperation(machine, request.ProgramRoot, request.Lease, request.ProductCode);
        }
        catch (Exception error) { failures.Add(error); }
        if (failures.Count == 1) ExceptionDispatchInfo.Capture(failures[0]).Throw();
        if (failures.Count > 1) throw new AggregateException("installation_gate_msi_data_failed", failures);
    }
}
