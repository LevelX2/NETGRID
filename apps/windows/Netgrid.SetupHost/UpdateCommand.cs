using Netgrid.Windows;

namespace Netgrid.SetupHost;

internal sealed record UpdateCommand(bool Uninstall, string? ProgramRoot, string? Lease)
{
    public int ExitCode(int result) => result is 0 or 3010 || (Uninstall && Lease is null && result == 1605) ? 0 : result;

    // Standalone setup operations and updater-owned operations are explicit
    // command modes, not an automatic takeover of an existing registry lease.
    public static UpdateCommand Parse(string[] args)
    {
        if (args.Length == 1 && args[0] == "--uninstall-update") return new(true, null, null);
        if (args.Length == 3 && args[0] == "--install-update" && args[1] == "--program-root")
            return new(false, ReadRoot(args[2]), null);
        if (args.Length != 5 || args[0] is not ("--install-update" or "--uninstall-update") ||
            args[1] != "--program-root" || args[3] != "--update-lease")
            throw new SetupException("setup_arguments_invalid");
        try { InstallationGate.ValidateLease(args[4]); }
        catch (InvalidOperationException) { throw new SetupException("update_context_invalid"); }
        return new(args[0] == "--uninstall-update", ReadRoot(args[2]), args[4]);
    }

    private static string ReadRoot(string root)
    {
        try { InstallationGate.KeyFor(root); return Path.TrimEndingDirectorySeparator(Path.GetFullPath(root)); }
        catch (Exception error) when (error is ArgumentException or NotSupportedException or InvalidOperationException)
        { throw new SetupException("update_context_invalid"); }
    }
}
