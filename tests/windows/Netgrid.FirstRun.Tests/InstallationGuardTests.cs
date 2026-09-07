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
                null, ["fixture-no-runtime.exe", "fixture-no-auth-cli.mjs", new Dictionary<string, string>(), gate], null)!;
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
        Console.WriteLine($"FIRST_RUN_INSTALLATION_GUARD_TESTS_OK checks={checks} runtimeStarted=false credentialAccess=false");
        return checks;
    }
}
