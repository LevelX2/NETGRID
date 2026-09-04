using System.Diagnostics;

namespace Netgrid.Launcher;

internal static class Program
{
    private const string MutexName = @"Global\LevelX2.NETGRID.Launcher.V1";

    [STAThread]
    private static async Task<int> Main(string[] args)
    {
        var options = LauncherOptions.Parse(args);
        if (options.HeadlessSmoke)
        {
            try
            {
                await using var runtime = LauncherRuntime.Load(options);
                await runtime.StartAsync();
                await runtime.VerifyRecoveryPolicyAsync();
                await runtime.StopAsync();
                return 0;
            }
            catch
            {
                return 2;
            }
        }

        using var mutex = new Mutex(initiallyOwned: true, MutexName, out var ownsMutex);
        if (!ownsMutex)
        {
            OpenUrl(options.OpenMaintenance ? options.ResolveMaintenanceUrl() : options.ResolveWebUrl());
            return 0;
        }

        ApplicationConfiguration.Initialize();
        using var context = new TrayApplicationContext(options);
        Application.Run(context);
        mutex.ReleaseMutex();
        return context.ExitCode;
    }

    internal static void OpenUrl(string url)
    {
        Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
    }
}
