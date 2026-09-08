using System.Buffers.Binary;
using System.ComponentModel;
using System.Diagnostics;
using System.IO.Pipes;
using System.Runtime.InteropServices;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Text.Json;
using Microsoft.Win32.SafeHandles;
using Netgrid.Windows;

namespace Netgrid.SetupHost;

internal sealed record InstallationResult(int Code, string LogPath);

// Only non-secret, typed settings cross this boundary. No MSI path, property
// string, log destination, command, credential or arbitrary executable is accepted.
internal sealed record InstallationRequest(string Session, int ParentId, long ParentStart,
    string Language, SetupSettings Settings)
{
    public string PipeName() => "NETGRID-install-" + Session;
    public string DirectoryPath() => Path.Combine(InstallationWorker.TemporaryRoot, PipeName());
    public string LogPath() => Path.Combine(DirectoryPath(), "install.log");

    public void Validate()
    {
        if (!Guid.TryParseExact(Session, "N", out _) || ParentId <= 0 || ParentStart <= 0 ||
            Language is not ("de" or "en" or "fr") || Settings is null)
            throw new InvalidDataException("install_request_invalid");
        Settings.Validate();
    }

    public static InstallationRequest Decode(string encoded)
    {
        if (encoded.Length is 0 or > 24000) throw new InvalidDataException("install_request_size_invalid");
        var request = JsonSerializer.Deserialize<InstallationRequest>(Convert.FromBase64String(encoded),
            new JsonSerializerOptions { UnmappedMemberHandling = System.Text.Json.Serialization.JsonUnmappedMemberHandling.Disallow,
                RespectRequiredConstructorParameters = true })
            ?? throw new InvalidDataException("install_request_missing");
        request.Validate();
        return request;
    }

    public string Encode() => Convert.ToBase64String(JsonSerializer.SerializeToUtf8Bytes(this));
}

// Fixed-size numeric protocol: no unbounded strings, paths or MSI ActionData.
internal sealed record InstallationFrame(int Kind, long Position = 0, long Total = 0, int Flags = 0, int Code = 0)
{
    public const int Size = 32;
    private const int Magic = 0x4E475031; // NGP1
    public byte[] Encode()
    {
        var bytes = new byte[Size];
        BinaryPrimitives.WriteInt32LittleEndian(bytes, Magic);
        BinaryPrimitives.WriteInt32LittleEndian(bytes.AsSpan(4), Kind);
        BinaryPrimitives.WriteInt64LittleEndian(bytes.AsSpan(8), Position);
        BinaryPrimitives.WriteInt64LittleEndian(bytes.AsSpan(16), Total);
        BinaryPrimitives.WriteInt32LittleEndian(bytes.AsSpan(24), Flags);
        BinaryPrimitives.WriteInt32LittleEndian(bytes.AsSpan(28), Code);
        return bytes;
    }

    public static InstallationFrame Decode(byte[] bytes)
    {
        if (bytes.Length != Size || BinaryPrimitives.ReadInt32LittleEndian(bytes) != Magic)
            throw new InvalidDataException("install_frame_invalid");
        var frame = new InstallationFrame(BinaryPrimitives.ReadInt32LittleEndian(bytes.AsSpan(4)),
            BinaryPrimitives.ReadInt64LittleEndian(bytes.AsSpan(8)), BinaryPrimitives.ReadInt64LittleEndian(bytes.AsSpan(16)),
            BinaryPrimitives.ReadInt32LittleEndian(bytes.AsSpan(24)), BinaryPrimitives.ReadInt32LittleEndian(bytes.AsSpan(28)));
        var valid = frame.Kind switch
        {
            1 => frame.Position == 0 && frame.Total == 0 && frame.Flags == 0 && frame.Code == 0, // Ready
            2 => frame.Total >= 0 && frame.Flags is >= 0 and <= 3 && frame.Code == 0, // Progress
            3 => frame.Position == 0 && frame.Total == 0 && frame.Flags == 0 && frame.Code >= 0, // MSI result
            4 => frame.Position == 0 && frame.Total == 0 && frame.Flags is >= 1 and <= 5, // Worker failure
            _ => false,
        };
        return valid ? frame : throw new InvalidDataException("install_frame_fields_invalid");
    }
}

internal static class InstallationWorker
{
    public static string TemporaryRoot => Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows), "Temp");
    public static async Task<InstallationResult> Start(SetupSettings settings, IProgress<InstallationPhase> phase,
        IProgress<MsiProgressSnapshot> progress)
    {
        using var parent = Process.GetCurrentProcess();
        var request = new InstallationRequest(Guid.NewGuid().ToString("N"), parent.Id,
            parent.StartTime.ToUniversalTime().Ticks, UiText.Language, settings);
        request.Validate();
        using var pipe = CreateServer(request.PipeName());
        var executable = Environment.ProcessPath ?? throw new SetupException("setup_path_missing");
        // Hold the exact source executable read-only through elevation and MSI
        // caching. A path alone must not permit replacement after validation.
        using var sourceLock = new FileStream(executable, FileMode.Open, FileAccess.Read, FileShare.Read);
        var start = new ProcessStartInfo(executable)
        { UseShellExecute = true, Verb = "runas", WindowStyle = ProcessWindowStyle.Hidden };
        start.ArgumentList.Add("--install-worker");
        start.ArgumentList.Add(request.Encode());
        phase.Report(InstallationPhase.Elevation);
        using var worker = Process.Start(start) ?? throw new SetupException("msi_start_failed");
        var exited = worker.WaitForExitAsync();
        try
        {
            using var connectionDeadline = new CancellationTokenSource(TimeSpan.FromSeconds(30));
            var connected = pipe.WaitForConnectionAsync(connectionDeadline.Token);
            if (await Task.WhenAny(connected, exited) != connected)
                throw new InvalidDataException("install_worker_exited_before_connection");
            await connected;
            RequirePeer(pipe, worker.Id, serverSide: true);
            var ready = false;
            while (true)
            {
                var bytes = new byte[InstallationFrame.Size];
                await pipe.ReadExactlyAsync(bytes);
                var frame = InstallationFrame.Decode(bytes);
                if (!ready && frame.Kind != 1) throw new InvalidDataException("install_worker_ready_missing");
                switch (frame.Kind)
                {
                    case 1:
                        if (ready) throw new InvalidDataException("install_worker_duplicate_ready");
                        ready = true;
                        phase.Report(InstallationPhase.Preparing);
                        break;
                    case 2:
                        progress.Report(new(frame.Position, frame.Total, (frame.Flags & 1) != 0, (frame.Flags & 2) != 0));
                        break;
                    case 3:
                        await exited;
                        if (worker.ExitCode != frame.Code) throw new InvalidDataException("install_worker_result_mismatch");
                        return new(frame.Code, request.LogPath());
                    case 4:
                        await exited;
                        throw new SetupException("install_worker_failed", frame.Flags, frame.Code, request.LogPath());
                }
            }
        }
        catch (Exception exception) when (exception is not SetupException)
        {
            // Closing our channel makes the callback cancel MSI. Do not kill an
            // installer or return to editable options while it is rolling back.
            pipe.Dispose();
            await exited;
            throw new SetupException("install_channel_failed", request.LogPath());
        }
    }

    public static NamedPipeServerStream CreateServer(string name)
    {
        using var identity = WindowsIdentity.GetCurrent();
        var security = new PipeSecurity();
        security.SetAccessRuleProtection(true, false);
        security.AddAccessRule(new PipeAccessRule(new SecurityIdentifier(WellKnownSidType.NetworkSid, null),
            PipeAccessRights.FullControl, AccessControlType.Deny));
        security.AddAccessRule(new PipeAccessRule(identity.User ?? throw new InvalidDataException("install_user_missing"),
            PipeAccessRights.FullControl, AccessControlType.Allow));
        // Allows an explicit UAC approval by a different Windows administrator.
        security.AddAccessRule(new PipeAccessRule(new SecurityIdentifier(WellKnownSidType.BuiltinAdministratorsSid, null),
            PipeAccessRights.ReadWrite, AccessControlType.Allow));
        return NamedPipeServerStreamAcl.Create(name, PipeDirection.In, 1, PipeTransmissionMode.Byte,
            PipeOptions.Asynchronous | PipeOptions.FirstPipeInstance, 4096, 4096, security);
    }

    public static void RequirePeer(PipeStream pipe, int expected, bool serverSide)
    {
        uint actual;
        var success = serverSide
            ? GetNamedPipeClientProcessId(pipe.SafePipeHandle, out actual)
            : GetNamedPipeServerProcessId(pipe.SafePipeHandle, out actual);
        if (!success) throw new Win32Exception(Marshal.GetLastWin32Error());
        if (actual != expected) throw new InvalidDataException("install_pipe_peer_mismatch");
    }

    public static async Task<int> Run(InstallationRequest request)
    {
        using var identity = WindowsIdentity.GetCurrent();
        if (!new WindowsPrincipal(identity).IsInRole(WindowsBuiltInRole.Administrator))
            throw new InvalidDataException("install_worker_not_elevated");
        UiText.Use(request.Language);
        request.Validate();
        using var sourceLock = new FileStream(Environment.ProcessPath ?? throw new SetupException("setup_path_missing"),
            FileMode.Open, FileAccess.Read, FileShare.Read);
        using var parent = Process.GetProcessById(request.ParentId);
        // Keep a handle, not only a reusable PID, until this worker exits.
        _ = parent.Handle;
        if (parent.StartTime.ToUniversalTime().Ticks != request.ParentStart ||
            !string.Equals(parent.MainModule?.FileName, Environment.ProcessPath, StringComparison.OrdinalIgnoreCase))
            throw new InvalidDataException("install_parent_identity_mismatch");
        using var pipe = new NamedPipeClientStream(".", request.PipeName(), PipeDirection.Out,
            PipeOptions.Asynchronous, TokenImpersonationLevel.Anonymous);
        await pipe.ConnectAsync(30_000);
        RequirePeer(pipe, parent.Id, serverSide: false);
        await Write(pipe, new(1));
        var stage = 1;
        string? msi = null;
        try
        {
            InstallationSpace.Check(request.Settings.ProgramRoot, request.Settings.DataRoot, TemporaryRoot);
            stage = 2;
            CreateProtectedDirectory(request.DirectoryPath());
            msi = Path.Combine(request.DirectoryPath(), MsiPayload.FileName);
            MsiPayload.ExtractVerified(msi);
            stage = 3;
            MsiProgressSnapshot? displayed = null;
            var reader = new MsiProgressReader(snapshot =>
            {
                // Coalesce identical visible values, not elapsed-time estimates.
                // The counter still consumes every actual MSI increment.
                if (displayed is not null && displayed.Percent == snapshot.Percent &&
                    displayed.Preparing == snapshot.Preparing && displayed.Backward == snapshot.Backward) return;
                Write(pipe, new(2, snapshot.Position, snapshot.Total,
                    (snapshot.Preparing ? 1 : 0) | (snapshot.Backward ? 2 : 0))).GetAwaiter().GetResult();
                displayed = snapshot;
            });
            var result = MsiNative.Install(msi, Installer.Properties(request.Settings), request.LogPath(), reader);
            stage = 4;
            if (reader.Failure is not null) throw new InvalidDataException("install_progress_callback_failed", reader.Failure);
            stage = 5;
            File.Delete(msi);
            msi = null;
            await Write(pipe, new(3, Code: checked((int)result)));
            return checked((int)result);
        }
        catch (Exception exception)
        {
            // Only structured numeric diagnosis leaves the elevated process.
            // An unreachable UI is a failed operation, never a success fallback.
            await Write(pipe, new(4, Flags: stage, Code: exception is Win32Exception native ? native.NativeErrorCode : exception.HResult));
            return 3;
        }
        finally
        {
            // Exact file in our atomically created protected directory, no
            // recursive cleanup and no deletion of logs or user installation data.
            if (msi is not null && File.Exists(msi)) File.Delete(msi);
        }
    }

    private static async Task Write(PipeStream pipe, InstallationFrame frame)
    {
        using var deadline = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        await pipe.WriteAsync(frame.Encode(), deadline.Token);
    }

    internal static void CreateProtectedDirectory(string path)
    {
        var security = new DirectorySecurity();
        var administrators = new SecurityIdentifier(WellKnownSidType.BuiltinAdministratorsSid, null);
        security.SetOwner(administrators);
        security.SetAccessRuleProtection(true, false);
        foreach (var sid in new[] { administrators, new SecurityIdentifier(WellKnownSidType.LocalSystemSid, null) })
            security.AddAccessRule(new FileSystemAccessRule(sid, FileSystemRights.FullControl,
                InheritanceFlags.ContainerInherit | InheritanceFlags.ObjectInherit, PropagationFlags.None, AccessControlType.Allow));
        var bytes = security.GetSecurityDescriptorBinaryForm();
        var pinned = GCHandle.Alloc(bytes, GCHandleType.Pinned);
        try
        {
            var attributes = new SecurityAttributes
            { Length = Marshal.SizeOf<SecurityAttributes>(), Descriptor = pinned.AddrOfPinnedObject(), Inherit = 0 };
            // Unlike CreateDirectory's managed convenience wrapper, reject an
            // already existing directory. Its contents/ACL must never be trusted.
            if (!CreateDirectoryW(path, ref attributes)) throw new Win32Exception(Marshal.GetLastWin32Error());
        }
        finally { pinned.Free(); }
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct SecurityAttributes { public int Length; public IntPtr Descriptor; public int Inherit; }
    [DllImport("kernel32.dll", ExactSpelling = true, CharSet = CharSet.Unicode, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)] private static extern bool CreateDirectoryW(string path, ref SecurityAttributes attributes);
    [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)] private static extern bool GetNamedPipeClientProcessId(SafePipeHandle pipe, out uint processId);
    [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)] private static extern bool GetNamedPipeServerProcessId(SafePipeHandle pipe, out uint processId);
}

internal static class MsiNative
{
    [UnmanagedFunctionPointer(CallingConvention.Winapi)]
    private delegate int UiHandler(IntPtr context, uint message, uint record);

    public static uint Install(string msi, string properties, string logPath, MsiProgressReader reader)
        => WithProgress(logPath, reader, () => MsiInstallProductW(msi, properties + " REBOOT=ReallySuppress"));

    // The callback/log lifetime can be exercised without running an installation.
    internal static uint WithProgress(string logPath, MsiProgressReader reader, Func<uint> install)
    {
        var previousUi = MsiSetInternalUI(2, IntPtr.Zero); // INSTALLUILEVEL_NONE, worker already elevated
        if (previousUi == 0) throw new InvalidDataException("msi_ui_setup_failed");
        UiHandler handler = reader.Handle;
        var registered = false;
        try
        {
            // /l*v: PROPERTYDUMP shares bit 10 with external-UI PROGRESS;
            // the log contains properties, never numeric progress records.
            Check(MsiEnableLogW(0x1FDF, logPath, 0));
            Check(MsiSetExternalUIRecord(handler, (1u << 8) | (1u << 9) | (1u << 10), IntPtr.Zero, out var previous));
            registered = true;
            if (previous != IntPtr.Zero) throw new InvalidDataException("msi_callback_already_registered");
            return install();
        }
        finally
        {
            if (registered) Check(MsiSetExternalUIRecord(null, 0, IntPtr.Zero, out _));
            Check(MsiEnableLogW(0, null, 0));
            MsiSetInternalUI(previousUi, IntPtr.Zero);
            GC.KeepAlive(handler);
        }
    }

    private static void Check(uint code) { if (code != 0) throw new Win32Exception(checked((int)code)); }
    [DllImport("msi.dll", ExactSpelling = true)] private static extern uint MsiSetInternalUI(uint level, IntPtr owner);
    [DllImport("msi.dll", ExactSpelling = true)] private static extern uint MsiSetExternalUIRecord(UiHandler? handler, uint filter, IntPtr context, out IntPtr previous);
    [DllImport("msi.dll", ExactSpelling = true, CharSet = CharSet.Unicode)] private static extern uint MsiEnableLogW(uint mode, string? path, uint attributes);
    [DllImport("msi.dll", ExactSpelling = true, CharSet = CharSet.Unicode)] private static extern uint MsiInstallProductW(string path, string properties);
}
