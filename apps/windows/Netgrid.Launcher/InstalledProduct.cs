using System.Text.Json;

namespace Netgrid.Launcher;

internal static class InstalledProduct
{
    public static string Version(string programRoot)
    {
        var path = Path.Combine(programRoot, "product-layout.json");
        using var document = JsonDocument.Parse(File.ReadAllText(path));
        return document.RootElement.GetProperty("product").GetProperty("installerVersion").GetString()
            ?? throw new InvalidOperationException("installed_version_missing");
    }
}
