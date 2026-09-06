using System.Diagnostics;
using Netgrid.Windows;

namespace Netgrid.Launcher;

internal static class Program
{
    private const string MutexName = @"Global\LevelX2.NETGRID.Launcher.V1";

    [STAThread]
    private static int Main(string[] args) => RunAsync(args).GetAwaiter().GetResult();

    // C# synthesizes an unannotated entry point for an async Main. Keep the
    // real Windows entry point synchronous so native SaveFileDialog/OLE calls
    // run on STA. The interactive branch below reaches Application.Run without
    // awaiting; only the separate headless branches yield before returning.
    private static async Task<int> RunAsync(string[] args)
    {
        if (args.Length == 2 && args[0] == "--audit-localization")
        {
            await File.WriteAllTextAsync(Path.GetFullPath(args[1]), System.Text.Json.JsonSerializer.Serialize(UiText.Audit));
            return 0;
        }
        var options = LauncherOptions.Parse(args);
        if (options.DiagnosticOutput is not null)
        {
            try
            {
                await using var runtime = LauncherRuntime.Load(options);
                DiagnosticsExporter.Export(runtime, options.DiagnosticOutput);
                return 0;
            }
            catch
            {
                return 2;
            }
        }
        if (options.UpdateCheckApi is not null)
        {
            try
            {
                using var http = UpdateDiscovery.CreateHttpClient();
                var result = await UpdateDiscovery.CheckAsync(http, new Uri(options.UpdateCheckApi), options.CurrentVersionOverride!, options.AllowPrereleaseOverride);
                await File.WriteAllTextAsync(options.UpdateCheckOutput!, System.Text.Json.JsonSerializer.Serialize(result));
                return 0;
            }
            catch (Exception exception)
            {
                await File.WriteAllTextAsync(options.UpdateCheckOutput!, System.Text.Json.JsonSerializer.Serialize(new { ok = false, error = exception.Message }));
                return 2;
            }
        }
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
        if (options.HeadlessVerify)
        {
            try
            {
                await using var runtime = LauncherRuntime.Load(options);
                await runtime.StartAsync();
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
