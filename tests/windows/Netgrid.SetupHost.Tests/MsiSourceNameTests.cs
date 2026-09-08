using System.Reflection;

internal static class MsiSourceNameTests
{
    internal static int Run(Assembly assembly)
    {
        var type = assembly.GetType("Netgrid.SetupHost.MsiSourceName", true)!;
        var validate = type.GetMethod("Validate")!;
        var resolve = type.GetMethod("Resolve")!;
        var checks = 0;
        foreach (var name in new[] { "product.msi", "NETGRID-1.0.8212-x64.msi", "NETGRID Setup (1).msi", "NETGRID.MSI" })
            Check((string)validate.Invoke(null, [name])! == name, "registered_basename_preserved");
        foreach (var name in new[] { "", " ", ".msi", "../product.msi", @"..\product.msi", @"C:\product.msi",
            @"\\server\product.msi", "product.msi:stream", "product.msi ", "product.msi.", "product.exe",
            "CON.msi", "nul.msi", "LPT1.msi", "COM9.extra.msi", "CON .msi", "bad\nname.msi", new string('a', 252) + ".msi" })
            Reject(() => validate.Invoke(null, [name]));
        Reject(() => resolve.Invoke(null, [Guid.Empty, new Version(1, 0, 8212)]));
        // The real read-only Windows Installer API: an unregistered ProductCode
        // must use the regular bundle name, not product.msi or a random basename.
        var fresh = (string)resolve.Invoke(null, [Guid.NewGuid(), new Version(1, 0, 8212)])!;
        Check(fresh == "NETGRID-1.0.8212-x64.msi", "new_product_uses_distribution_name");
        return checks;

        void Check(bool value, string code) { if (!value) throw new Exception("msi_source_test_failed:" + code); checks++; }
        void Reject(Action action)
        {
            try { action(); }
            catch (TargetInvocationException error) when (error.InnerException?.GetType().FullName == "Netgrid.SetupHost.SetupException")
            {
                Check((string)error.InnerException.GetType().GetProperty("Code")!.GetValue(error.InnerException)! == "msi_source_unavailable",
                    "invalid_source_fails_closed");
                return;
            }
            throw new Exception("invalid_msi_source_accepted");
        }
    }
}
