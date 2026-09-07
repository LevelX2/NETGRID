using System.Reflection;

internal static class UpdateCommandTests
{
    public static int Run(Assembly assembly)
    {
        var type = assembly.GetType("Netgrid.SetupHost.UpdateCommand", true)!;
        var parse = type.GetMethod("Parse")!;
        var forward = assembly.GetType("Netgrid.SetupHost.Installer", true)!
            .GetMethod("UpdateLeaseProperty", BindingFlags.Static | BindingFlags.NonPublic)!;
        var checks = 0;
        var lease = Guid.NewGuid().ToString("N");
        const string root = @"C:\NETGRID Component Fixture";
        void Assert(bool value, string name)
        {
            if (!value) throw new Exception("setup_update_command_test_failed:" + name);
            checks++;
        }
        object Parse(params string[] args) => parse.Invoke(null, [args])!;
        void Reject(string[] args)
        {
            try { Parse(args); throw new Exception("invalid_update_command_accepted"); }
            catch (TargetInvocationException error) when (error.InnerException?.GetType().Name == "SetupException") { checks++; }
        }
        foreach (var uninstall in new[] { false, true })
        {
            var command = Parse(uninstall ? "--uninstall-update" : "--install-update", "--program-root", root + "\\", "--update-lease", lease);
            Assert((bool)type.GetProperty("Uninstall")!.GetValue(command)! == uninstall, "action_preserved");
            Assert((string)type.GetProperty("ProgramRoot")!.GetValue(command)! == root, "root_normalized_without_losing_spaces");
            Assert((string)type.GetProperty("Lease")!.GetValue(command)! == lease, "exact_outer_lease_preserved");
            foreach (var result in new[] { 0, 3010, 1605, 1603, 5, -1 })
                Assert((int)type.GetMethod("ExitCode")!.Invoke(command, [result])! == (result is 0 or 3010 ? 0 : result), "owned_msi_result_not_silently_reclassified");
        }
        Assert((string)forward.Invoke(null, [lease])! == "NETGRID_UPDATE_LEASE=\"" + lease + "\"", "msi_property_is_exactly_bound");
        Assert(type.GetProperty("Lease")!.GetValue(Parse("--install-update", "--program-root", root)) is null, "standalone_install_never_infers_an_outer_lease");
        Assert(type.GetProperty("Lease")!.GetValue(Parse("--uninstall-update")) is null, "standalone_remove_never_infers_an_outer_lease");
        Assert((int)type.GetMethod("ExitCode")!.Invoke(Parse("--uninstall-update"), [1605])! == 0, "standalone_remove_is_explicitly_idempotent");
        Assert((int)type.GetMethod("ExitCode")!.Invoke(Parse("--install-update", "--program-root", root), [1605])! == 1605, "standalone_install_does_not_hide_missing_product");
        foreach (var invalidLease in new[] { "", "broken", Guid.Empty.ToString("N"), Guid.NewGuid().ToString("B"), new string('A', 32), lease + " DELETEUSERDATA=1", lease + "\"" })
        {
            Reject(["--install-update", "--program-root", root, "--update-lease", invalidLease]);
            try { forward.Invoke(null, [invalidLease]); throw new Exception("invalid_msi_update_property_accepted"); }
            catch (TargetInvocationException error) when (error.InnerException?.GetType().Name == "SetupException") { checks++; }
        }
        foreach (var args in new[] {
            Array.Empty<string>(), new[] { "--install-update" }, new[] { "--unknown" },
            new[] { "--install-update", "--program-root", root, "--update-lease" },
            new[] { "--uninstall-update", "--update-lease", lease },
            new[] { "--install-update", "--program-root", root, "--update-lease", lease, "extra" },
            new[] { "--install-update", "--program-root", root, "--program-root", lease },
            new[] { "--install-update", "--update-lease", lease, "--program-root", root },
        }) Reject(args);
        foreach (var badRoot in new[] { "", @"C:\", "relative", "C:relative", @"\root-relative", @"\\server\share", "C:\\bad\0path" })
            Reject(["--install-update", "--program-root", badRoot, "--update-lease", lease]);
        return checks;
    }
}
