using Microsoft.Win32;
using Netgrid.Windows;

internal static class MsiOfflineProcessTests
{
    internal static void Run(RegistryKey fixture, Action<bool, string> assert, Action<Action, string> reject)
    {
        var node = (Environment.GetEnvironmentVariable("PATH") ?? "").Split(Path.PathSeparator)
            .Select(path => Path.Combine(path.Trim('"'), "node.exe")).FirstOrDefault(File.Exists)
            ?? throw new Exception("offline_probe_fixture_node_missing");
        var prefix = Path.Combine(Path.GetTempPath(), "NETGRID MSI Probe ä ");
        var root = prefix + Guid.NewGuid().ToString("N");
        var data = Path.Combine(root, "data");
        var oldOverride = Environment.GetEnvironmentVariable("NETGRID_FIXTURE_EXPECTED");
        var oldInherited = Environment.GetEnvironmentVariable("NETGRID_FIXTURE_INHERITED");
        var oldOptions = Environment.GetEnvironmentVariable("NODE_OPTIONS");
        try
        {
            Directory.CreateDirectory(Path.Combine(root, "runtime", "node"));
            Directory.CreateDirectory(Path.Combine(root, "app"));
            Directory.CreateDirectory(Path.Combine(data, "config"));
            File.Copy(node, Path.Combine(root, "runtime", "node", "node.exe"));
            var cli = Path.Combine(root, "app", "storage-admin.mjs");
            var config = Path.Combine(data, "config", "runtime.env");
            File.WriteAllText(config, "NETGRID_FIXTURE_EXPECTED=readonly\n");
            using var product = fixture.CreateSubKey(@"SOFTWARE\LevelX2\NETGRID", writable: true);
            product.SetValue("RuntimeDataRoot", data);
            Environment.SetEnvironmentVariable("NETGRID_FIXTURE_EXPECTED", "inherited-wrong");
            Environment.SetEnvironmentVariable("NETGRID_FIXTURE_INHERITED", "must-not-pass");
            Environment.SetEnvironmentVariable("NODE_OPTIONS", "--require missing-fixture-module");
            File.WriteAllText(cli, "if(process.env.NETGRID_FIXTURE_EXPECTED!=='readonly'||process.env.NETGRID_FIXTURE_INHERITED||process.env.NODE_OPTIONS||process.argv[2]!=='update-readiness')process.exit(7);console.log(JSON.stringify({ok:true,updateAllowed:false,activeMatchCount:2}));");
            assert(MsiOfflineReadiness.Read(fixture, root) == 2, "actual_offline_probe_argv_unicode_paths_and_environment_isolation");
            assert(File.ReadAllText(config) == "NETGRID_FIXTURE_EXPECTED=readonly\n", "offline_probe_preserves_configuration");
            assert(Directory.GetFiles(data, "*", SearchOption.AllDirectories).SequenceEqual(new[] { config }), "offline_probe_does_not_create_credentials");
            File.WriteAllText(cli, "console.log('{}');");
            reject(() => MsiOfflineReadiness.Read(fixture, root), "installation_gate_readiness_invalid");
            File.WriteAllText(cli, "console.log(JSON.stringify({ok:true,updateAllowed:true,activeMatchCount:0}));process.exitCode=7;");
            reject(() => MsiOfflineReadiness.Read(fixture, root), "installation_gate_readiness_failed");
        }
        finally
        {
            Environment.SetEnvironmentVariable("NETGRID_FIXTURE_EXPECTED", oldOverride);
            Environment.SetEnvironmentVariable("NETGRID_FIXTURE_INHERITED", oldInherited);
            Environment.SetEnvironmentVariable("NODE_OPTIONS", oldOptions);
            if (!root.StartsWith(prefix, StringComparison.Ordinal) || !Guid.TryParseExact(root[prefix.Length..], "N", out _))
                throw new Exception("offline_probe_fixture_cleanup_scope_invalid");
            if (Directory.Exists(root)) Directory.Delete(root, recursive: true);
        }
    }
}
