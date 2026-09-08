using System.Runtime.InteropServices;
using System.Text;

namespace Netgrid.SetupHost;

internal static class MsiSourceName
{
    // SecureRepair resolves PackageName relative to the supplied source folder.
    // A random extraction basename is not a replacement for that registered name.
    // Read Windows Installer's per-machine source authority; never rewrite it.
    public static string Resolve(Guid productCode, Version version)
    {
        if (productCode == Guid.Empty) throw new SetupException("msi_source_unavailable");
        var code = productCode.ToString("B").ToUpperInvariant();
        uint length = 0;
        var result = MsiSourceListGetInfoW(code, null, 4, 0, "PackageName", null, ref length);
        // A genuinely new ProductCode uses the regular distribution filename.
        if (result == 1605) return Validate($"NETGRID-{version.ToString(3)}-x64.msi");
        if (result != 0 || length is 0 or > 255) throw new SetupException("msi_source_unavailable");
        var buffer = new StringBuilder(checked((int)length + 1));
        var capacity = checked(length + 1);
        result = MsiSourceListGetInfoW(code, null, 4, 0, "PackageName", buffer, ref capacity);
        if (result != 0 || capacity != length) throw new SetupException("msi_source_unavailable");
        return Validate(buffer.ToString());
    }

    public static string Validate(string name)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Length > 255 || name.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0 ||
            !name.EndsWith(".msi", StringComparison.OrdinalIgnoreCase) || Path.GetFileNameWithoutExtension(name).Length == 0)
            throw new SetupException("msi_source_unavailable");
        var stem = name.Split('.')[0].TrimEnd(' ', '.').ToUpperInvariant();
        if (stem is "CON" or "PRN" or "AUX" or "NUL" ||
            (stem.Length == 4 && (stem.StartsWith("COM") || stem.StartsWith("LPT")) && stem[3] is >= '1' and <= '9'))
            throw new SetupException("msi_source_unavailable");
        return name;
    }

    [DllImport("msi.dll", CharSet = CharSet.Unicode, ExactSpelling = true)]
    private static extern uint MsiSourceListGetInfoW(string productCode, string? userSid, uint context,
        uint options, string property, StringBuilder? value, ref uint length);
}
