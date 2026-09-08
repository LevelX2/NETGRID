using Microsoft.Win32;
using Netgrid.Windows;
using System.Xml.Linq;

if (LaunchFenceTests.TryChild(args)) return;
if (RecoveryTakeoverTests.TryChild(args)) return;
if (MsiHelperExitTests.TryChild(args)) return;
if (await DirectMsiPreparationTests.TryChildAsync(args)) return;
if (args is ["--check-msi-helper-exit"])
{
    Console.WriteLine($"MSI_HELPER_EXIT_TESTS_OK checks={MsiHelperExitTests.Run()} registry=isolated_HKCU MSI=not-started");
    return;
}

var checks = 0;
void Assert(bool condition, string name)
{
    if (!condition) throw new Exception("installer_lifecycle_test_failed:" + name);
    checks++;
}
void Reject(Action action, string code)
{
    try { action(); throw new Exception("installer_lifecycle_test_failed:accepted_" + code); }
    catch (InvalidOperationException error) when (error.Message == code) { checks++; }
}

const string program = @"C:\NETGRID-isolated-lifecycle-fixture\program";
var key = InstallationGate.KeyFor(program);
Assert(InstallationGate.KeyFor(program.ToLowerInvariant() + "\\") == key, "same_root_identity");
Assert(InstallationGate.KeyFor(program + "-other") != key, "other_root_isolated");
foreach (var invalid in new[] { "", "relative", "C:relative", @"\relative", @"\\server\share" })
    Reject(() => InstallationGate.KeyFor(invalid), "installation_gate_root_invalid");
Reject(() => InstallationGate.KeyFor(@"C:\"), "installation_gate_root_too_broad");

var id = Guid.NewGuid().ToString("N");
const string fixturePrefix = @"SOFTWARE\LevelX2\NETGRID.Lifecycle.Tests\";
var fixturePath = fixturePrefix + id;
using var user = RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry64);
if (user.OpenSubKey(fixturePath) is not null) throw new Exception("fixture_already_exists");
try
{
    // No HKLM writes, existing NETGRID registry state or data files are used.
    using var fixture = user.CreateSubKey(fixturePath, writable: true)!;
    Assert(InstallationGate.Read(fixture, key) is null, "absent_gate_allows_start");
    var alpha = Guid.NewGuid().ToString("N");
    var beta = Guid.NewGuid().ToString("N");
    InstallationLease.Begin(fixture, program, alpha);
    Assert(InstallationGate.Read(fixture, key)!.Active, "begin_blocks_starts");
    Assert(InstallationGate.BlocksStart(InstallationGate.Read(fixture, key), DateTime.UtcNow.AddDays(1)), "active_gate_blocks_even_new_process");
    Assert(!InstallationLease.ReleaseOwned(fixture, program, beta), "foreign_rollback_cannot_release");
    Reject(() => InstallationLease.Begin(fixture, program, beta), "installation_gate_already_owned");
    Assert(InstallationGate.Read(fixture, key)!.Lease == alpha, "failed_begin_preserves_previous_owner");
    Assert(InstallationLease.ReleaseOwned(fixture, program, alpha), "owner_releases");
    var completed = InstallationGate.Read(fixture, key)!;
    Assert(!completed.Active && completed.CompletedUtcTicks > 0, "completion_cutoff_persisted");
    Assert(InstallationGate.BlocksStart(completed, new DateTime(completed.CompletedUtcTicks - 1, DateTimeKind.Utc)), "delayed_old_process_cannot_start_after_commit");
    Assert(!InstallationGate.BlocksStart(completed, new DateTime(completed.CompletedUtcTicks + 1, DateTimeKind.Utc)), "fresh_process_after_commit_allowed");
    Assert(!InstallationLease.ReleaseOwned(fixture, program, alpha), "repeated_rollback_does_not_rewrite_cutoff");
    Assert(InstallationGate.Read(fixture, key)!.CompletedUtcTicks == completed.CompletedUtcTicks, "cutoff_unchanged");
    InstallationLease.Begin(fixture, program, beta);
    Assert(InstallationGate.Read(fixture, key)!.Lease == beta, "next_transaction_replaces_completed_lease");
    Assert(!InstallationLease.ReleaseOwned(fixture, program, alpha), "old_cleanup_cannot_clear_next_transaction");
    Assert(InstallationLease.ReleaseOwned(fixture, program, beta), "next_owner_releases");
    using var corrupt = fixture.OpenSubKey(key, writable: true)!;
    foreach (var invalid in new[] { "broken", alpha, alpha + "|-1", Guid.Empty.ToString("N") + "|0" })
    {
        corrupt.SetValue("Lease", invalid, RegistryValueKind.String);
        Reject(() => InstallationGate.Read(fixture, key), "installation_gate_lease_invalid");
        Reject(() => InstallationLease.Begin(fixture, program, alpha), "installation_gate_lease_invalid");
    }
    corrupt.SetValue("Lease", 1, RegistryValueKind.DWord);
    Reject(() => InstallationGate.Read(fixture, key), "installation_gate_lease_invalid");
    PreparationLeaseTests.Run(fixture, program, Assert, Reject);
    MsiLeaseTests.Run(fixture, program, Assert, Reject);
    UpdateOwnerTests.Run(fixture, program, Assert, Reject);
    LaunchFenceTests.Run(fixture, Assert, Reject);
    MsiPreparationLeaseTests.Run(fixture, Assert, Reject);
    await DirectMsiPreparationTests.RunAsync(fixture, Assert);
    MsiOfflineProcessTests.Run(fixture, Assert, Reject);
}
finally
{
    if (!fixturePath.StartsWith(fixturePrefix, StringComparison.Ordinal) ||
        !Guid.TryParseExact(fixturePath.Substring(fixturePrefix.Length), "N", out _))
        throw new Exception("lifecycle_fixture_cleanup_scope_invalid");
    user.DeleteSubKeyTree(fixturePath, throwOnMissingSubKey: true);
}
Assert(user.OpenSubKey(fixturePath) is null, "own_registry_fixture_removed");

var authoring = XDocument.Load(Path.Combine("installer", "product", "Product.wxs"));
XNamespace wix = "http://wixtoolset.org/schemas/v4/wxs";
var package = authoring.Root!.Element(wix + "Package")!;
Assert(package.Descendants(wix + "Component").Any(component =>
    component.Elements(wix + "File").Any(file => (string?)file.Attribute("Id") == "NetgridLauncher") &&
    component.Elements(wix + "RegistryValue").Any(value => (string?)value.Attribute("Name") == "InstallerLifecycleProtocol" &&
        (string?)value.Attribute("Value") == "msi-data-v1")), "installed_protocol_bound_to_launcher_component");
var sequence = package.Element(wix + "InstallExecuteSequence")!;
Assert((string?)package.Element(wix + "MajorUpgrade")!.Attribute("Schedule") == "afterInstallExecute", "old_product_removed_inside_guarded_transaction");
Assert(package.Elements(wix + "Property").Any(x => (string?)x.Attribute("Id") == "NETGRID_UPDATE_LEASE" &&
    (string?)x.Attribute("Secure") == "yes" && (string?)x.Attribute("Hidden") == "yes"), "outer_update_lease_forwarded_without_logging");
XElement Definition(string name) => package.Elements(wix + "CustomAction").Single(x => (string?)x.Attribute("Id") == name);
XElement Scheduled(string name) => sequence.Elements(wix + "Custom").Single(x => (string?)x.Attribute("Action") == name);
foreach (var action in new[] { "RemoveNetgridFirewall", "DeleteNetgridData" })
{
    Assert(((string?)Scheduled(action).Attribute("Condition"))?.Contains("NOT UPGRADINGPRODUCTCODE", StringComparison.Ordinal) == true,
        action + "_never_runs_in_nested_old_uninstall");
    Assert(package.Elements(wix + "SetProperty").Where(x => (string?)x.Attribute("Id") == action)
        .All(x => ((string?)x.Attribute("Condition"))?.Contains("NOT UPGRADINGPRODUCTCODE", StringComparison.Ordinal) == true),
        action + "_nested_arguments_not_prepared");
}
foreach (var (name, execution) in new[] { ("BeginNetgridLifecycle", "deferred"), ("VerifyNetgridLifecycle", "deferred"), ("CommitNetgridLifecycle", "commit"), ("RollbackNetgridLifecycle", "rollback") })
{
    var action = Definition(name);
    Assert((string?)action.Attribute("Execute") == execution && (string?)action.Attribute("Impersonate") == "no" && (string?)action.Attribute("Return") == "check", name + "_authority_and_failure");
    Assert((string?)action.Attribute("BinaryRef") == "NetgridLifecycleActions", name + "_independent_of_installed_files");
    Assert(Scheduled(name).Attribute("Condition") is null, name + "_covers_install_repair_uninstall");
}
Assert((string?)Scheduled("RollbackNetgridLifecycle").Attribute("After") == "InstallInitialize", "rollback_scheduled_before_mutation");
Assert((string?)Scheduled("BeginNetgridLifecycle").Attribute("After") == "RollbackNetgridLifecycle", "begin_before_file_changes");
Assert((string?)Scheduled("CommitNetgridLifecycle").Attribute("Before") == "InstallFinalize", "outer_commit_queued_after_nested_removal");
Assert((string?)Scheduled("VerifyNetgridLifecycle").Attribute("Before") == "CommitNetgridLifecycle", "verify_before_final_commit_inside_rollback_boundary");
Assert(package.Elements(wix + "Launch").Any(x => (string?)x.Attribute("Condition") == "NOT RollbackDisabled"), "rollback_cannot_be_disabled");
Assert(package.Elements(wix + "Property").Any(x => (string?)x.Attribute("Id") == "MSIRESTARTMANAGERCONTROL" && (string?)x.Attribute("Value") == "DisableShutdown"), "restart_manager_not_second_process_owner");
var frameworkCondition = package.Elements(wix + "Launch").Select(x => (string)x.Attribute("Condition")!)
    .Single(x => x.Contains("NETGRID_DOTNET_FRAMEWORK_RELEASE", StringComparison.Ordinal));
Assert(frameworkCondition == "NETGRID_DOTNET_FRAMEWORK_RELEASE >= \"#528040\"", "framework_condition_uses_raw_dword_representation");
checks += RecoveryBindingTests.Run();
checks += RecoveryTakeoverTests.Run();
checks += MsiOperationTests.Run();
checks += MsiHelperExitTests.Run();
Console.WriteLine($"INSTALLER_LIFECYCLE_TESTS_OK checks={checks} registry=isolated_HKCU fixtureCleanup=verified installed=false");
