using Microsoft.Win32;

namespace Netgrid.Launcher;

internal sealed record LauncherOptions(
    bool OpenMaintenance,
    bool HeadlessSmoke,
    bool HeadlessVerify,
    string? UpdateCheckApi,
    string? UpdateCheckOutput,
    string? CurrentVersionOverride,
    bool AllowPrereleaseOverride,
    string? DiagnosticOutput,
    string? ProgramRootOverride,
    string? EnvironmentFileOverride
)
{
    private const string RegistryPath = @"SOFTWARE\LevelX2\NETGRID";

    public static LauncherOptions Parse(string[] args)
    {
        var openMaintenance = false;
        var headlessSmoke = false;
        var headlessVerify = false;
        string? updateCheckApi = null;
        string? updateCheckOutput = null;
        string? currentVersion = null;
        var allowPrerelease = false;
        string? diagnosticOutput = null;
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
                case "--headless-verify":
                    headlessVerify = true;
                    break;
                case "--check-update-api" when index + 1 < args.Length:
                    updateCheckApi = args[++index];
                    break;
                case "--check-update-output" when index + 1 < args.Length:
                    updateCheckOutput = Path.GetFullPath(args[++index]);
                    break;
                case "--current-version" when index + 1 < args.Length:
                    currentVersion = args[++index];
                    break;
                case "--allow-prerelease":
                    allowPrerelease = true;
                    break;
                case "--export-diagnostics" when index + 1 < args.Length:
                    diagnosticOutput = Path.GetFullPath(args[++index]);
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
        var updateDiagnostic = updateCheckApi is not null || updateCheckOutput is not null || currentVersion is not null;
        if (updateDiagnostic && (updateCheckApi is null || updateCheckOutput is null || currentVersion is null))
            throw new InvalidOperationException("launcher_update_diagnostic_incomplete");
        if (!headlessSmoke && !headlessVerify && diagnosticOutput is null && (programRoot is not null || environmentFile is not null))
            throw new InvalidOperationException("launcher_diagnostic_override_forbidden");
        if ((headlessSmoke || headlessVerify) && updateDiagnostic)
            throw new InvalidOperationException("launcher_diagnostic_mode_conflict");
        return new LauncherOptions(openMaintenance, headlessSmoke, headlessVerify, updateCheckApi, updateCheckOutput, currentVersion, allowPrerelease, diagnosticOutput, programRoot, environmentFile);
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

    public string ResolveWebUrl() => RuntimeEnvironment.Load(ResolveEnvironmentFile()).OptionalUri("NETGRID_LAUNCHER_WEB_URL", "NETGRID_WEB_BASE_URL").ToString().TrimEnd('/');

    public string ResolveMaintenanceUrl() => $"{ResolveWebUrl()}/maintenance";
}
