using System.Runtime.InteropServices;
using Netgrid.Windows;

namespace Netgrid.SetupHost;

internal sealed record InstallationFootprint(long PayloadBytes, long PayloadFileCount, long MsiBytes);
internal sealed record DriveSpace(string Root, long RequiredBytes, long AvailableBytes);

internal static class InstallationSpace
{
    private const long MiB = 1024L * 1024;
    public const long InitialDataReserveBytes = 512 * MiB;

    public static void Check(string programRoot, string dataRoot)
    {
        var executable = Environment.ProcessPath ?? throw new SetupException("setup_path_missing");
        var plan = Plan(programRoot, dataRoot, Path.GetTempPath(),
            Environment.GetFolderPath(Environment.SpecialFolder.Windows),
            MsiPayload.Footprint, new FileInfo(executable).Length, AllocationUnit);
        var drives = Assess(plan, root =>
        {
            try { return new DriveInfo(root).AvailableFreeSpace; }
            catch (Exception exception) when (exception is IOException or UnauthorizedAccessException)
            { throw new SetupException("disk_space_unknown", root); }
        });
        EnsureAvailable(drives);
    }

    public static IReadOnlyDictionary<string, long> Plan(string programRoot, string dataRoot,
        string temporaryRoot, string windowsRoot, InstallationFootprint footprint, long setupBytes,
        Func<string, long> allocationUnit)
    {
        if (footprint.PayloadBytes <= 0 || footprint.PayloadFileCount <= 0 || footprint.MsiBytes <= 0 || setupBytes <= 0)
            throw new SetupException("disk_space_metadata_invalid");
        var needs = new Dictionary<string, long>(StringComparer.OrdinalIgnoreCase);
        try
        {
            // A complete new payload, even for upgrades; don't count on old files
            // being removed before the new files and rollback state are safe.
            var programDrive = Root(programRoot);
            Add(programDrive, checked(footprint.PayloadBytes + footprint.PayloadFileCount * Unit(programDrive)));
            // Protected original-MSI and Setup caches plus initial working-data reserve.
            var dataDrive = Root(dataRoot);
            Add(dataDrive, checked(setupBytes + footprint.MsiBytes + InitialDataReserveBytes + 2 * Unit(dataDrive)));
            // Embedded MSI extraction and a conservative full-payload temporary buffer
            // for extraction/installer/native-runtime work. This is a reserve, not a
            // claim that every byte will remain occupied after installation.
            var temporaryDrive = Root(temporaryRoot);
            Add(temporaryDrive, checked(footprint.MsiBytes + footprint.PayloadBytes + footprint.PayloadFileCount * Unit(temporaryDrive)));
            var windowsDrive = Root(windowsRoot);
            Add(windowsDrive, checked(footprint.MsiBytes + Unit(windowsDrive)));
            return needs;
        }
        catch (OverflowException) { throw new SetupException("disk_space_metadata_invalid"); }

        long Unit(string root)
        {
            var value = allocationUnit(root);
            if (value <= 0) throw new SetupException("disk_space_unknown", root);
            return value;
        }
        void Add(string root, long bytes) => needs[root] = checked(needs.GetValueOrDefault(root) + bytes);
    }

    public static IReadOnlyList<DriveSpace> Assess(IReadOnlyDictionary<string, long> needs, Func<string, long> available) =>
        needs.OrderBy(entry => entry.Key, StringComparer.OrdinalIgnoreCase)
            .Select(entry => new DriveSpace(entry.Key, entry.Value, available(entry.Key))).ToArray();

    public static void EnsureAvailable(IReadOnlyList<DriveSpace> drives)
    {
        foreach (var drive in drives)
            if (drive.AvailableBytes < 0) throw new SetupException("disk_space_unknown", drive.Root);
        var shortages = drives.Where(drive => drive.AvailableBytes < drive.RequiredBytes).ToArray();
        if (shortages.Length == 0) return;
        var message = string.Join(Environment.NewLine, shortages.Select(drive =>
            UiText.Get("setup.space.drive", drive.Root,
                Math.Ceiling(drive.RequiredBytes / (double)MiB), Math.Floor(drive.AvailableBytes / (double)MiB))));
        throw new SetupException("disk_space_low", message);
    }

    private static string Root(string path)
    {
        if (!Path.IsPathFullyQualified(path) || path.StartsWith(@"\\", StringComparison.Ordinal))
            throw new SetupException("disk_space_unknown", path);
        return Path.GetPathRoot(path) ?? throw new SetupException("disk_space_unknown", path);
    }

    private static long AllocationUnit(string root)
    {
        if (!GetDiskFreeSpace(root, out var sectors, out var bytes, out _, out _))
            throw new SetupException("disk_space_unknown", root);
        return checked((long)sectors * bytes);
    }

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool GetDiskFreeSpace(string rootPathName, out uint sectorsPerCluster,
        out uint bytesPerSector, out uint freeClusters, out uint totalClusters);
}
