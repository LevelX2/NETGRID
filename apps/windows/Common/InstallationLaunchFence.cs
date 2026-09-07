#nullable enable
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Security.AccessControl;
using System.Threading;
using Microsoft.Win32.SafeHandles;

namespace Netgrid.Windows
{
    // Serializes only the final gate read + process spawn with lease acquisition.
    // Never await, perform health checks, or wait for process exit in the callback.
    // Lock order: launcher lifecycle -> launch fence -> registry writer mutex.
    // This is coordination, not authorization: only the protected HKLM lease
    // grants installation ownership. Local users can deny service, not grant it.
    internal static class InstallationLaunchFence
    {
        internal static string NameFor(string programRoot) => @"Global\LevelX2.NETGRID.LaunchFence." +
            InstallationGate.KeyFor(programRoot).Substring(InstallationGate.Prefix.Length + 1);

        public static void Execute(string programRoot, Action operation) =>
            Execute(programRoot, () => { operation(); return true; });

        public static T Execute<T>(string programRoot, Func<T> operation) => Execute(programRoot, operation, 5000);

        internal static T Execute<T>(string programRoot, Func<T> operation, int timeoutMilliseconds)
        {
            if (operation == null) throw new ArgumentNullException(nameof(operation));
            if (timeoutMilliseconds < 0 || timeoutMilliseconds > 5000)
                throw new ArgumentOutOfRangeException(nameof(timeoutMilliseconds));
            using (var mutex = Open(programRoot))
            {
                var acquired = false;
                try
                {
                    try { acquired = mutex.WaitOne(timeoutMilliseconds); }
                    catch (AbandonedMutexException error)
                    {
                        acquired = true; // Windows grants ownership on abandonment.
                        throw new InvalidOperationException("installation_gate_launch_fence_abandoned", error);
                    }
                    if (!acquired) throw new InvalidOperationException("installation_gate_launch_fence_timeout");
                    return operation();
                }
                finally { if (acquired) mutex.ReleaseMutex(); }
            }
        }

        internal static Mutex Open(string programRoot)
        {
            var name = NameFor(programRoot);
            // AU may wait/release, but not change the ACL. Explicit medium label
            // permits the normal launcher to join a mutex created by elevated MSI.
            // CreateMutexEx requests only these same minimum rights even when the
            // object already exists; no create/open race or all-access requirement.
            var descriptor = new RawSecurityDescriptor(
                "D:P(D;;0x1f0001;;;NU)(A;;0x1f0001;;;SY)(A;;0x1f0001;;;BA)(A;;0x100001;;;AU)S:(ML;;NW;;;ME)");
            var bytes = new byte[descriptor.BinaryLength];
            descriptor.GetBinaryForm(bytes, 0);
            var buffer = Marshal.AllocHGlobal(bytes.Length);
            try
            {
                Marshal.Copy(bytes, 0, buffer, bytes.Length);
                var attributes = new SecurityAttributes
                {
                    Length = Marshal.SizeOf(typeof(SecurityAttributes)), Descriptor = buffer, InheritHandle = 0
                };
                var handle = CreateMutexExW(ref attributes, name, 0, 0x100001);
                if (handle.IsInvalid)
                {
                    var error = Marshal.GetLastWin32Error();
                    handle.Dispose();
                    throw new Win32Exception(error, "installation_gate_launch_fence_open_failed");
                }
                var mutex = new Mutex();
                mutex.SafeWaitHandle = handle;
                return mutex;
            }
            finally { Marshal.FreeHGlobal(buffer); }
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct SecurityAttributes
        {
            public int Length;
            public IntPtr Descriptor;
            public int InheritHandle;
        }

        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, ExactSpelling = true, SetLastError = true)]
        private static extern SafeWaitHandle CreateMutexExW(ref SecurityAttributes attributes, string name, uint flags, uint desiredAccess);
    }
}
