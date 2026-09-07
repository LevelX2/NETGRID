using System.Buffers.Binary;
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
        return NamedPipeServerStreamAcl.Create(PipeName(session), PipeDirection.InOut, 1, PipeTransmissionMode.Byte,
            PipeOptions.Asynchronous | PipeOptions.FirstPipeInstance, 512, 512, security);
    }

    // The elevated consumer obtains and retains this actual process handle.
    // Missing/reused PIDs or a different image fail before connecting.
    public static Process OpenParent(int pid, long startedUtcTicks, string expectedImage)
    {
        if (pid <= 0 || startedUtcTicks <= 0 || !Path.IsPathFullyQualified(expectedImage))
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
        BinaryPrimitives.WriteInt32LittleEndian(bytes, Magic);
        BinaryPrimitives.WriteInt32LittleEndian(bytes.AsSpan(4), 1);
        BinaryPrimitives.WriteInt32LittleEndian(bytes.AsSpan(8), (int)frame);
        return bytes;
    }

    internal static Frame Decode(byte[] bytes)
    {
        if (bytes.Length != FrameSize || BinaryPrimitives.ReadInt32LittleEndian(bytes) != Magic ||
            BinaryPrimitives.ReadInt32LittleEndian(bytes.AsSpan(4)) != 1)
            throw new InvalidDataException("update_handoff_frame_invalid");
        var frame = (Frame)BinaryPrimitives.ReadInt32LittleEndian(bytes.AsSpan(8));
        return frame is >= Frame.Ready and <= Frame.AckCancel ? frame
            : throw new InvalidDataException("update_handoff_frame_invalid");
    }

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
            await pipe.ReadExactlyAsync(bytes, cancellationToken);
            return Decode(bytes);
        }

        private async Task Write(Frame frame, CancellationToken cancellationToken)
        {
            await pipe.WriteAsync(Encode(frame), cancellationToken);
        }

        public void Dispose() => pipe.Dispose();
    }

    [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)] private static extern bool GetNamedPipeClientProcessId(SafePipeHandle pipe, out uint processId);
    [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)] private static extern bool GetNamedPipeServerProcessId(SafePipeHandle pipe, out uint processId);
}
