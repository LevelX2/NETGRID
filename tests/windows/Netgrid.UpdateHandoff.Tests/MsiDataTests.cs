using System.Security.AccessControl;
using System.Security.Principal;
using Microsoft.Win32;
using Netgrid.Windows;
using Netgrid.Updater;

internal static class MsiDataTests
{
    internal static void Run()
    {
        var checks = 0;
        var id = Guid.NewGuid().ToString("N");
        var keyPath = @"SOFTWARE\LevelX2\NETGRID.MsiData.Tests\" + id;
        var scratch = Path.Combine(Path.GetTempPath(), "NETGRID-msi-data-test-" + id);
        using var identity = WindowsIdentity.GetCurrent();
        var security = new DirectorySecurity();
        security.SetOwner(identity.User!); security.SetAccessRuleProtection(true, false);
        security.AddAccessRule(new FileSystemAccessRule(identity.User!, FileSystemRights.FullControl,
            InheritanceFlags.ContainerInherit | InheritanceFlags.ObjectInherit, PropagationFlags.None, AccessControlType.Allow));
        try
        {
            var requestArgs = new[] { "--msi-data", "capture", "--program-root", Path.Combine(scratch, "program"),
                "--msi-lease", id, "--product-code", Guid.NewGuid().ToString("B").ToUpperInvariant() };
            Check(MsiDataRequest.Parse(requestArgs).Lease == id, "strict_request_valid");
            foreach (var invalid in new[] { Array.Empty<string>(), requestArgs[..7], [.. requestArgs, "extra"],
                new[] { "--msi-data", "repair", "--program-root", requestArgs[3], "--msi-lease", id, "--product-code", requestArgs[7] } })
                Reject(() => MsiDataRequest.Parse(invalid), "installation_gate_msi_data_request_invalid");
            using var fixture = Registry.CurrentUser.CreateSubKey(keyPath, writable: true)!;
            foreach (var mode in new[] { "success", "health-failure", "commit-rollback", "capture-failure", "restore-failure", "changed-credential" })
            {
                var root = Path.Combine(scratch, mode, "program");
                var data = Path.Combine(scratch, mode, "data");
                Directory.CreateDirectory(Path.Combine(data, "config"));
                Directory.CreateDirectory(Path.Combine(data, "runtime", "maintenance"));
                var credential = Path.Combine(data, "runtime", "maintenance", "auth.json");
                var store = Path.Combine(data, "runtime", "accounts.dat");
                var deck = Path.Combine(data, "runtime", "decks.json");
                File.WriteAllText(Path.Combine(data, "config", "runtime.env"), "fixture-only");
                File.WriteAllText(credential, "fixture-credential");
                File.WriteAllText(store, "original-accounts"); File.WriteAllText(deck, "original-decks");
                var layout = new UpdateDataLayout(data, new Dictionary<string, string> { ["NETGRID_RUNTIME_PROFILE"] = "release", ["NETGRID_DATA_ROOT"] = data });
                var lease = Guid.NewGuid().ToString("N");
                var product = Guid.NewGuid().ToString("B").ToUpperInvariant();
                InstallationLease.BeginMsi(fixture, root, lease, product, "");
                MsiDataBinding? Binding() => InstallationLease.ReadMsiData(fixture, root, lease, product);
                void Execute(string operation, bool healthy = true) => MsiDataTransaction.Execute(fixture,
                    new MsiDataRequest(operation, root, lease, product), data,
                    () => mode == "capture-failure" ? throw new InvalidOperationException("fixture_capture_failed") : UpdateDataSnapshot.Capture(layout, security),
                    binding => UpdateDataSnapshot.Reopen(layout, binding.SnapshotId, binding.ManifestSha256, security),
                    snapshot =>
                    {
                        if (mode == "restore-failure") throw new InvalidOperationException("fixture_restore_failed");
                        using var failed = UpdateDataSnapshot.Capture(layout, security);
                        snapshot.RestoreWithPreserved(failed);
                    }, () => healthy, () => false);
                if (mode == "capture-failure")
                {
                    Reject(() => Execute("capture"), "fixture_capture_failed");
                    Check(Binding()!.Phase == MsiDataBinding.Preparing, "capture_failure_never_authorizes_mutation");
                    Reject(() => InstallationLease.CompleteMsi(fixture, root, lease, product), "installation_gate_msi_data_completion_unverified");
                    Check(InstallationLease.RollbackMsi(fixture, root, lease, product), "pre_mutation_failure_can_cancel");
                    continue;
                }
                Execute("capture");
                var captured = Binding()!;
                Check(captured.Phase == MsiDataBinding.Captured && MsiDataBinding.Decode(captured.Encode()).Encode() == captured.Encode(), "snapshot_bound_and_roundtrips");
                Check(InstallationGate.Read(fixture, InstallationGate.KeyFor(root))!.OwnerId == 0, "capture_returned_operation_not_msi_lease");
                Reject(() => InstallationLease.CompleteMsi(fixture, root, lease, product), "installation_gate_msi_data_completion_unverified");
                Reject(() => InstallationLease.RollbackMsi(fixture, root, lease, product), "installation_gate_msi_data_completion_unverified");
                Reject(() => Execute("capture"), "installation_gate_msi_data_already_bound");
                foreach (var invalid in new[] { captured.Encode() + "|extra", captured.Encode().Replace("|captured|", "|complete|"),
                    captured.Encode().Replace(captured.ManifestSha256, new string('z', 64)) })
                    Reject(() => MsiDataBinding.Decode(invalid), "installation_gate_msi_data_invalid");
                if (mode == "changed-credential")
                {
                    File.WriteAllText(credential, "changed-fixture-credential");
                    Reject(() => Execute("verify"), "update_data_protected_file_changed");
                    Check(File.ReadAllText(credential) == "changed-fixture-credential" && Binding()!.Phase == MsiDataBinding.Captured,
                        "credential_never_overwritten_or_marked_verified");
                    continue;
                }
                File.WriteAllText(store, "changed-accounts"); File.WriteAllText(deck, "changed-decks");
                if (mode == "health-failure" || mode == "restore-failure")
                {
                    Reject(() => Execute("verify", healthy: false), "installation_gate_msi_data_health_failed");
                    Check(Binding()!.Phase == MsiDataBinding.Captured, "health_failure_keeps_capture_authority");
                }
                else
                {
                    Execute("verify");
                    Check(Binding()!.Phase == MsiDataBinding.Verified && Binding()!.SnapshotId == captured.SnapshotId, "health_marks_exact_snapshot");
                }
                if (mode == "success")
                {
                    Check(InstallationLease.CompleteMsi(fixture, root, lease, product), "verified_commit_releases");
                    Check(File.ReadAllText(store) == "changed-accounts", "success_does_not_restore_old_data");
                    continue;
                }
                if (mode == "restore-failure")
                {
                    Reject(() => Execute("restore"), "fixture_restore_failed");
                    Reject(() => InstallationLease.RollbackMsi(fixture, root, lease, product), "installation_gate_msi_data_completion_unverified");
                    continue;
                }
                Execute("restore");
                Check(File.ReadAllText(store) == "original-accounts" && File.ReadAllText(deck) == "original-decks", "complete_live_data_restored");
                Check(File.ReadAllText(credential) == "fixture-credential" && Binding()!.Phase == MsiDataBinding.Restored, "credential_preserved_restore_verified");
                Check(Directory.GetDirectories(layout.ArchiveRoot).Length == 2, "failed_state_preserved_before_restore");
                Reject(() => InstallationLease.CompleteMsi(fixture, root, lease, product), "installation_gate_msi_data_completion_unverified");
                Check(InstallationLease.RollbackMsi(fixture, root, lease, product), "verified_restore_allows_rollback_release");
            }
        }
        finally
        {
            Registry.CurrentUser.DeleteSubKeyTree(keyPath, throwOnMissingSubKey: false);
            if (Path.GetDirectoryName(Path.GetFullPath(scratch)) != Path.TrimEndingDirectorySeparator(Path.GetFullPath(Path.GetTempPath())) ||
                Path.GetFileName(scratch) != "NETGRID-msi-data-test-" + id) throw new Exception("msi_data_fixture_scope_invalid");
            if (Directory.Exists(scratch)) Directory.Delete(scratch, recursive: true);
        }
        Console.WriteLine($"MSI_DATA_TRANSACTION_TESTS_OK checks={checks} snapshots=real-files registry=isolatedHKCU MSI=not-started elevation=false");
        void Check(bool value, string name) { if (!value) throw new Exception("msi_data_test_failed:" + name); checks++; }
        void Reject(Action action, string code)
        {
            try { action(); }
            catch (InvalidOperationException error) when (error.Message == code) { checks++; return; }
            throw new Exception("msi_data_rejection_missing:" + code);
        }
    }
}
