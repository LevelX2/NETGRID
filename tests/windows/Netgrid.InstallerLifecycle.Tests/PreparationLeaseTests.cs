using System.Collections.Concurrent;
using Microsoft.Win32;
using Netgrid.Windows;

internal static class PreparationLeaseTests
{
    public static void Run(RegistryKey fixture, string program, Action<bool, string> assert,
        Action<Action, string> reject)
    {
        var root = program + "-preparation";
        var key = InstallationGate.KeyFor(root);
        var lease = Guid.NewGuid().ToString("N");
        var foreign = Guid.NewGuid().ToString("N");
        var parentStart = DateTime.UtcNow.AddMinutes(-2);
        var ownerStart = DateTime.UtcNow.AddMinutes(-1);
        const int parent = 101, owner = 202;
        InstallationGate.GateState Read() => InstallationGate.Read(fixture, key)!;
        bool Blocked(int pid, DateTime start) => InstallationGate.BlocksStart(Read(), start, pid);

        InstallationLease.BeginPreparing(fixture, root, lease, parent, parentStart.Ticks, owner, ownerStart.Ticks);
        var preparing = Read();
        assert(preparing.Phase == InstallationGate.GateState.Preparing && preparing.Active, "preparation_is_active");
        assert(preparing.OwnerId == owner && preparing.OwnerStart == ownerStart.Ticks, "preparation_binds_worker_identity");
        assert(!Blocked(parent, parentStart), "preparation_preserves_exact_parent");
        assert(Blocked(parent + 1, parentStart), "same_start_wrong_pid_blocked");
        assert(Blocked(parent, parentStart.AddTicks(1)), "reused_pid_wrong_start_blocked");
        assert(Blocked(0, parentStart), "missing_pid_cannot_claim_parent_exception");
        assert(Blocked(303, DateTime.UtcNow.AddDays(1)), "preparation_blocks_new_process");
        reject(() => InstallationLease.Begin(fixture, root, foreign), "installation_gate_already_owned");
        reject(() => InstallationLease.BeginPreparing(fixture, root, foreign, 303, parentStart.Ticks, 404, ownerStart.Ticks), "installation_gate_already_owned");
        reject(() => InstallationLease.StopPrepared(fixture, root, foreign), "installation_gate_preparation_owner_missing");
        assert(!InstallationLease.ReleaseOwned(fixture, root, foreign), "foreign_cancel_cannot_release_preparation");
        assert(Read().Encode() == preparing.Encode(), "rejected_mutations_preserve_complete_record");

        var delayedStart = DateTime.UtcNow;
        assert(InstallationLease.ReleaseOwned(fixture, root, lease), "preparation_owner_cancels");
        var cancelled = Read();
        assert(!cancelled.Active && cancelled.Phase == InstallationGate.GateState.Completed, "cancel_completes_transaction");
        assert(cancelled.OwnerId == 0 && cancelled.OwnerStart == 0, "cancel_clears_worker_identity");
        assert(!Blocked(parent, parentStart), "cancel_preserves_original_launcher");
        assert(Blocked(303, delayedStart), "cancel_rejects_delayed_launcher");
        assert(Blocked(parent, parentStart.AddTicks(1)), "cancel_exception_still_requires_creation_time");
        assert(!Blocked(303, new DateTime(cancelled.CompletedUtcTicks + 1, DateTimeKind.Utc)), "cancel_allows_fresh_launcher");
        reject(() => InstallationLease.StopPrepared(fixture, root, lease), "installation_gate_preparation_owner_missing");
        assert(!InstallationLease.ReleaseOwned(fixture, root, lease), "cancel_is_idempotent");
        assert(Read().Encode() == cancelled.Encode(), "repeated_cancel_preserves_cutoff_and_exception");
        reject(() => InstallationLease.BeginPreparing(fixture, root, foreign, 303, parentStart.Ticks, owner, ownerStart.Ticks), "installation_gate_parent_already_blocked");
        assert(Read().Encode() == cancelled.Encode(), "stale_parent_cannot_gain_exception");

        // The exact original launcher may retry after its acknowledged cancel.
        InstallationLease.BeginPreparing(fixture, root, foreign, parent, parentStart.Ticks, owner, ownerStart.Ticks);
        assert(Read().CompletedUtcTicks == cancelled.CompletedUtcTicks, "retry_preserves_previous_cutoff");
        InstallationLease.StopPrepared(fixture, root, foreign);
        var stopping = Read();
        assert(stopping.Phase == InstallationGate.GateState.Stopping, "prepare_transitions_to_stopping");
        assert(stopping.OwnerId == owner && stopping.OwnerStart == ownerStart.Ticks, "stopping_keeps_same_update_owner");
        assert(stopping.AllowedParentId == 0 && stopping.AllowedParentStart == 0, "stopping_removes_parent_exception");
        assert(Blocked(parent, parentStart), "stopping_blocks_original_launcher");
        reject(() => InstallationLease.StopPrepared(fixture, root, foreign), "installation_gate_preparation_owner_missing");
        assert(!InstallationLease.ReleaseOwned(fixture, root, lease), "old_cancel_cannot_release_retry");
        assert(InstallationLease.ReleaseOwned(fixture, root, foreign), "stopping_owner_completes");
        assert(Blocked(parent, parentStart), "completed_update_keeps_old_launcher_blocked");
        assert(Read().CompletedUtcTicks >= cancelled.CompletedUtcTicks, "completion_cutoff_monotonic");

        using (var raw = fixture.OpenSubKey(key, writable: true)!)
        {
            // A backward wall-clock adjustment must not reduce an earlier cutoff.
            var futureCutoff = DateTime.UtcNow.AddHours(1).Ticks;
            raw.SetValue("Lease", new InstallationGate.GateState(lease, InstallationGate.GateState.Completed, futureCutoff).Encode());
            InstallationLease.Begin(fixture, root, foreign);
            InstallationLease.ReleaseOwned(fixture, root, foreign);
            assert(Read().CompletedUtcTicks == futureCutoff, "completion_never_moves_cutoff_backwards");

            foreach (var record in new[] { preparing, cancelled, stopping, Read() })
            {
                raw.SetValue("Lease", record.Encode());
                assert(Read().Encode() == record.Encode(), "phase_record_roundtrip_" + record.Phase);
            }
            var valid = preparing.Encode().Split('|');
            var invalidRecords = new List<string> { lease + "|0", lease + "|" + futureCutoff, preparing.Encode() + "|extra" };
            invalidRecords.Add("2|" + string.Join('|', valid.Skip(1).Take(7)));
            foreach (var (field, value) in new (int, string)[] {
                (0, "1"), (1, Guid.Empty.ToString("N")), (2, "unknown"), (2, "stopping"), (2, "completed"),
                (3, "-1"), (3, "3155378976000000000"), (4, "0"), (4, "202"), (4, "-1"),
                (5, "0"), (5, "-1"), (6, "0"), (6, "101"), (6, "2147483648"), (7, "0"),
                (7, "3155378976000000000") })
            {
                var fields = (string[])valid.Clone();
                fields[field] = value;
                invalidRecords.Add(string.Join('|', fields));
            }
            foreach (var record in invalidRecords)
            {
                raw.SetValue("Lease", record, RegistryValueKind.String);
                reject(() => InstallationGate.Read(fixture, key), "installation_gate_lease_invalid");
                reject(() => InstallationLease.BeginPreparing(fixture, root, lease, parent, parentStart.Ticks, owner, ownerStart.Ticks), "installation_gate_lease_invalid");
                assert((string)raw.GetValue("Lease")! == record, "invalid_record_not_repaired_silently");
            }
        }

        // Independent callers contend on the real writer mutex. Registry writes
        // remain below this run's unique HKCU fixture, never the product hive.
        var concurrentRoot = program + "-concurrent-" + Guid.NewGuid().ToString("N");
        using var start = new ManualResetEventSlim(false);
        var winners = new ConcurrentBag<string>();
        var losers = new ConcurrentBag<string>();
        var contenders = Enumerable.Range(0, 8).Select(_ => Task.Factory.StartNew(() =>
        {
            var candidate = Guid.NewGuid().ToString("N");
            start.Wait();
            try { InstallationLease.Begin(fixture, concurrentRoot, candidate); winners.Add(candidate); }
            catch (InvalidOperationException error) when (error.Message == "installation_gate_already_owned") { losers.Add(candidate); }
        }, CancellationToken.None, TaskCreationOptions.LongRunning, TaskScheduler.Default)).ToArray();
        start.Set();
        Task.WaitAll(contenders);
        assert(winners.Count == 1 && losers.Count == 7, "concurrent_acquisition_has_exactly_one_owner");
        var winner = winners.Single();
        assert(InstallationGate.Read(fixture, InstallationGate.KeyFor(concurrentRoot))!.Lease == winner, "concurrent_record_matches_only_winner");
        foreach (var loser in losers)
            assert(!InstallationLease.ReleaseOwned(fixture, concurrentRoot, loser), "losing_writer_cannot_release_winner");
        assert(InstallationLease.ReleaseOwned(fixture, concurrentRoot, winner), "concurrent_winner_releases");
    }
}
