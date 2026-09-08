using System.Runtime.InteropServices;
using System.Text;

namespace Netgrid.Windows;

// Reads the actual MSI in read-only mode. The same owner supplies the build
// and installed reconstruction; no separately maintained footprint manifest.
internal static class MsiBundleMetadata
{
    public static SetupBundle.Metadata Read(string msiPath)
    {
        Check(MsiOpenDatabase(msiPath, IntPtr.Zero, out var database));
        try
        {
            var versionText = Property(database, "ProductVersion");
            var codeText = Property(database, "ProductCode");
            if (!Version.TryParse(versionText, out var version) || version.Build < 0 || version.Revision != -1 ||
                version.Major > 255 || version.Minor > 255 || version.Build > 65535 || version.ToString(3) != versionText ||
                !Guid.TryParseExact(codeText, "B", out var code) || code == Guid.Empty)
                throw Invalid("identity_invalid");
            Check(MsiDatabaseOpenView(database, "SELECT `FileSize` FROM `File`", out var view));
            try
            {
                Check(MsiViewExecute(view, 0));
                long bytes = 0, count = 0;
                while (Fetch(view, out var record))
                {
                    try
                    {
                        var size = MsiRecordGetInteger(record, 1);
                        if (size < 0) throw Invalid("file_size_invalid");
                        bytes = checked(bytes + size);
                        count = checked(count + 1);
                    }
                    finally { MsiCloseHandle(record); }
                }
                if (bytes <= 0 || count <= 0) throw Invalid("footprint_empty");
                return new(version, code, bytes, count);
            }
            finally { MsiCloseHandle(view); }
        }
        finally { MsiCloseHandle(database); }
    }

    private static string Property(uint database, string name)
    {
        // Name is exclusively one of the two constants in Read(), never input.
        Check(MsiDatabaseOpenView(database, $"SELECT `Value` FROM `Property` WHERE `Property` = '{name}'", out var view));
        try
        {
            Check(MsiViewExecute(view, 0));
            if (!Fetch(view, out var record)) throw Invalid("identity_missing");
            string value;
            try
            {
                var buffer = new StringBuilder(128);
                uint length = 127;
                Check(MsiRecordGetString(record, 1, buffer, ref length));
                value = buffer.ToString();
            }
            finally { MsiCloseHandle(record); }
            if (Fetch(view, out var extra)) { MsiCloseHandle(extra); throw Invalid("identity_ambiguous"); }
            return value;
        }
        finally { MsiCloseHandle(view); }
    }

    private static bool Fetch(uint view, out uint record)
    {
        var status = MsiViewFetch(view, out record);
        if (status == 259) return false;
        Check(status);
        return true;
    }
    private static void Check(uint status)
    {
        if (status != 0) throw Invalid("read_failed_" + status);
    }
    private static InvalidOperationException Invalid(string code) => new("setup_bundle_msi_" + code);

    [DllImport("msi.dll", EntryPoint = "MsiOpenDatabaseW", CharSet = CharSet.Unicode, ExactSpelling = true)]
    private static extern uint MsiOpenDatabase(string path, IntPtr persist, out uint database);
    [DllImport("msi.dll", EntryPoint = "MsiDatabaseOpenViewW", CharSet = CharSet.Unicode, ExactSpelling = true)]
    private static extern uint MsiDatabaseOpenView(uint database, string query, out uint view);
    [DllImport("msi.dll", ExactSpelling = true)] private static extern uint MsiViewExecute(uint view, uint record);
    [DllImport("msi.dll", ExactSpelling = true)] private static extern uint MsiViewFetch(uint view, out uint record);
    [DllImport("msi.dll", ExactSpelling = true)] private static extern int MsiRecordGetInteger(uint record, uint field);
    [DllImport("msi.dll", EntryPoint = "MsiRecordGetStringW", CharSet = CharSet.Unicode, ExactSpelling = true)]
    private static extern uint MsiRecordGetString(uint record, uint field, StringBuilder value, ref uint length);
    [DllImport("msi.dll", ExactSpelling = true)] private static extern uint MsiCloseHandle(uint handle);
}
