using System.Buffers.Binary;
using System.ComponentModel;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Security.Principal;
using System.Text;
using Microsoft.Win32.SafeHandles;

namespace Netgrid.Updater;

// A retained, non-inheritable Windows handle, never a password or serialized
// credential. Capture only from the already image/PID/start-time-bound parent.
internal sealed class OriginalUserRestart : IDisposable
{
    private readonly SafeAccessTokenHandle _token;
    private readonly UserContext _context;
    private readonly EnvironmentBlock _environment;
    private int _used;
    private OriginalUserRestart(SafeAccessTokenHandle token, UserContext context, EnvironmentBlock environment)
    { _token = token; _context = context; _environment = environment; }

    internal sealed record UserContext(string Sid, int Session, long Logon, int Type, bool Elevated, int Integrity, bool UiAccess, bool AppContainer)
    {
        public void RequireNormalUser(int callerSession)
        {
            if (Session <= 0 || Session != callerSession || Logon == 0 || Type != 1 || Elevated || Integrity != 0x2000 || UiAccess || AppContainer ||
                Sid is "S-1-5-18" or "S-1-5-19" or "S-1-5-20" || string.IsNullOrWhiteSpace(Sid))
                throw new InvalidOperationException("updater_restart_user_context_invalid");
        }
        public void RequireSame(UserContext expected)
        {
            RequireNormalUser(expected.Session);
            if (this != expected) throw new InvalidOperationException("updater_restart_user_context_changed");
        }
    }

    public static OriginalUserRestart Capture(Process parent)
    {
        _ = parent.Handle;
        if (parent.HasExited) throw new InvalidOperationException("updater_restart_parent_exited");
        using var source = OpenToken(parent.SafeHandle, 0x000A); // QUERY | DUPLICATE
        var context = ReadContext(source);
        using var current = Process.GetCurrentProcess();
        context.RequireNormalUser(current.SessionId);
        // ASSIGN_PRIMARY | DUPLICATE | QUERY | ADJUST_DEFAULT | ADJUST_SESSIONID.
        // Windows 11 cross-account CreateProcessWithTokenW needs both adjustment
        // handle rights; omitting either fails with ERROR_ACCESS_DENIED. No token
        // privileges are enabled and the original context is rechecked below and
        // on the suspended child. Never request ALL_ACCESS or retry another mask.
        if (!DuplicateTokenEx(source, 0x018B, IntPtr.Zero, 2, 1, out var duplicate)) throw LastError("duplicate_token");
        try
        {
            ReadContext(duplicate).RequireSame(context);
            if (parent.HasExited) throw new InvalidOperationException("updater_restart_parent_exited");
            if (!CreateEnvironmentBlock(out var block, duplicate, false)) throw LastError("user_environment");
            if (block == IntPtr.Zero || block == new IntPtr(-1)) throw new InvalidOperationException("updater_restart_environment_missing");
            return new(duplicate, context, new EnvironmentBlock(block));
        }
        catch { duplicate.Dispose(); throw; }
    }

    // Checked before acquiring the preparation lease or stopping any runtime.
    // No privilege adjustment, password prompt, or alternate launch fallback.
    public static void RequireLaunchPrivilege()
    {
        using var current = Process.GetCurrentProcess();
        using var token = OpenToken(current.SafeHandle, 0x0008);
        if (!LookupPrivilegeValue(null, "SeImpersonatePrivilege", out var luid)) throw LastError("privilege_lookup");
        var required = new PrivilegeSet { Count = 1, Control = 1, Luid = luid, Attributes = 2 };
        if (!PrivilegeCheck(token, ref required, out var granted)) throw LastError("privilege_check");
        if (!granted) throw new InvalidOperationException("updater_restart_privilege_missing");
    }

    public void StartLauncher(string programRoot)
    {
        Netgrid.Windows.InstallationGate.KeyFor(programRoot);
        using var child = StartExecutable(Path.Combine(programRoot, "NETGRID.exe"));
    }

    internal StartedChild StartExecutable(string executable)
    {
        if (_token.IsClosed || _token.IsInvalid || _environment.IsClosed || _environment.IsInvalid || Interlocked.Exchange(ref _used, 1) != 0)
            throw new InvalidOperationException("updater_restart_context_consumed");
        if (!Path.IsPathFullyQualified(executable) || executable.Contains('"') || !File.Exists(executable))
            throw new InvalidOperationException("updater_restart_image_invalid");
        using var current = Process.GetCurrentProcess();
        _context.RequireNormalUser(current.SessionId);
        ReadContext(_token).RequireSame(_context);
        var startup = new StartupInfo { Size = Marshal.SizeOf<StartupInfo>() };
        // Explicit application path, explicit user environment, no inherited
        // handles. Suspended creation permits token verification before code runs.
        if (!CreateProcessWithTokenW(_token, 1, executable, new StringBuilder("\"" + executable + "\""),
            0x08000404, _environment, Path.GetDirectoryName(executable)!, ref startup, out var information))
            throw LastError("create_user_process"); // NO_WINDOW | UNICODE_ENVIRONMENT | SUSPENDED
        var child = new StartedChild(information.Process, information.Thread);
        try
        {
            using var token = OpenToken(child.ProcessHandle, 0x0008);
            ReadContext(token).RequireSame(_context);
            var suspended = ResumeThread(child.ThreadHandle);
            if (suspended == uint.MaxValue) throw LastError("resume_user_process");
            if (suspended != 1) throw new InvalidOperationException("updater_restart_suspend_state_invalid");
            child.Resumed = true;
            return child;
        }
        catch (Exception operation)
        {
            try { child.AbortUnstarted(); }
            catch (Exception cleanup) { throw new AggregateException("updater_restart_abort_failed", operation, cleanup); }
            finally { child.Dispose(); }
            throw;
        }
    }

    internal static UserContext Inspect(Process process)
    {
        using var token = OpenToken(process.SafeHandle, 0x0008);
        return ReadContext(token);
    }

    private static UserContext ReadContext(SafeAccessTokenHandle token)
    {
        using var identity = new WindowsIdentity(token.DangerousGetHandle());
        var sid = identity.User?.Value ?? throw new InvalidOperationException("updater_restart_user_missing");
        using var integrity = Information(token, 25);
        var integritySid = new SecurityIdentifier(Marshal.ReadIntPtr(integrity.DangerousGetHandle()));
        if (!integritySid.Value.StartsWith("S-1-16-", StringComparison.Ordinal)) throw new InvalidOperationException("updater_restart_integrity_invalid");
        var bytes = new byte[integritySid.BinaryLength];
        integritySid.GetBinaryForm(bytes, 0);
        using var statistics = Information(token, 10);
        if (statistics.Length != Marshal.SizeOf<TokenStatistics>()) throw new InvalidOperationException("updater_restart_token_statistics_invalid");
        var logon = Marshal.PtrToStructure<TokenStatistics>(statistics.DangerousGetHandle()).AuthenticationId;
        return new(sid, ReadInteger(token, 12), ((long)logon.High << 32) | logon.Low, ReadInteger(token, 8),
            ReadInteger(token, 20) != 0, BinaryPrimitives.ReadInt32LittleEndian(bytes.AsSpan(bytes.Length - 4)),
            ReadInteger(token, 26) != 0, ReadInteger(token, 29) != 0);
    }

    private static SafeAccessTokenHandle OpenToken(SafeProcessHandle process, uint access)
    {
        if (!OpenProcessToken(process, access, out var token)) throw LastError("open_process_token");
        return token;
    }
    private static int ReadInteger(SafeAccessTokenHandle token, int kind)
    {
        // These information classes are fixed DWORDs. TokenSessionId rejects
        // a zero-length size probe with ERROR_BAD_LENGTH on Windows.
        if (!GetTokenInteger(token, kind, out var value, 4, out var returned)) throw LastError("token_integer");
        if (returned != 4) throw new InvalidOperationException("updater_restart_token_integer_invalid");
        return value;
    }
    private static NativeBuffer Information(SafeAccessTokenHandle token, int kind)
    {
        if (GetTokenInformation(token, kind, IntPtr.Zero, 0, out var length) || Marshal.GetLastWin32Error() != 122 || length <= 0 || length > 65536)
            throw LastError("token_information_size");
        var buffer = new NativeBuffer(length);
        if (!GetTokenInformation(token, kind, buffer.DangerousGetHandle(), length, out var returned))
        { var error = LastError("token_information"); buffer.Dispose(); throw error; }
        if (returned != length) { buffer.Dispose(); throw new InvalidOperationException("updater_restart_token_information_changed"); }
        return buffer;
    }
    private static Win32Exception LastError(string operation) => new(Marshal.GetLastWin32Error(), "updater_restart_" + operation);
    public void Dispose() { _environment.Dispose(); _token.Dispose(); }

    internal sealed class StartedChild : IDisposable
    {
        internal SafeProcessHandle ProcessHandle { get; }
        internal SafeWaitHandle ThreadHandle { get; }
        internal bool Resumed;
        internal StartedChild(IntPtr process, IntPtr thread)
        { ProcessHandle = new(process, true); ThreadHandle = new(thread, true); }
        public bool WaitForExit(int milliseconds)
        {
            var result = WaitForSingleObject(ProcessHandle, checked((uint)milliseconds));
            if (result is not (0 or 258)) throw LastError("wait_user_process");
            return result == 0;
        }
        public int ExitCode
        {
            get { if (!GetExitCodeProcess(ProcessHandle, out var code)) throw LastError("user_process_exit"); return unchecked((int)code); }
        }
        internal void AbortUnstarted()
        {
            if (Resumed) throw new InvalidOperationException("updater_restart_already_running");
            if (!TerminateProcess(ProcessHandle, 2)) throw LastError("abort_unstarted_process");
            if (!WaitForExit(5000)) throw new InvalidOperationException("updater_restart_abort_unproven");
        }
        public void Dispose() { ThreadHandle.Dispose(); ProcessHandle.Dispose(); }
    }

    private sealed class NativeBuffer : SafeHandleZeroOrMinusOneIsInvalid
    {
        internal int Length { get; }
        internal NativeBuffer(int length) : base(true) { Length = length; SetHandle(Marshal.AllocHGlobal(length)); }
        protected override bool ReleaseHandle() { Marshal.FreeHGlobal(handle); return true; }
    }
    private sealed class EnvironmentBlock : SafeHandleZeroOrMinusOneIsInvalid
    {
        internal EnvironmentBlock(IntPtr value) : base(true) => SetHandle(value);
        protected override bool ReleaseHandle() => DestroyEnvironmentBlock(handle);
    }
    [StructLayout(LayoutKind.Sequential)] private struct Luid { public uint Low; public int High; }
    [StructLayout(LayoutKind.Sequential)] private struct PrivilegeSet { public uint Count, Control; public Luid Luid; public uint Attributes; }
    [StructLayout(LayoutKind.Sequential)] private struct TokenStatistics
    {
        public Luid TokenId, AuthenticationId;
        public long Expiration;
        public int TokenType, ImpersonationLevel;
        public uint DynamicCharged, DynamicAvailable, GroupCount, PrivilegeCount;
        public Luid ModifiedId;
    }
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)] private struct StartupInfo
    {
        public int Size;
        public string? Reserved, Desktop, Title;
        public uint X, Y, XSize, YSize, XCountChars, YCountChars, FillAttribute, Flags;
        public ushort ShowWindow, ReservedSize;
        public IntPtr ReservedBytes, StdInput, StdOutput, StdError;
    }
    [StructLayout(LayoutKind.Sequential)] private struct ProcessInformation { public IntPtr Process, Thread; public uint ProcessId, ThreadId; }

    [DllImport("advapi32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool OpenProcessToken(SafeProcessHandle process, uint access, out SafeAccessTokenHandle token);
    [DllImport("advapi32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool DuplicateTokenEx(SafeAccessTokenHandle source, uint access, IntPtr attributes, int impersonation, int type, out SafeAccessTokenHandle duplicate);
    [DllImport("advapi32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool GetTokenInformation(SafeAccessTokenHandle token, int kind, IntPtr buffer, int size, out int returned);
    [DllImport("advapi32.dll", EntryPoint = "GetTokenInformation", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool GetTokenInteger(SafeAccessTokenHandle token, int kind, out int value, int size, out int returned);
    [DllImport("advapi32.dll", CharSet = CharSet.Unicode, SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool LookupPrivilegeValue(string? system, string name, out Luid luid);
    [DllImport("advapi32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool PrivilegeCheck(SafeAccessTokenHandle token, ref PrivilegeSet required, [MarshalAs(UnmanagedType.Bool)] out bool result);
    [DllImport("userenv.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CreateEnvironmentBlock(out IntPtr environment, SafeAccessTokenHandle token, [MarshalAs(UnmanagedType.Bool)] bool inherit);
    [DllImport("userenv.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] private static extern bool DestroyEnvironmentBlock(IntPtr environment);
    [DllImport("advapi32.dll", CharSet = CharSet.Unicode, ExactSpelling = true, SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CreateProcessWithTokenW(SafeAccessTokenHandle token, uint logonFlags, string application, StringBuilder commandLine,
        uint creationFlags, EnvironmentBlock environment, string currentDirectory, ref StartupInfo startup, out ProcessInformation information);
    [DllImport("kernel32.dll", SetLastError = true)] private static extern uint ResumeThread(SafeWaitHandle thread);
    [DllImport("kernel32.dll", SetLastError = true)] private static extern uint WaitForSingleObject(SafeProcessHandle process, uint milliseconds);
    [DllImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] private static extern bool GetExitCodeProcess(SafeProcessHandle process, out uint code);
    [DllImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] private static extern bool TerminateProcess(SafeProcessHandle process, uint code);
}
