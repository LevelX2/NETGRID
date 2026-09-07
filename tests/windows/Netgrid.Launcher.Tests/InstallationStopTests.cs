using System.Reflection;
using System.Diagnostics;

internal static class InstallationStopTests
{
    public static async Task<int> Run(Assembly assembly)
    {
        var type = assembly.GetType("Netgrid.Launcher.LauncherRuntime", true)!;
        var stop = type.GetMethod("StopForInstallationAsync")
            ?? throw new Exception("installation_stop_test_failed:terminal_installer_stop_missing");
        var start = type.GetMethod("StartAsync")!;
        var checks = 0;
        object NewRuntime(Func<bool>? gate = null)
        {
            var environmentType = assembly.GetType("Netgrid.Launcher.RuntimeEnvironment", true)!;
            var environment = Activator.CreateInstance(environmentType, BindingFlags.Instance | BindingFlags.NonPublic,
                null, [new Dictionary<string, string>
                {
                    ["NETGRID_SERVER_BASE_URL"] = "http://127.0.0.1:1",
                    ["NETGRID_WEB_BASE_URL"] = "http://127.0.0.1:2",
                }], null)!;
            // No real program files, database, listener or registry is touched.
            return Activator.CreateInstance(type, BindingFlags.Instance | BindingFlags.NonPublic,
                null, [Path.Combine(Path.GetTempPath(), "NETGRID-inert-installation-stop-fixture"), environment, gate ?? (() => false)], null)!;
        }
        async Task RejectStart(object runtime)
        {
            try
            {
                await (Task)start.Invoke(runtime, null)!;
                throw new Exception("installation_stop_test_failed:restart_after_installation_stop");
            }
            catch (InvalidOperationException error) when (error.Message == "launcher_installation_stopping")
            {
                checks++;
            }
        }

        var first = NewRuntime();
        try
        {
            await (Task)stop.Invoke(first, null)!;
            await RejectStart(first);
            // Ordinary Stop must never undo the installer-owned terminal state.
            await (Task)type.GetMethod("StopAsync")!.Invoke(first, null)!;
            await RejectStart(first);
            await (Task)stop.Invoke(first, null)!;
            checks++;
        }
        finally { await ((IAsyncDisposable)first).DisposeAsync(); }

        var racing = NewRuntime();
        var lifecycle = (SemaphoreSlim)type.GetField("_lifecycle", BindingFlags.NonPublic | BindingFlags.Instance)!.GetValue(racing)!;
        try
        {
            await lifecycle.WaitAsync();
            // Queue a user retry first. The installer request must invalidate
            // it immediately, not only after acquiring the lifecycle lock.
            var queuedStart = (Task)start.Invoke(racing, null)!;
            var queuedStop = (Task)stop.Invoke(racing, null)!;
            if (queuedStop.IsCompleted) throw new Exception("installation_stop_test_failed:stop_bypassed_owner_lock");
            lifecycle.Release();
            try
            {
                await queuedStart;
                throw new Exception("installation_stop_test_failed:queued_retry_started");
            }
            catch (InvalidOperationException error) when (error.Message == "launcher_installation_stopping") { checks++; }
            await queuedStop;
            await RejectStart(racing);
        }
        finally { await ((IAsyncDisposable)racing).DisposeAsync(); }

        var monitored = NewRuntime();
        var owned = new List<(int Id, DateTime Started)>();
        var monitorLock = (SemaphoreSlim)type.GetField("_lifecycle", BindingFlags.NonPublic | BindingFlags.Instance)!.GetValue(monitored)!;
        var lockHeld = false;
        try
        {
            async Task<Process> Child()
            {
                var executable = Environment.ProcessPath!;
                if (Path.GetFileNameWithoutExtension(executable) != "Netgrid.Launcher.Tests")
                    throw new Exception("installation_stop_fixture_host_invalid");
                var process = Process.Start(new ProcessStartInfo(executable)
                {
                    Arguments = "--installation-stop-child", UseShellExecute = false, CreateNoWindow = true,
                    RedirectStandardInput = true, RedirectStandardOutput = true,
                })!;
                owned.Add((process.Id, process.StartTime));
                if (await process.StandardOutput.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(10)) != "READY")
                    throw new Exception("installation_stop_fixture_not_ready");
                return process;
            }
            var server = await Child();
            var web = await Child();
            type.GetField("_server", BindingFlags.NonPublic | BindingFlags.Instance)!.SetValue(monitored, server);
            type.GetField("_web", BindingFlags.NonPublic | BindingFlags.Instance)!.SetValue(monitored, web);
            var recovered = 0;
            var failed = 0;
            EventHandler onRecovered = (_, _) => recovered++;
            EventHandler<string> onFailed = (_, _) => failed++;
            type.GetEvent("Recovered")!.AddEventHandler(monitored, onRecovered);
            type.GetEvent("FatalFailure")!.AddEventHandler(monitored, onFailed);
            var monitor = (Task)type.GetMethod("MonitorAsync", BindingFlags.NonPublic | BindingFlags.Instance)!
                .Invoke(monitored, [server, web])!;
            await monitorLock.WaitAsync();
            lockHeld = true;
            var stopping = (Task)stop.Invoke(monitored, null)!;
            await server.StandardInput.WriteLineAsync("shutdown");
            await server.StandardInput.FlushAsync();
            await server.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(10));
            await monitor.WaitAsync(TimeSpan.FromSeconds(3));
            if (recovered != 0 || failed != 0 || (int)type.GetField("_recoveryAttempts", BindingFlags.NonPublic | BindingFlags.Instance)!.GetValue(monitored)! != 0)
                throw new Exception("installation_stop_test_failed:child_exit_started_recovery_or_error_dialog");
            checks++;
            monitorLock.Release();
            lockHeld = false;
            await stopping.WaitAsync(TimeSpan.FromSeconds(15));
            await RejectStart(monitored);
            foreach (var identity in owned)
            {
                Process remaining;
                try { remaining = Process.GetProcessById(identity.Id); }
                catch (ArgumentException) { checks++; continue; }
                using (remaining)
                {
                    if (remaining.StartTime != identity.Started) throw new Exception("installation_stop_fixture_identity_changed");
                    await remaining.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(3));
                    checks++;
                }
            }
        }
        finally
        {
            if (lockHeld) monitorLock.Release();
            await ((IAsyncDisposable)monitored).DisposeAsync();
            foreach (var identity in owned)
            {
                Process process;
                try { process = Process.GetProcessById(identity.Id); }
                catch (ArgumentException) { continue; } // Already exited is the expected fixture result.
                using (process)
                {
                    if (process.StartTime != identity.Started) throw new Exception("installation_stop_fixture_identity_changed");
                    if (!process.HasExited) { process.Kill(); await process.WaitForExitAsync(); }
                }
            }
        }
        foreach (var unreadable in new[] { false, true })
        {
            var blocked = 0;
            var firstRead = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
            var watched = NewRuntime(() =>
            {
                firstRead.TrySetResult();
                if (unreadable) throw new InvalidOperationException("installation_gate_lease_invalid");
                return Volatile.Read(ref blocked) == 1;
            });
            try
            {
                var stopped = new TaskCompletionSource<string?>(TaskCreationOptions.RunContinuationsAsynchronously);
                EventHandler<string?> handler = (_, code) => stopped.TrySetResult(code);
                type.GetEvent("InstallationStopped")!.AddEventHandler(watched, handler);
                var watching = (Task)type.GetMethod("WatchInstallationAsync", BindingFlags.NonPublic | BindingFlags.Instance)!.Invoke(watched, null)!;
                type.GetField("_installationWatch", BindingFlags.NonPublic | BindingFlags.Instance)!.SetValue(watched, watching);
                await firstRead.Task.WaitAsync(TimeSpan.FromSeconds(3));
                Interlocked.Exchange(ref blocked, 1);
                var code = await stopped.Task.WaitAsync(TimeSpan.FromSeconds(3));
                if (code != (unreadable ? "launcher.installation.guard_failed" : null))
                    throw new Exception("installation_watch_result_incorrect");
                checks++;
                await RejectStart(watched);
            }
            finally { await ((IAsyncDisposable)watched).DisposeAsync(); }
        }
        var alreadyBlocked = NewRuntime(() => true);
        try { await RejectStart(alreadyBlocked); }
        finally { await ((IAsyncDisposable)alreadyBlocked).DisposeAsync(); }
        return checks;
    }
}
