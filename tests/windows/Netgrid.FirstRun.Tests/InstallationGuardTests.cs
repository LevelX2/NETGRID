using System.Reflection;

internal static class InstallationGuardTests
{
    internal static int Run(Assembly assembly)
    {
        var runtimeType = assembly.GetType("Netgrid.FirstRun.FirstRunRuntime", true)!;
        var checks = 0;
        foreach (var method in new[] { "IsMaintenanceInitialized", "BootstrapMaintenance" })
        foreach (var corrupt in new[] { false, true })
        {
            var reads = 0;
            Func<bool> gate = () => { reads++; if (corrupt) throw new IOException("fixture-unreadable"); return true; };
            // An impossible executable path is intentional: the guard must
            // reject before filesystem/CLI/credential access, not on its result.
            var runtime = Activator.CreateInstance(runtimeType, BindingFlags.Instance | BindingFlags.NonPublic,
                null, [@"C:\NETGRID-inert-first-run-fixture", "fixture-no-runtime.exe", "fixture-no-auth-cli.mjs", new Dictionary<string, string>(), gate], null)!;
            try
            {
                runtimeType.GetMethod(method)!.Invoke(runtime, method == "BootstrapMaintenance"
                    ? ["component-only-example", "component-only-example"] : null);
                throw new Exception("first_run_installation_guard_accepted:" + method);
            }
            catch (TargetInvocationException error)
            {
                var cause = error.InnerException!;
                if (cause.GetType().Name != "FirstRunInstallationException" ||
                    cause.Message != (corrupt ? "first.installation.guard_failed" : "first.installation.busy") || reads != 1)
                    throw new Exception("first_run_installation_guard_wrong_failure:" + method, cause);
                checks++;
            }
        }
        var ensureIdle = runtimeType.GetMethod("EnsureInstallationIdle", BindingFlags.Static | BindingFlags.NonPublic)!;
        ensureIdle.Invoke(null, [new Func<bool>(() => false)]);
        checks++;
        foreach (var method in new[] { "IsMaintenanceInitialized", "BootstrapMaintenance" })
        {
            var reads = 0;
            var root = @"C:\NETGRID-inert-first-run-fixture-" + Guid.NewGuid().ToString("N");
            Func<bool> gate = () =>
            {
                if (++reads == 1) return false;
                var open = assembly.GetType("Netgrid.Windows.InstallationLaunchFence", true)!
                    .GetMethod("Open", BindingFlags.Static | BindingFlags.NonPublic)!;
                if (Task.Run(() =>
                {
                    using var competitor = (Mutex)open.Invoke(null, [root])!;
                    if (!competitor.WaitOne(0)) return false;
                    competitor.ReleaseMutex();
                    return true;
                }).GetAwaiter().GetResult()) throw new Exception("first_run_final_guard_not_under_fence");
                return true;
            };
            var runtime = Activator.CreateInstance(runtimeType, BindingFlags.Instance | BindingFlags.NonPublic,
                null, [root, "fixture-no-runtime.exe", "fixture-no-auth-cli.mjs", new Dictionary<string, string>(), gate], null)!;
            try
            {
                runtimeType.GetMethod(method)!.Invoke(runtime, method == "BootstrapMaintenance"
                    ? ["component-only-example", "component-only-example"] : null);
                throw new Exception("first_run_final_start_guard_missing");
            }
            catch (TargetInvocationException error) when (error.InnerException?.Message == "first.installation.busy" && reads == 2) { checks++; }
        }
        Console.WriteLine($"FIRST_RUN_INSTALLATION_GUARD_TESTS_OK checks={checks} runtimeStarted=false credentialAccess=false");
        return checks;
    }
}
