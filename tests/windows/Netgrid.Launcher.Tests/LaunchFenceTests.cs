using System.Reflection;

internal static class LaunchFenceTests
{
    internal static async Task<int> Run(Assembly assembly)
    {
        var runtimeType = assembly.GetType("Netgrid.Launcher.LauncherRuntime", true)!;
        var environmentType = assembly.GetType("Netgrid.Launcher.RuntimeEnvironment", true)!;
        var fenceType = assembly.GetType("Netgrid.Windows.InstallationLaunchFence", true)!;
        var open = fenceType.GetMethod("Open", BindingFlags.Static | BindingFlags.NonPublic)!;
        var checks = 0;
        foreach (var corrupt in new[] { false, true })
        {
            var prefix = Path.Combine(Path.GetTempPath(), "NETGRID-launch-fence-runtime-");
            var root = prefix + Guid.NewGuid().ToString("N");
            var reads = 0;
            Func<bool> gate = () =>
            {
                reads++;
                // The real final guard must execute while holding the shared
                // mutex, not merely check once earlier in StartAsync.
                var entered = Task.Run(() =>
                {
                    using var competitor = (Mutex)open.Invoke(null, [root])!;
                    if (!competitor.WaitOne(0)) return false;
                    competitor.ReleaseMutex();
                    return true;
                }).GetAwaiter().GetResult();
                if (entered) throw new Exception("launcher_final_guard_not_under_fence");
                if (corrupt) throw new IOException("fixture-unreadable-lease");
                return true;
            };
            var environment = Activator.CreateInstance(environmentType, BindingFlags.Instance | BindingFlags.NonPublic,
                null, [new Dictionary<string, string>
                {
                    ["NETGRID_DATA_ROOT"] = root,
                    ["NETGRID_SERVER_BASE_URL"] = "http://127.0.0.1:1",
                    ["NETGRID_WEB_BASE_URL"] = "http://127.0.0.1:2",
                }], null)!;
            var runtime = Activator.CreateInstance(runtimeType, BindingFlags.Instance | BindingFlags.NonPublic,
                null, [root, environment, gate], null)!;
            try
            {
                try
                {
                    // Shared spawn owner used by initial start and recovery.
                    await (Task)runtimeType.GetMethod("StartPairAndWaitAsync", BindingFlags.Instance | BindingFlags.NonPublic)!.Invoke(runtime, null)!;
                    throw new Exception("launcher_final_guard_allowed_start");
                }
                catch (InvalidOperationException error) when (!corrupt && error.Message == "launcher_installation_stopping") { checks++; }
                catch (IOException error) when (corrupt && error.Message == "fixture-unreadable-lease") { checks++; }
                if (reads != 1 || runtimeType.GetField("_server", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(runtime) != null ||
                    runtimeType.GetField("_web", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(runtime) != null)
                    throw new Exception("launcher_final_guard_child_published");
                checks++;
            }
            finally
            {
                await ((IAsyncDisposable)runtime).DisposeAsync();
                if (!root.StartsWith(prefix, StringComparison.Ordinal) || !Guid.TryParseExact(root[prefix.Length..], "N", out _))
                    throw new Exception("launcher_fence_fixture_cleanup_scope_invalid");
                if (Directory.Exists(root)) Directory.Delete(root, recursive: true);
            }
        }
        return checks;
    }
}
