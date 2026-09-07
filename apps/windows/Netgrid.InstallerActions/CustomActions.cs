using System;
using System.Diagnostics;
using System.ComponentModel;
using System.IO;
using System.Threading;
using Microsoft.Win32;
using WixToolset.Dtf.WindowsInstaller;
using Netgrid.Windows;

namespace Netgrid.InstallerActions
{
    public static class CustomActions
    {
        [CustomAction]
        public static ActionResult PrepareNetgridLifecycle(Session session) => Run(session, () =>
        {
            if (session.EvaluateCondition("RollbackDisabled"))
                throw new InvalidOperationException("installation_gate_requires_rollback");
            var root = Path.GetFullPath(session["INSTALLFOLDER"]);
            Netgrid.Windows.InstallationGate.KeyFor(root);
            var data = new CustomActionData
            {
                ["ProgramRoot"] = root,
                ["Lease"] = Guid.NewGuid().ToString("N"),
            };
            foreach (var action in new[] { "BeginNetgridLifecycle", "CommitNetgridLifecycle", "RollbackNetgridLifecycle" })
                session[action] = data.ToString();
        });

        [CustomAction]
        public static ActionResult BeginNetgridLifecycle(Session session) => Run(session, () =>
        {
            var root = session.CustomActionData["ProgramRoot"];
            var lease = session.CustomActionData["Lease"];
            using (var machine = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64))
                InstallationLease.Begin(machine, root, lease);
            // The launcher observes the lease, disables recovery and performs
            // its existing stdin shutdown. Never kill it or arbitrary Node
            // processes from the installer as a substitute for that handshake.
            var deadline = Stopwatch.StartNew();
            while (ProductProcessesRemain(root))
            {
                if (deadline.Elapsed > TimeSpan.FromSeconds(45))
                    throw new InvalidOperationException("installation_gate_runtime_stop_timeout");
                Thread.Sleep(200);
            }
            session.Log("NETGRID_LIFECYCLE_STOPPED runtime=absent lease=held");
        });

        [CustomAction]
        public static ActionResult CommitNetgridLifecycle(Session session) => Run(session, () =>
        {
            using (var machine = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64))
                if (!InstallationLease.ReleaseOwned(machine, session.CustomActionData["ProgramRoot"], session.CustomActionData["Lease"]))
                    throw new InvalidOperationException("installation_gate_commit_owner_missing");
        });

        [CustomAction]
        public static ActionResult RollbackNetgridLifecycle(Session session) => Run(session, () =>
        {
            using (var machine = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64))
                session.Log("NETGRID_LIFECYCLE_ROLLBACK released={0}", InstallationLease.ReleaseOwned(
                    machine, session.CustomActionData["ProgramRoot"], session.CustomActionData["Lease"]));
        });

        private static bool ProductProcessesRemain(string programRoot)
        {
            var root = Path.GetFullPath(programRoot).TrimEnd(Path.DirectorySeparatorChar);
            var names = new[] { "NETGRID", "node", "NETGRID.FirstRun" };
            foreach (var name in names)
            {
                var processes = Process.GetProcessesByName(name);
                try
                {
                    foreach (var process in processes)
                    {
                        string image;
                        try { image = process.MainModule.FileName; }
                        catch (InvalidOperationException) when (process.HasExited) { continue; }
                        catch (Win32Exception) when (process.HasExited) { continue; }
                        var expected = name == "node" ? Path.Combine(root, "runtime", "node", "node.exe") : Path.Combine(root, name + ".exe");
                        if (string.Equals(Path.GetFullPath(image), expected, StringComparison.OrdinalIgnoreCase)) return true;
                    }
                }
                finally { foreach (var process in processes) process.Dispose(); }
            }
            return false;
        }

        private static ActionResult Run(Session session, Action action)
        {
            try { action(); return ActionResult.Success; }
            catch (Exception error)
            {
                // Only our fixed diagnostic codes or an exception type. No
                // runtime.env, process arguments, credentials or user data.
                var code = error is InvalidOperationException && error.Message.StartsWith("installation_gate_", StringComparison.Ordinal)
                    ? error.Message : error.GetType().Name;
                session.Log("NETGRID_LIFECYCLE_ERROR code={0}", code);
                return ActionResult.Failure;
            }
        }
    }
}
