using System.Diagnostics;
using System.Globalization;
using System.IO.Pipes;
using System.Reflection;
using Microsoft.Win32;

internal static partial class RuntimePreparationTests
{
    private static async Task TransferChecks(Assembly assembly, Action<bool, string> assert, Func<Task, string, Task> reject)
    {
        foreach (var mode in new[] { "healthy", "blocked", "cancel-unreleased", "stop-failure", "ack-lost", "bad-binding", "early-exit" })
        {
            var path = TransferPeerFixture.Prefix + Guid.NewGuid().ToString("N");
            try
            {
                using var registry = Registry.CurrentUser.CreateSubKey(path, writable: true);
                await using var fixture = await Fixture.Create(assembly, mode == "stop-failure" ? "--update-stop-child-fails" : "--installation-stop-child");
                if (mode is "blocked" or "cancel-unreleased") fixture.Handler.PostBody = "{\"ok\":true,\"updateAllowed\":false,\"activeMatchCount\":1}";
                var root = (string)fixture.Runtime.GetType().GetProperty("ProgramRoot")!.GetValue(fixture.Runtime)!;
                var lease = Guid.NewGuid().ToString("N");
                var session = Guid.NewGuid().ToString("N");
                using var current = Process.GetCurrentProcess();
                var time = current.StartTime.ToUniversalTime().Ticks;
                var request = Activator.CreateInstance(assembly.GetType("Netgrid.Windows.UpdateRequest", true)!,
                    [current.Id, time, Path.Combine(root, "setup.exe"), new string('a', 64), root, Path.Combine(root, "runtime.env"), lease, session, true])!;
                using var pipe = (NamedPipeServerStream)assembly.GetType("Netgrid.Windows.UpdateHandoff", true)!.GetMethod("CreateServer")!.Invoke(null, [session])!;
                var start = new ProcessStartInfo(Environment.ProcessPath!) { UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true };
                foreach (var arg in new[] { "--transfer-peer", path, mode, root, lease, session, current.Id.ToString(CultureInfo.InvariantCulture), time.ToString(CultureInfo.InvariantCulture) }) start.ArgumentList.Add(arg);
                using var worker = Process.Start(start)!;
                _ = worker.Handle;
                try
                {
                    var transfer = (Task<int?>)assembly.GetType("Netgrid.Launcher.UpdateTransfer", true)!
                        .GetMethod("TransferAsync", BindingFlags.NonPublic | BindingFlags.Static)!
                        .Invoke(null, [fixture.Runtime, request, worker, pipe, registry, fixture.Client])!;
                    if (mode == "healthy") assert(await transfer.WaitAsync(TimeSpan.FromSeconds(15)) == 0, "transfer_proceeds_after_owned_stop");
                    else if (mode == "blocked") assert(await transfer.WaitAsync(TimeSpan.FromSeconds(15)) == 1, "transfer_reports_exact_active_count");
                    else if (mode == "ack-lost")
                    {
                        try { await transfer.WaitAsync(TimeSpan.FromSeconds(15)); throw new Exception("transfer_ack_loss_accepted"); }
                        catch (IOException) { assert(true, "transfer_ack_loss_reported"); }
                    }
                    else await reject(transfer, mode == "stop-failure" ? "launcher_runtime_stop_failed" : mode == "bad-binding" ? "updater_preparation_binding_invalid" : mode == "early-exit" ? "updater_handoff_worker_exited" : "updater_cancel_unresolved");
                    await worker.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(10));
                    var terminal = (bool)fixture.Runtime.GetType().GetProperty("IsTerminallyStopping")!.GetValue(fixture.Runtime)!;
                    assert(terminal == (mode is "healthy" or "stop-failure" or "ack-lost"), "terminal_transfer_state_" + mode);
                    assert(fixture.WebObserver.HasExited == terminal, "transfer_web_ownership_" + mode);
                    assert(fixture.ServerObserver.HasExited == terminal, "transfer_server_ownership_" + mode);
                    var outcome = registry.GetValue("Outcome") as string;
                    assert(outcome == (mode is "healthy" or "ack-lost" ? "proceed" : mode is "blocked" or "cancel-unreleased" ? "cancel" : "rejected"),
                        "only_successful_stop_can_send_proceed_" + mode);
                    assert(fixture.Handler.Methods.SequenceEqual(mode is "blocked" or "cancel-unreleased" ? new[] { "POST", "DELETE" } : mode is "bad-binding" or "early-exit" ? Array.Empty<string>() : new[] { "POST" }),
                        "actual_transfer_preparation_order_" + mode);
                }
                finally { if (!worker.HasExited) { worker.Kill(); await worker.WaitForExitAsync(); } }
            }
            finally { Registry.CurrentUser.DeleteSubKeyTree(path, throwOnMissingSubKey: false); }
        }
    }
}

internal static class TransferPeerFixture
{
    internal const string Prefix = @"Software\NETGRID-Transfer-Tests\";
    internal static async Task<bool> TryChildAsync(string[] args)
    {
        if (args is not ["--transfer-peer", var path, var mode, var root, var lease, var session, var parentId, var parentTime]) return false;
        if (!path.StartsWith(Prefix, StringComparison.Ordinal) || !Guid.TryParseExact(path[Prefix.Length..], "N", out _)) throw new Exception("transfer_fixture_scope_invalid");
        var assembly = Assembly.Load("NETGRID");
        var handoff = assembly.GetType("Netgrid.Windows.UpdateHandoff", true)!;
        using var registry = Registry.CurrentUser.OpenSubKey(path, writable: true)!;
        if (mode == "early-exit") { registry.SetValue("Outcome", "rejected"); return true; }
        var keyPath = (string)assembly.GetType("Netgrid.Windows.InstallationGate", true)!.GetMethod("KeyFor")!.Invoke(null, [root])!;
        using var key = registry.CreateSubKey(keyPath, writable: true);
        using var current = Process.GetCurrentProcess();
        var ownerStart = current.StartTime.ToUniversalTime().Ticks + (mode == "bad-binding" ? 1 : 0);
        key.SetValue("Lease", $"3|{lease}|preparing|0|{parentId}|{parentTime}|{current.Id}|{ownerStart}||");
        key.Flush();
        using var parent = (Process)handoff.GetMethod("OpenParent")!.Invoke(null, [int.Parse(parentId), long.Parse(parentTime), Environment.ProcessPath!])!;
        using var limit = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        try
        {
            if (mode == "ack-lost")
            {
                var name = (string)handoff.GetMethod("PipeName")!.Invoke(null, [session])!;
                using var raw = new NamedPipeClientStream(".", name, PipeDirection.InOut, PipeOptions.Asynchronous);
                await raw.ConnectAsync(limit.Token);
                var frame = new byte[12];
                System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(frame, 0x4E475548);
                System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(frame.AsSpan(4), 1);
                System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(frame.AsSpan(8), 1);
                await raw.WriteAsync(frame, limit.Token);
                await raw.ReadExactlyAsync(frame, limit.Token);
                if (System.Buffers.Binary.BinaryPrimitives.ReadInt32LittleEndian(frame.AsSpan(8)) != 2) throw new Exception("transfer_fixture_proceed_missing");
                registry.SetValue("Outcome", "proceed");
                return true; // Deliberately close without acknowledging.
            }
            var connecting = (Task)handoff.GetMethod("ConnectAsync")!.Invoke(null, [session, parent, limit.Token])!;
            await connecting;
            using var peer = (IDisposable)connecting.GetType().GetProperty("Result")!.GetValue(connecting)!;
            var proceed = await (Task<bool>)peer.GetType().GetMethod("ReceiveDecisionAsync")!.Invoke(peer, [limit.Token])!;
            registry.SetValue("Outcome", proceed ? "proceed" : "cancel");
            if (!proceed && mode != "cancel-unreleased")
            {
                key.SetValue("Lease", $"3|{lease}|completed|{DateTime.UtcNow.Ticks}|{parentId}|{parentTime}|0|0||");
                key.Flush();
            }
        }
        catch (Exception error) when (error is IOException or OperationCanceledException)
        {
            registry.SetValue("Outcome", "rejected");
        }
        return true;
    }
}
