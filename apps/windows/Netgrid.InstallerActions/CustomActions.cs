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
                ["ProductCode"] = session["ProductCode"],
                ["OuterLease"] = session["NETGRID_UPDATE_LEASE"],
                ["Nested"] = "0",
            };
            InstallationGate.ValidateProductCode(data["ProductCode"]);
            if (data["OuterLease"] != "") InstallationGate.ValidateLease(data["OuterLease"]);
            var upgradingProduct = session["UPGRADINGPRODUCTCODE"];
            if (upgradingProduct != "")
            {
                InstallationGate.ValidateProductCode(upgradingProduct);
                if (upgradingProduct == data["ProductCode"] || data["OuterLease"] != "")
                    throw new InvalidOperationException("installation_gate_nested_context_invalid");
                using (var machine = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64))
                {
                    var current = InstallationGate.Read(machine, InstallationGate.KeyFor(root));
                    if (current == null || current.MsiProductCode != upgradingProduct)
                        throw new InvalidOperationException("installation_gate_msi_owner_missing");
                    InstallationLease.RequireMsi(machine, root, current.MsiLease, upgradingProduct);
                    data["Lease"] = current.MsiLease;
                    data["ProductCode"] = upgradingProduct;
                    data["Nested"] = "1";
                }
            }
            foreach (var action in new[] { "BeginNetgridLifecycle", "CommitNetgridLifecycle", "RollbackNetgridLifecycle" })
                session[action] = data.ToString();
        });

        [CustomAction]
        public static ActionResult BeginNetgridLifecycle(Session session) => Run(session, () =>
        {
            var root = session.CustomActionData["ProgramRoot"];
            var lease = session.CustomActionData["Lease"];
            using (var machine = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64))
            {
                if (IsNested(session)) InstallationLease.RequireMsi(machine, root, lease, session.CustomActionData["ProductCode"]);
                else if (session.CustomActionData["OuterLease"] == "")
                    InstallationLease.BeginMsi(machine, root, lease, session.CustomActionData["ProductCode"], "");
                else
                    using (var owner = InstallationGate.OpenUpdateOwner(machine, root, session.CustomActionData["OuterLease"]))
                        InstallationLease.BeginMsi(machine, root, lease, session.CustomActionData["ProductCode"], session.CustomActionData["OuterLease"]);
            }
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
                if (IsNested(session)) InstallationLease.RequireMsi(machine, session.CustomActionData["ProgramRoot"], session.CustomActionData["Lease"], session.CustomActionData["ProductCode"]);
                else if (!InstallationLease.CompleteMsi(machine, session.CustomActionData["ProgramRoot"], session.CustomActionData["Lease"], session.CustomActionData["ProductCode"]))
                    throw new InvalidOperationException("installation_gate_commit_owner_missing");
        });

        [CustomAction]
        public static ActionResult RollbackNetgridLifecycle(Session session) => Run(session, () =>
        {
            // A nested rollback owns no release, including when the top-level
            // rollback has already completed its transaction record.
            if (IsNested(session)) { session.Log("NETGRID_LIFECYCLE_ROLLBACK nested=true released=false"); return; }
            using (var machine = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64))
                session.Log("NETGRID_LIFECYCLE_ROLLBACK released={0}", InstallationLease.CompleteMsi(
                    machine, session.CustomActionData["ProgramRoot"], session.CustomActionData["Lease"], session.CustomActionData["ProductCode"]));
        });

        private static bool IsNested(Session session)
        {
            var value = session.CustomActionData["Nested"];
            if (value != "0" && value != "1") throw new InvalidOperationException("installation_gate_nested_context_invalid");
            return value == "1";
        }


        private static bool ProductProcessesRemain(string programRoot) => ProductProcesses.Remain(programRoot);

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
