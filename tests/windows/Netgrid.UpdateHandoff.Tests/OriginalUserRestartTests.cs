using System.ComponentModel;
using System.Diagnostics;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using Microsoft.Win32;
using Microsoft.Win32.SafeHandles;
using Netgrid.Updater;
using Netgrid.Windows;

internal static class OriginalUserRestartTests
{
    private static int checks;
    public static async Task RunAsync()
    {
        foreach (var (name, size) in new[] { ("StartupInfo", 104), ("ProcessInformation", 24), ("TokenStatistics", 56), ("PrivilegeSet", 20) })
            Assert(Marshal.SizeOf(typeof(OriginalUserRestart).GetNestedType(name, BindingFlags.NonPublic)!) == size, "x64_native_layout_" + name);
        var normal = new OriginalUserRestart.UserContext("S-1-5-21-101-202-303-1001", 1, 42, 1, false, 0x2000, false, false);
        normal.RequireNormalUser(1);
        normal.RequireSame(normal with { });
        Assert(true, "normal_user_is_allowed");
        foreach (var invalid in new[] { normal with { Session = 0 }, normal with { Session = 2 }, normal with { Logon = 0 },
            normal with { Type = 2 }, normal with { Elevated = true }, normal with { Integrity = 0x3000 }, normal with { Integrity = 0x1000 },
            normal with { UiAccess = true }, normal with { AppContainer = true }, normal with { Sid = "S-1-5-18" },
            normal with { Sid = "S-1-5-19" }, normal with { Sid = "S-1-5-20" }, normal with { Sid = "" } })
            Reject(() => invalid.RequireNormalUser(1), "updater_restart_user_context_invalid");
        Reject(() => (normal with { Sid = "S-1-5-21-101-202-303-1002" }).RequireSame(normal), "updater_restart_user_context_changed");
        Reject(() => (normal with { Logon = 43 }).RequireSame(normal), "updater_restart_user_context_changed");
        Assert(UpdateSession.DiagnosticCode(new InvalidOperationException("updater_restart_privilege_missing")) == "updater_restart_privilege_missing", "restart_preflight_cause_preserved");
        Assert(UpdateSession.DiagnosticCode(new Win32Exception(5, "updater_restart_open_process_token")) == "updater_restart_open_process_token", "native_restart_operation_preserved");
        foreach (var unsafeMessage in new[] { "updater_restart_user:private-value", "updater_restart_error\nsecret", "C:\\private\\runtime.env" })
            Assert(UpdateSession.DiagnosticCode(new InvalidOperationException(unsafeMessage)) == "InvalidOperationException", "free_text_not_logged");

        using var current = Process.GetCurrentProcess();
        var context = OriginalUserRestart.Inspect(current);
        var canLaunch = true;
        try { OriginalUserRestart.RequireLaunchPrivilege(); }
        catch (InvalidOperationException error) when (error.Message == "updater_restart_privilege_missing") { canLaunch = false; }
        var userIsNormal = context.Session > 0 && !context.Elevated && context.Integrity == 0x2000 && !context.UiAccess && !context.AppContainer;
        var nativeLaunch = "not-exercised";
        if (userIsNormal)
        {
            var sentinel = "NETGRID_RESTART_FIXTURE_" + Guid.NewGuid().ToString("N");
            Environment.SetEnvironmentVariable(sentinel, "must-not-inherit");
            try
            {
                var captured = OriginalUserRestart.Capture(current);
                var token = (SafeAccessTokenHandle)typeof(OriginalUserRestart).GetField("_token", BindingFlags.NonPublic | BindingFlags.Instance)!.GetValue(captured)!;
                var environment = (SafeHandle)typeof(OriginalUserRestart).GetField("_environment", BindingFlags.NonPublic | BindingFlags.Instance)!.GetValue(captured)!;
                try
                {
                    Assert(GetHandleInformation(token, out var flags) && (flags & 1) == 0, "captured_token_not_inheritable");
                    Assert(GrantedAccess(token) == 0x018B, "captured_token_exact_native_launch_access");
                    var block = ReadEnvironment(environment.DangerousGetHandle());
                    Assert(!block.ContainsKey(sentinel), "updater_process_environment_not_inherited");
                    Assert(block.TryGetValue("USERPROFILE", out var profile) && Path.GetFullPath(profile).Equals(
                        Path.GetFullPath(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile)), StringComparison.OrdinalIgnoreCase), "original_profile_environment");
                }
                finally { captured.Dispose(); }
                Assert(token.IsClosed && environment.IsClosed, "ephemeral_context_handles_closed");
                Reject(() => captured.StartExecutable(Environment.ProcessPath!), "updater_restart_context_consumed");
            }
            finally { Environment.SetEnvironmentVariable(sentinel, null); }

            var start = new ProcessStartInfo(Environment.ProcessPath!) { UseShellExecute = false, CreateNoWindow = true, RedirectStandardInput = true, RedirectStandardOutput = true };
            start.ArgumentList.Add("--restart-token-child");
            using var parent = Process.Start(start)!;
            _ = parent.Handle;
            try
            {
                Assert(await parent.StandardOutput.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(10)) == "READY", "original_parent_fixture_ready");
                using var captured = OriginalUserRestart.Capture(parent);
                await parent.StandardInput.WriteLineAsync("EXIT");
                await parent.StandardInput.FlushAsync();
                await parent.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(10));
                Reject(() => OriginalUserRestart.Capture(parent), "updater_restart_parent_exited");
                try
                {
                    // Inert Windows CLI with no arguments, never NETGRID/MSI.
                    using var launched = captured.StartExecutable(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "where.exe"));
                    Assert(launched.Resumed && launched.WaitForExit(10000), "same_user_native_child_resumed_and_exited");
                    nativeLaunch = "same-user-only";
                }
                catch (Win32Exception error) when (!canLaunch && error.NativeErrorCode == 1314)
                {
                    Assert(true, "native_create_without_privilege_fails_closed");
                    nativeLaunch = "blocked-by-missing-privilege";
                }
                Reject(() => captured.StartExecutable(Environment.ProcessPath!), "updater_restart_context_consumed");
            }
            finally { if (!parent.HasExited) { parent.Kill(); await parent.WaitForExitAsync(); } }
        }
        else Reject(() => OriginalUserRestart.Capture(current), "updater_restart_user_context_invalid");

        if (!canLaunch)
        {
            var path = @"Software\NETGRID-Restart-Preflight-Tests\" + Guid.NewGuid().ToString("N");
            try
            {
                using var fixture = Registry.CurrentUser.CreateSubKey(path, writable: true);
                var root = Path.Combine(Path.GetTempPath(), "NETGRID-restart-" + Guid.NewGuid().ToString("N"));
                var request = new UpdateRequest(current.Id, current.StartTime.ToUniversalTime().Ticks, Path.Combine(root, "setup.exe"), new string('a', 64), root,
                    Path.Combine(root, "runtime.env"), Guid.NewGuid().ToString("N"), Guid.NewGuid().ToString("N"), true);
                try { await UpdateSession.AcceptAsync(fixture, request, Environment.ProcessPath!); throw new Exception("restart_preflight_missing"); }
                catch (InvalidOperationException error) when (error.Message == "updater_restart_privilege_missing") { checks++; }
                Assert(InstallationGate.Read(fixture, InstallationGate.KeyFor(root)) is null, "missing_privilege_prevents_lease_acquisition");
            }
            finally { Registry.CurrentUser.DeleteSubKeyTree(path, throwOnMissingSubKey: false); }
        }
        CheckUnstartedCleanup();
        Console.WriteLine($"ORIGINAL_USER_RESTART_TESTS_OK checks={checks} normalCapture={userIsNormal} nativeLaunch={nativeLaunch} elevation=false installationStarted=false");
    }

    private static void CheckUnstartedCleanup()
    {
        var executable = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "where.exe");
        var startup = new StartupInfo { Size = Marshal.SizeOf<StartupInfo>() };
        if (!CreateProcessW(executable, new StringBuilder("\"" + executable + "\""), IntPtr.Zero, IntPtr.Zero, false,
            0x08000004, IntPtr.Zero, Path.GetDirectoryName(executable)!, ref startup, out var information)) throw new Win32Exception(Marshal.GetLastWin32Error());
        using var child = new OriginalUserRestart.StartedChild(information.Process, information.Thread);
        try
        {
            Assert(!child.WaitForExit(0) && child.ExitCode == 259, "inert_fixture_starts_suspended");
            child.Resumed = true;
            Reject(() => child.AbortUnstarted(), "updater_restart_already_running");
            child.Resumed = false;
            child.AbortUnstarted();
            Assert(child.WaitForExit(0) && child.ExitCode == 2, "unstarted_cleanup_proves_owned_child_exit");
        }
        finally { if (!child.WaitForExit(0)) child.AbortUnstarted(); }
    }
    private static Dictionary<string, string> ReadEnvironment(IntPtr block)
    {
        var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var offset = 0;
        while (offset < 1024 * 1024)
        {
            var line = Marshal.PtrToStringUni(block + offset)!;
            if (line.Length == 0) return result;
            offset += (line.Length + 1) * 2;
            var separator = line.IndexOf('=');
            if (separator > 0) result.Add(line[..separator], line[(separator + 1)..]);
        }
        throw new Exception("restart_environment_fixture_unbounded");
    }
    private static void Assert(bool value, string name) { if (!value) throw new Exception("restart_test_failed:" + name); checks++; }
    private static int GrantedAccess(SafeAccessTokenHandle token)
    {
        // Read-only test inspection of PUBLIC_OBJECT_BASIC_INFORMATION.
        // No token/ACL/privilege mutation and no native-query dependency in product.
        var buffer = Marshal.AllocHGlobal(56);
        try
        {
            if (NtQueryObject(token, 0, buffer, 56, out var returned) != 0 || returned != 56)
                throw new Exception("restart_token_access_query_failed");
            return Marshal.ReadInt32(buffer, 4);
        }
        finally { Marshal.FreeHGlobal(buffer); }
    }
    private static void Reject(Action action, string code)
    {
        try { action(); }
        catch (InvalidOperationException error) when (error.Message == code) { checks++; return; }
        throw new Exception("restart_rejection_missing:" + code);
    }
    [DllImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] private static extern bool GetHandleInformation(SafeHandle handle, out uint flags);
    [DllImport("ntdll.dll")] private static extern int NtQueryObject(SafeHandle handle, int kind, IntPtr buffer, int length, out int returned);
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)] private struct StartupInfo
    {
        public int Size; public string? Reserved, Desktop, Title;
        public uint X, Y, XSize, YSize, XCount, YCount, Fill, Flags;
        public ushort Show, ReservedSize; public IntPtr ReservedBytes, Input, Output, Error;
    }
    [StructLayout(LayoutKind.Sequential)] private struct ProcessInformation { public IntPtr Process, Thread; public uint ProcessId, ThreadId; }
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, ExactSpelling = true, SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CreateProcessW(string application, StringBuilder commandLine, IntPtr processAttributes, IntPtr threadAttributes,
        [MarshalAs(UnmanagedType.Bool)] bool inherit, uint flags, IntPtr environment, string directory, ref StartupInfo startup, out ProcessInformation information);
}
