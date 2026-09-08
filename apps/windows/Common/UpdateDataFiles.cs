using System.ComponentModel;
using System.Runtime.InteropServices;
using Microsoft.Win32.SafeHandles;

namespace Netgrid.Windows;

internal static class UpdateDataFiles
{
    // Pin directories against renaming/reparse replacement while traversing.
    // Files are opened without following reparse points and without allowing
    // concurrent writers/deleters. No backup/restore privilege is enabled.
    public static SafeFileHandle PinDirectory(string path)
    {
        // FILE_LIST_DIRECTORY participates in share checks; an attribute-only
        // handle is insufficient to pin a directory against a rename.
        var handle = Open(path, 0x81, 3, 0x02200000);
        try
        {
            var information = Information(handle);
            if ((information.Attributes & 0x400) != 0 || (information.Attributes & 0x10) == 0)
                throw new InvalidOperationException("update_data_directory_reparse_or_invalid");
            return handle;
        }
        catch { handle.Dispose(); throw; }
    }

    public static FileStream ReadLocked(string path)
    {
        var handle = Open(path, 0x80000000, 1, 0x08200000);
        try
        {
            var information = Information(handle);
            if ((information.Attributes & (0x400 | 0x10)) != 0 || information.Links != 1)
                throw new InvalidOperationException("update_data_file_link_or_invalid");
            return new FileStream(handle, FileAccess.Read);
        }
        catch { handle.Dispose(); throw; }
    }

    public static List<SafeFileHandle> PinAncestors(string path)
    {
        var paths = new Stack<string>();
        for (string? next = path; next is not null; next = Path.GetDirectoryName(next)) paths.Push(next);
        var result = new List<SafeFileHandle>();
        try
        {
            foreach (var directory in paths) result.Add(PinDirectory(directory));
            return result;
        }
        catch { foreach (var handle in result) handle.Dispose(); throw; }
    }

    private static SafeFileHandle Open(string path, uint access, uint share, uint flags)
    {
        var handle = CreateFileW(path, access, share, IntPtr.Zero, 3, flags, IntPtr.Zero);
        if (!handle.IsInvalid) return handle;
        var error = Marshal.GetLastWin32Error();
        handle.Dispose();
        // Fixed diagnosis: paths or contents can contain private data.
        throw new Win32Exception(error, "update_data_file_open_failed");
    }
    private static ByHandleFileInformation Information(SafeFileHandle handle)
    {
        if (!GetFileInformationByHandle(handle, out var information))
            throw new Win32Exception(Marshal.GetLastWin32Error(), "update_data_file_information_failed");
        return information;
    }
    [StructLayout(LayoutKind.Sequential)]
    private struct ByHandleFileInformation
    {
        public uint Attributes;
        public System.Runtime.InteropServices.ComTypes.FILETIME CreationTime;
        public System.Runtime.InteropServices.ComTypes.FILETIME AccessTime;
        public System.Runtime.InteropServices.ComTypes.FILETIME WriteTime;
        public uint VolumeSerial, SizeHigh, SizeLow, Links, IndexHigh, IndexLow;
    }
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true, ExactSpelling = true)]
    private static extern SafeFileHandle CreateFileW(string name, uint access, uint share, IntPtr attributes, uint disposition, uint flags, IntPtr template);
    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool GetFileInformationByHandle(SafeFileHandle handle, out ByHandleFileInformation information);
}
