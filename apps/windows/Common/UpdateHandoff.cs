#nullable enable
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.ComponentModel;
using System.Diagnostics;
using System.IO.Pipes;
using System.Runtime.InteropServices;
using System.Security.AccessControl;
using System.Security.Principal;
using Microsoft.Win32.SafeHandles;

namespace Netgrid.Windows;

// Transport only. The transaction owner may send Proceed only after it has
// verified the stopped runtime and owns exclusivity for the complete update.
// A vanished parent, EOF, timeout or an arbitrary connected process is never
// an authorization to run an update.
internal static class UpdateHandoff
{
    internal enum Frame { Ready = 1, Proceed = 2, Cancel = 3, AckProceed = 4, AckCancel = 5 }
    internal const int FrameSize = 12;
    private const int Magic = 0x4E475548; // NGUH

    public static string PipeName(string session)
    {
        if (!Guid.TryParseExact(session, "N", out var id) || id == Guid.Empty || id.ToString("N") != session)
            throw new InvalidDataException("update_handoff_session_invalid");
        return "NETGRID-update-handoff-" + session;
    }

#if !NETFRAMEWORK
    public static NamedPipeServerStream CreateServer(string session)
    {
        using var identity = WindowsIdentity.GetCurrent();
        var security = new PipeSecurity();
        security.SetAccessRuleProtection(true, false);
        security.AddAccessRule(new PipeAccessRule(new SecurityIdentifier(WellKnownSidType.NetworkSid, null),
            PipeAccessRights.FullControl, AccessControlType.Deny));
        security.AddAccessRule(new PipeAccessRule(identity.User ?? throw new InvalidDataException("update_handoff_user_missing"),
            PipeAccessRights.FullControl, AccessControlType.Allow));
        security.AddAccessRule(new PipeAccessRule(new SecurityIdentifier(WellKnownSidType.BuiltinAdministratorsSid, null),
            PipeAccessRights.ReadWrite, AccessControlType.Allow));
        security.AddAccessRule(new PipeAccessRule(new SecurityIdentifier(WellKnownSidType.LocalSystemSid, null),
            PipeAccessRights.ReadWrite, AccessControlType.Allow));
        return NamedPipeServerStreamAcl.Create(PipeName(session), PipeDirection.InOut, 1, PipeTransmissionMode.Byte,
            PipeOptions.Asynchronous | PipeOptions.FirstPipeInstance, 512, 512, security);
    }
#endif

    // The elevated consumer obtains and retains this actual process handle.
    // Missing/reused PIDs or a different image fail before connecting.
    public static Process OpenParent(int pid, long startedUtcTicks, string expectedImage)
    {
        if (pid <= 0 || startedUtcTicks <= 0 || string.IsNullOrWhiteSpace(expectedImage) ||
            !string.Equals(Path.GetFullPath(expectedImage), expectedImage, StringComparison.OrdinalIgnoreCase))
            throw new InvalidDataException("update_handoff_parent_invalid");
        var parent = Process.GetProcessById(pid);
        try
        {
            _ = parent.Handle;
            if (parent.HasExited || parent.StartTime.ToUniversalTime().Ticks != startedUtcTicks ||
                !string.Equals(Path.GetFullPath(parent.MainModule?.FileName ?? throw new InvalidDataException("update_handoff_parent_image_missing")),
                    Path.GetFullPath(expectedImage), StringComparison.OrdinalIgnoreCase))
                throw new InvalidDataException("update_handoff_parent_mismatch");
            return parent;
        }
        catch { parent.Dispose(); throw; }
    }

    public static async Task<Endpoint> AcceptAsync(NamedPipeServerStream pipe, Process worker, CancellationToken cancellationToken)
    {
        _ = worker.Handle;
        await pipe.WaitForConnectionAsync(cancellationToken);
        RequirePeer(pipe, worker, serverSide: true);
        return new Endpoint(pipe, serverSide: true);
    }

    // MSI may run as SYSTEM or a different administrator. The normal launcher
    // must not request Process.Handle's all-access rights to that process.
    internal static async Task<Endpoint> AcceptReadOnlyPeerAsync(NamedPipeServerStream pipe, QueriedProcess worker, CancellationToken cancellationToken)
    {
        await pipe.WaitForConnectionAsync(cancellationToken);
        if (!GetNamedPipeClientProcessId(pipe.SafePipeHandle, out var actual))
            throw new Win32Exception(Marshal.GetLastWin32Error());
        if (actual != worker.Id) throw new InvalidDataException("update_handoff_peer_mismatch");
        worker.RequireAlive();
        return new Endpoint(pipe, serverSide: true);
    }

    internal sealed class QueriedProcess : IDisposable
    {
        private readonly SafeProcessHandle _handle;
        private readonly long _started;
        public int Id { get; }
        private QueriedProcess(int id, long started, SafeProcessHandle handle) { Id = id; _started = started; _handle = handle; }
        public static QueriedProcess Open(int id, long started)
        {
            if (id <= 0 || started <= 0) throw new InvalidOperationException("installation_gate_msi_owner_invalid");
            var handle = OpenProcess(0x101000, false, id); // Query limited + synchronize; no mutation rights.
            if (handle.IsInvalid)
            {
                var error = Marshal.GetLastWin32Error(); handle.Dispose();
                throw new Win32Exception(error, "installation_gate_msi_owner_query_failed");
            }
            var result = new QueriedProcess(id, started, handle);
            try { result.RequireAlive(); return result; }
            catch { result.Dispose(); throw; }
        }
        public void RequireAlive()
        {
            if (!GetProcessTimes(_handle, out var created, out _, out _, out _))
                throw new Win32Exception(Marshal.GetLastWin32Error(), "installation_gate_msi_owner_query_failed");
            // Exit time is undefined while running; exit code 259 can also be a
            // real exit code. Query the retained process object's signaled state.
            var state = WaitForSingleObject(_handle, 0);
            if (state == uint.MaxValue) throw new Win32Exception(Marshal.GetLastWin32Error(), "installation_gate_msi_owner_query_failed");
            if (state != 258 || DateTime.FromFileTimeUtc(created).Ticks != _started)
                throw new InvalidOperationException("installation_gate_msi_owner_exited_or_reused");
        }
        public void Dispose() => _handle.Dispose();
    }

    public static async Task<Endpoint> ConnectAsync(string session, Process parent, CancellationToken cancellationToken)
    {
        _ = parent.Handle;
        var pipe = new NamedPipeClientStream(".", PipeName(session), PipeDirection.InOut,
            PipeOptions.Asynchronous, TokenImpersonationLevel.Anonymous);
        try
        {
            await pipe.ConnectAsync(cancellationToken);
            RequirePeer(pipe, parent, serverSide: false);
            return new Endpoint(pipe, serverSide: false);
        }
        catch { pipe.Dispose(); throw; }
    }

    internal static void RequirePeer(PipeStream pipe, Process expected, bool serverSide)
    {
        uint actual;
        var success = serverSide ? GetNamedPipeClientProcessId(pipe.SafePipeHandle, out actual)
            : GetNamedPipeServerProcessId(pipe.SafePipeHandle, out actual);
        if (!success) throw new Win32Exception(Marshal.GetLastWin32Error());
        if (actual != expected.Id || expected.HasExited)
            throw new InvalidDataException("update_handoff_peer_mismatch");
    }

    internal static byte[] Encode(Frame frame)
    {
        if (frame is < Frame.Ready or > Frame.AckCancel) throw new InvalidDataException("update_handoff_frame_invalid");
        var bytes = new byte[FrameSize];
        WriteInt(bytes, 0, Magic);
        WriteInt(bytes, 4, 1);
        WriteInt(bytes, 8, (int)frame);
        return bytes;
    }

    internal static Frame Decode(byte[] bytes)
    {
        if (bytes.Length != FrameSize || ReadInt(bytes, 0) != Magic || ReadInt(bytes, 4) != 1)
            throw new InvalidDataException("update_handoff_frame_invalid");
        var frame = (Frame)ReadInt(bytes, 8);
        return frame is >= Frame.Ready and <= Frame.AckCancel ? frame
            : throw new InvalidDataException("update_handoff_frame_invalid");
    }

    private static void WriteInt(byte[] bytes, int offset, int value)
    {
        for (var index = 0; index < 4; index++) bytes[offset + index] = (byte)(value >> (index * 8));
    }
    private static int ReadInt(byte[] bytes, int offset) => bytes[offset] | (bytes[offset + 1] << 8) |
        (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24);

    internal sealed class Endpoint(PipeStream pipe, bool serverSide) : IDisposable
    {
        private int _used;
        private int _proceedDispatchStarted;

        // An acknowledgement can be lost after the consumer received Proceed.
        // The caller must retain exclusivity and resolve the exact worker's
        // outcome in this state; a transport exception does not undo dispatch.
        public bool ProceedMayHaveBeenDelivered => Volatile.Read(ref _proceedDispatchStarted) != 0;

        public async Task SendDecisionAsync(bool proceed, CancellationToken cancellationToken)
        {
            UseOnce(requireServer: true);
            if (await Read(cancellationToken) != Frame.Ready) throw new InvalidDataException("update_handoff_ready_missing");
            if (proceed) Interlocked.Exchange(ref _proceedDispatchStarted, 1);
            await Write(proceed ? Frame.Proceed : Frame.Cancel, cancellationToken);
            if (await Read(cancellationToken) != (proceed ? Frame.AckProceed : Frame.AckCancel))
                throw new InvalidDataException("update_handoff_ack_mismatch");
        }

        public async Task<bool> ReceiveDecisionAsync(CancellationToken cancellationToken)
        {
            UseOnce(requireServer: false);
            await Write(Frame.Ready, cancellationToken);
            var decision = await Read(cancellationToken);
            if (decision is not (Frame.Proceed or Frame.Cancel)) throw new InvalidDataException("update_handoff_decision_invalid");
            await Write(decision == Frame.Proceed ? Frame.AckProceed : Frame.AckCancel, cancellationToken);
            return decision == Frame.Proceed;
        }

        private void UseOnce(bool requireServer)
        {
            if (serverSide != requireServer || Interlocked.Exchange(ref _used, 1) != 0)
                throw new InvalidOperationException("update_handoff_phase_invalid");
        }

        private async Task<Frame> Read(CancellationToken cancellationToken)
        {
            var bytes = new byte[FrameSize];
            var offset = 0;
            while (offset < bytes.Length)
            {
                var count = await pipe.ReadAsync(bytes, offset, bytes.Length - offset, cancellationToken);
                if (count == 0) throw new EndOfStreamException("update_handoff_frame_incomplete");
                offset += count;
            }
            return Decode(bytes);
        }

        private async Task Write(Frame frame, CancellationToken cancellationToken)
        {
            var bytes = Encode(frame);
            await pipe.WriteAsync(bytes, 0, bytes.Length, cancellationToken);
        }

        public void Dispose() => pipe.Dispose();
    }

    [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)] private static extern bool GetNamedPipeClientProcessId(SafePipeHandle pipe, out uint processId);
    [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)] private static extern bool GetNamedPipeServerProcessId(SafePipeHandle pipe, out uint processId);
    [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
    private static extern SafeProcessHandle OpenProcess(uint access, [MarshalAs(UnmanagedType.Bool)] bool inheritHandle, int processId);
    [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)] private static extern bool GetProcessTimes(SafeProcessHandle process, out long created, out long exited, out long kernel, out long user);
    [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
    private static extern uint WaitForSingleObject(SafeProcessHandle process, uint milliseconds);
}
