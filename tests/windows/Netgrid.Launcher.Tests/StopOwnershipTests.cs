using System.Diagnostics;
using System.Reflection;

internal static class StopOwnershipTests
{
    public static async Task<int> Run(Assembly assembly)
    {
        var runtimeType = assembly.GetType("Netgrid.Launcher.LauncherRuntime", true)!;
        const BindingFlags fields = BindingFlags.NonPublic | BindingFlags.Instance;
        var serverField = runtimeType.GetField("_server", fields)!;
        var webField = runtimeType.GetField("_web", fields)!;
        var checks = 0;
        void Assert(bool value, string message)
        {
            if (!value) throw new Exception("stop_ownership_test_failed:" + message);
            checks++;
        }
        object NewRuntime(bool blocked = false)
        {
            var environmentType = assembly.GetType("Netgrid.Launcher.RuntimeEnvironment", true)!;
            var environment = Activator.CreateInstance(environmentType, fields, null,
                [new Dictionary<string, string> {
                    ["NETGRID_SERVER_BASE_URL"] = "http://127.0.0.1:1",
                    ["NETGRID_WEB_BASE_URL"] = "http://127.0.0.1:2",
                }], null)!;
            return Activator.CreateInstance(runtimeType, fields, null,
                [Path.Combine(Path.GetTempPath(), "NETGRID-inert-stop-ownership-fixture"), environment, (Func<bool>)(() => blocked)], null)!;
        }
        async Task Call(object runtime, string method) =>
            await ((Task)runtimeType.GetMethod(method)!.Invoke(runtime, null)!).WaitAsync(TimeSpan.FromSeconds(15));
        async Task RejectStop(object runtime, string method)
        {
            try { await Call(runtime, method); throw new Exception("stop_ownership_test_failed:unverified_exit_accepted"); }
            catch (AggregateException error) when (error.Message.StartsWith("launcher_runtime_stop_failed", StringComparison.Ordinal))
            {
                Assert(error.InnerExceptions.Count == 1 && error.InnerExceptions[0].Message == "launcher_child_stop_failed:server", "failure_identifies_owned_role");
            }
        }
        async Task<Process> Child()
        {
            var executable = Environment.ProcessPath!;
            if (Path.GetFileNameWithoutExtension(executable) != "Netgrid.Launcher.Tests")
                throw new Exception("stop_ownership_test_host_invalid");
            var child = Process.Start(new ProcessStartInfo(executable) {
                Arguments = "--installation-stop-child", UseShellExecute = false, CreateNoWindow = true,
                RedirectStandardInput = true, RedirectStandardOutput = true,
            })!;
            try
            {
                if (await child.StandardOutput.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(10)) != "READY")
                    throw new Exception("stop_ownership_test_child_not_ready");
                return child;
            }
            catch
            {
                if (!child.HasExited) { child.Kill(); await child.WaitForExitAsync(); }
                child.Dispose();
                throw;
            }
        }

        // Observe exit through separately retained handles: StopAsync itself
        // must await exit, rather than relying on a later test wait to do so.
        var normal = NewRuntime();
        var server = await Child();
        using var serverObserver = Process.GetProcessById(server.Id);
        _ = serverObserver.Handle;
        serverField.SetValue(normal, server);
        try
        {
            var web = await Child();
            using var webObserver = Process.GetProcessById(web.Id);
            _ = webObserver.Handle;
            webField.SetValue(normal, web);
            await Call(normal, "StopAsync");
            Assert(serverObserver.HasExited && webObserver.HasExited, "successful_stop_already_proves_both_exits");
            Assert(serverObserver.ExitCode == 0, "server_used_graceful_shutdown");
            Assert(serverField.GetValue(normal) is null && webField.GetValue(normal) is null, "verified_exit_releases_both_slots");
        }
        finally { await ((IAsyncDisposable)normal).DisposeAsync(); }

        foreach (var watched in new[] { false, true })
        {
            var runtime = NewRuntime(blocked: watched);
            // This inert handle has no process identity. Querying it fails;
            // no existing or foreign process is used to inject the failure.
            using var unreadable = new Process();
            serverField.SetValue(runtime, unreadable);
            var web = await Child();
            using var webObserver = Process.GetProcessById(web.Id);
            _ = webObserver.Handle;
            webField.SetValue(runtime, web);
            try
            {
                if (watched)
                {
                    var stopped = 0;
                    var failed = 0;
                    EventHandler<string?> onStopped = (_, _) => stopped++;
                    EventHandler<string> onFailed = (_, message) => { if (!string.IsNullOrWhiteSpace(message)) failed++; };
                    runtimeType.GetEvent("InstallationStopped")!.AddEventHandler(runtime, onStopped);
                    runtimeType.GetEvent("FatalFailure")!.AddEventHandler(runtime, onFailed);
                    var watching = (Task)runtimeType.GetMethod("WatchInstallationAsync", fields)!.Invoke(runtime, null)!;
                    runtimeType.GetField("_installationWatch", fields)!.SetValue(runtime, watching);
                    await watching.WaitAsync(TimeSpan.FromSeconds(15));
                    Assert(stopped == 0 && failed == 1, "watch_reports_failure_not_successful_stop");
                }
                else
                {
                    await RejectStop(runtime, "StopAsync");
                    await RejectStop(runtime, "StartAsync");
                }
                Assert(webObserver.HasExited, "bad_server_handle_does_not_prevent_web_stop");
                Assert(ReferenceEquals(serverField.GetValue(runtime), unreadable), "unverified_server_slot_stays_owned");
                Assert(webField.GetValue(runtime) is null, "independently_verified_web_slot_released");
                Assert((bool)runtimeType.GetField("_stopping", fields)!.GetValue(runtime)!, "failed_stop_does_not_allow_automatic_recovery");
                await RejectStop(runtime, "StopAsync");
                Assert(ReferenceEquals(serverField.GetValue(runtime), unreadable), "failed_retry_does_not_forget_handle");
            }
            finally
            {
                // Remove only the inert injected fault, not a live process.
                serverField.SetValue(runtime, null);
                await ((IAsyncDisposable)runtime).DisposeAsync();
                if (!webObserver.HasExited) { webObserver.Kill(); await webObserver.WaitForExitAsync(); }
            }
        }
        return checks;
    }
}
