using Microsoft.Win32;

namespace Netgrid.Launcher;

internal sealed record LauncherOptions(
    bool OpenMaintenance,
    bool HeadlessSmoke,
    string? ProgramRootOverride,
    string? EnvironmentFileOverride
)
{
    private const string RegistryPath = @"SOFTWARE\LevelX2\NETGRID";

    public static LauncherOptions Parse(string[] args)
    {
        var openMaintenance = false;
        var headlessSmoke = false;
        string? programRoot = null;
        string? environmentFile = null;
        for (var index = 0; index < args.Length; index++)
        {
            switch (args[index])
            {
                case "--open-maintenance":
                    openMaintenance = true;
                    break;
                case "--headless-smoke":
                    headlessSmoke = true;
                    break;
                case "--program-root" when index + 1 < args.Length:
                    programRoot = Path.GetFullPath(args[++index]);
                    break;
                case "--environment-file" when index + 1 < args.Length:
                    environmentFile = Path.GetFullPath(args[++index]);
                    break;
                default:
                    throw new InvalidOperationException("launcher_argument_invalid");
            }
        }
        if (!headlessSmoke && (programRoot is not null || environmentFile is not null))
            throw new InvalidOperationException("launcher_diagnostic_override_forbidden");
        return new LauncherOptions(openMaintenance, headlessSmoke, programRoot, environmentFile);
    }

    public string ResolveProgramRoot() => ProgramRootOverride ?? Path.TrimEndingDirectorySeparator(AppContext.BaseDirectory);

    public string ResolveEnvironmentFile()
    {
        if (EnvironmentFileOverride is not null) return EnvironmentFileOverride;
        using var key = Registry.LocalMachine.OpenSubKey(RegistryPath, writable: false);
        var dataRoot = key?.GetValue("RuntimeDataRoot") as string;
        if (string.IsNullOrWhiteSpace(dataRoot))
        {
            dataRoot = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "NETGRID");
        }
        return Path.Combine(Path.GetFullPath(dataRoot), "config", "runtime.env");
    }

    public string ResolveWebUrl() => RuntimeEnvironment.Load(ResolveEnvironmentFile()).RequiredUri("NETGRID_WEB_BASE_URL").ToString().TrimEnd('/');

    public string ResolveMaintenanceUrl() => $"{ResolveWebUrl()}/maintenance";
}
