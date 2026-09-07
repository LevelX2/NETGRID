using System.Diagnostics;
using System.Security.AccessControl;
using System.Security.Principal;
using Microsoft.Win32;
using Netgrid.Windows;

internal static class LaunchFenceTests
{
    internal static bool TryChild(string[] args)
    {
        if (args is not ["--launch-fence-child", var root]) return false;
        if (!root.StartsWith(@"C:\NETGRID-launch-fence-test-", StringComparison.Ordinal) ||
            !Guid.TryParseExact(root.Substring(@"C:\NETGRID-launch-fence-test-".Length), "N", out _))
            throw new Exception("launch_fence_child_scope_invalid");
        InstallationLaunchFence.Execute(root, () =>
        {
            Console.WriteLine("HELD");
            if (Console.ReadLine() != "release") throw new Exception("launch_fence_child_protocol_invalid");
        });
        return true;
    }

    internal static void Run(RegistryKey fixture, Action<bool, string> assert, Action<Action, string> reject)
    {
        var root = @"C:\NETGRID-launch-fence-test-" + Guid.NewGuid().ToString("N");
        assert(InstallationLaunchFence.NameFor(root) == InstallationLaunchFence.NameFor(root.ToLowerInvariant() + "\\"), "fence_canonical_root");
        assert(InstallationLaunchFence.NameFor(root) != InstallationLaunchFence.NameFor(root + "-other"), "fence_distinct_root");
        assert(InstallationLaunchFence.Execute(root, () => 42) == 42, "fence_returns_result");
        reject(() => InstallationLaunchFence.Execute(root, new Action(() => throw new InvalidOperationException("fixture_error"))), "fixture_error");
        assert(InstallationLaunchFence.Execute(root, () => true), "fence_released_on_callback_error");

        using var held = InstallationLaunchFence.Open(root);
        using (var readable = MutexAcl.OpenExisting(InstallationLaunchFence.NameFor(root), MutexRights.ReadPermissions))
        {
            var acl = readable.GetAccessControl();
            assert(acl.AreAccessRulesProtected, "fence_dacl_protected");
            var rules = acl.GetAccessRules(true, false, typeof(SecurityIdentifier)).Cast<MutexAccessRule>().ToArray();
            assert(rules.Single(x => x.IdentityReference.Value == "S-1-5-11").MutexRights ==
                (MutexRights.Synchronize | MutexRights.Modify), "fence_authenticated_users_only_coordinate");
            assert(rules.Single(x => x.IdentityReference.Value == "S-1-5-2").AccessControlType == AccessControlType.Deny,
                "fence_network_logon_denied");
            assert(rules.Single(x => x.IdentityReference.Value == "S-1-5-18").MutexRights == MutexRights.FullControl,
                "fence_system_access");
            assert(rules.Single(x => x.IdentityReference.Value == "S-1-5-32-544").MutexRights == MutexRights.FullControl,
                "fence_admin_access");
        }

        // Retain a handle so Windows preserves the abandoned object for the next waiter.
        var abandoned = new Thread(() => { using var owner = InstallationLaunchFence.Open(root); owner.WaitOne(); });
        abandoned.Start();
        assert(abandoned.Join(5000), "fence_abandon_owner_exited");
        var called = false;
        reject(() => InstallationLaunchFence.Execute(root, () => { called = true; }), "installation_gate_launch_fence_abandoned");
        assert(!called, "abandoned_fence_does_not_run_callback");
        assert(InstallationLaunchFence.Execute(root, () => true), "abandoned_ownership_released");

        // A separate process holds the same OS mutex, not an in-memory stand-in.
        var executable = Environment.ProcessPath!;
        if (Path.GetFileNameWithoutExtension(executable) != "Netgrid.InstallerLifecycle.Tests")
            throw new Exception("launch_fence_fixture_host_invalid");
        var start = new ProcessStartInfo(executable)
        {
            UseShellExecute = false, CreateNoWindow = true, RedirectStandardInput = true, RedirectStandardOutput = true
        };
        start.ArgumentList.Add("--launch-fence-child"); start.ArgumentList.Add(root);
        using var child = Process.Start(start)!;
        try
        {
            assert(child.StandardOutput.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(10)).GetAwaiter().GetResult() == "HELD", "cross_process_fence_held");
            reject(() => InstallationLaunchFence.Execute(root, () => { called = true; return true; }, 30), "installation_gate_launch_fence_timeout");
            assert(!called, "timeout_does_not_run_callback");
            assert(InstallationLaunchFence.Execute(root + "-other", () => true), "unrelated_installation_not_blocked");
        }
        finally
        {
            child.StandardInput.WriteLine("release"); child.StandardInput.Close();
            if (!child.WaitForExit(5000)) throw new Exception("launch_fence_fixture_exit_timeout");
        }
        assert(child.ExitCode == 0, "cross_process_owner_clean_exit");

        // Installer queues behind final gate read + spawn. Its absence check can
        // only run after the simulated child has been published by the launcher.
        using var inside = new ManualResetEventSlim();
        using var release = new ManualResetEventSlim();
        var spawned = false;
        var launcher = Task.Run(() => InstallationLaunchFence.Execute(root, () =>
        {
            if (InstallationGate.Read(fixture, InstallationGate.KeyFor(root))?.Active == true)
                throw new Exception("launch_fence_fixture_unexpected_lease");
            inside.Set();
            if (!release.Wait(5000)) throw new Exception("launch_fence_fixture_release_timeout");
            spawned = true;
        }));
        assert(inside.Wait(5000), "launcher_inside_final_start_section");
        using var installerAttempting = new ManualResetEventSlim();
        var installer = Task.Run(() =>
        {
            installerAttempting.Set();
            return InstallationLaunchFence.Execute(root, () =>
            {
                InstallationLease.BeginMsi(fixture, root, Guid.NewGuid().ToString("N"), Guid.NewGuid().ToString("B").ToUpperInvariant(), "");
                return spawned;
            });
        });
        try
        {
            assert(installerAttempting.Wait(5000), "installer_attempting_while_launcher_holds_fence");
            assert(!installer.Wait(50), "installer_cannot_pass_final_start_section");
        }
        finally { release.Set(); }
        assert(Task.WaitAll([launcher, installer], TimeSpan.FromSeconds(10)), "racing_start_and_lease_completed");
        launcher.GetAwaiter().GetResult();
        assert(installer.GetAwaiter().GetResult(), "installer_sees_published_child_before_absence_check");
        var attempted = false;
        InstallationLaunchFence.Execute(root, () =>
        {
            if (!InstallationGate.BlocksStart(InstallationGate.Read(fixture, InstallationGate.KeyFor(root)), DateTime.UtcNow)) attempted = true;
        });
        assert(!attempted, "published_lease_blocks_next_start_under_fence");
    }
}
