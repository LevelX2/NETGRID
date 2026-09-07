using System.Buffers.Binary;
using System.Diagnostics;
using System.Globalization;
using System.IO.Pipes;
using System.Security.AccessControl;
using System.Security.Principal;
using Netgrid.Windows;

if (await VerificationTests.TryChildAsync(args)) return;
if (await SessionTests.TryChildAsync(args)) return;

if (args is ["--peer-child", var childSession, var parentId, var parentStart])
{
    try
    {
        using var parent = UpdateHandoff.OpenParent(int.Parse(parentId, CultureInfo.InvariantCulture),
            long.Parse(parentStart, CultureInfo.InvariantCulture), Environment.ProcessPath!);
        using var limit = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        using var endpoint = await UpdateHandoff.ConnectAsync(childSession, parent, limit.Token);
        var proceed = await endpoint.ReceiveDecisionAsync(limit.Token);
        Console.WriteLine(proceed ? "PROCEED" : "CANCEL");
    }
    catch (Exception error) when (error is IOException or InvalidOperationException or OperationCanceledException)
    {
        Console.WriteLine("REJECTED");
        Environment.ExitCode = 2;
    }
    return;
}

var checks = 0;
using var deadline = new CancellationTokenSource(TimeSpan.FromSeconds(30));
var cancellation = deadline.Token;
using var current = Process.GetCurrentProcess();
foreach (var session in new[] { "", "../escape", new string('0', 32), Guid.NewGuid().ToString("D"), new string('A', 32) })
    Reject(() => UpdateHandoff.PipeName(session), "invalid_session");
foreach (var frame in Enum.GetValues<UpdateHandoff.Frame>())
    Assert(UpdateHandoff.Decode(UpdateHandoff.Encode(frame)) == frame, "frame_roundtrip");
Reject(() => UpdateHandoff.Decode(new byte[UpdateHandoff.FrameSize]), "bad_magic");
Reject(() => UpdateHandoff.Decode(new byte[UpdateHandoff.FrameSize + 1]), "bad_size");
Reject(() => UpdateHandoff.Encode((UpdateHandoff.Frame)6), "bad_kind");
var badVersion = UpdateHandoff.Encode(UpdateHandoff.Frame.Ready);
BinaryPrimitives.WriteInt32LittleEndian(badVersion.AsSpan(4), 2);
Reject(() => UpdateHandoff.Decode(badVersion), "bad_version");
var badKind = UpdateHandoff.Encode(UpdateHandoff.Frame.Ready);
BinaryPrimitives.WriteInt32LittleEndian(badKind.AsSpan(8), 100);
Reject(() => UpdateHandoff.Decode(badKind), "unknown_kind");

using (var bound = UpdateHandoff.OpenParent(current.Id, current.StartTime.ToUniversalTime().Ticks, Environment.ProcessPath!))
    Assert(bound.Id == current.Id && !bound.HasExited, "parent_handle_bound");
Reject(() => UpdateHandoff.OpenParent(current.Id, current.StartTime.ToUniversalTime().Ticks + 1, Environment.ProcessPath!), "wrong_parent_start");
Reject(() => UpdateHandoff.OpenParent(current.Id, current.StartTime.ToUniversalTime().Ticks,
    Path.Combine(Path.GetDirectoryName(Environment.ProcessPath!)!, "not-the-parent.exe")), "wrong_parent_image");
Reject(() => UpdateHandoff.OpenParent(0, 1, Environment.ProcessPath!), "invalid_parent_pid");

foreach (var variant in new[] { "proceed", "cancel", "wrong-peer" })
{
    var session = Guid.NewGuid().ToString("N");
    using var server = UpdateHandoff.CreateServer(session);
    var start = new ProcessStartInfo(Environment.ProcessPath!)
    {
        UseShellExecute = false, CreateNoWindow = true,
        RedirectStandardOutput = true, RedirectStandardError = true,
    };
    start.ArgumentList.Add("--peer-child");
    start.ArgumentList.Add(session);
    start.ArgumentList.Add(current.Id.ToString(CultureInfo.InvariantCulture));
    start.ArgumentList.Add(current.StartTime.ToUniversalTime().Ticks.ToString(CultureInfo.InvariantCulture));
    using var child = Process.Start(start) ?? throw new Exception("owned_peer_fixture_start_failed");
    try
    {
        if (variant == "wrong-peer")
        {
            // Actual client is this specific child; substituting the parent
            // as the expected peer must fail before any decision is sent.
            await RejectAsync(async () => { using var unexpected = await UpdateHandoff.AcceptAsync(server, current, cancellation); }, "wrong_live_peer");
            server.Dispose();
        }
        else
        {
            using var sender = await UpdateHandoff.AcceptAsync(server, child, cancellation);
            await sender.SendDecisionAsync(variant == "proceed", cancellation);
        }
        await child.WaitForExitAsync(cancellation);
        var output = (await child.StandardOutput.ReadToEndAsync(cancellation)).Trim();
        Assert(child.ExitCode == (variant == "wrong-peer" ? 2 : 0), "owned_child_exit_code");
        Assert(output == (variant == "proceed" ? "PROCEED" : variant == "cancel" ? "CANCEL" : "REJECTED"), "cross_process_decision");
    }
    finally
    {
        // Only the exact process handle returned by our own fixture start.
        if (!child.HasExited) { child.Kill(); await child.WaitForExitAsync(); }
    }
}

foreach (var proceed in new[] { true, false })
{
    var session = Guid.NewGuid().ToString("N");
    using var server = UpdateHandoff.CreateServer(session);
    var security = server.GetAccessControl();
    var rules = security.GetAccessRules(true, false, typeof(SecurityIdentifier)).Cast<PipeAccessRule>().ToArray();
    Assert(security.AreAccessRulesProtected, "protected_dacl");
    Assert(rules.Any(rule => rule.IdentityReference.Value == "S-1-5-2" && rule.AccessControlType == AccessControlType.Deny), "network_denied");
    Assert(rules.Any(rule => rule.IdentityReference.Value == "S-1-5-32-544" && rule.AccessControlType == AccessControlType.Allow), "explicit_admin_supported");
    Assert(!rules.Any(rule => rule.IdentityReference.Value == "S-1-1-0" && rule.AccessControlType == AccessControlType.Allow), "no_world_access");
    Reject(() => { using var duplicate = UpdateHandoff.CreateServer(session); }, "first_pipe_instance");
    var accepted = UpdateHandoff.AcceptAsync(server, current, cancellation);
    using var client = await UpdateHandoff.ConnectAsync(session, current, cancellation);
    using var sender = await accepted;
    var receiving = client.ReceiveDecisionAsync(cancellation);
    await sender.SendDecisionAsync(proceed, cancellation);
    Assert(await receiving == proceed, "acknowledged_exact_decision");
    Assert(sender.ProceedMayHaveBeenDelivered == proceed, "dispatch_state_distinguishes_cancel");
    await RejectAsync(() => sender.SendDecisionAsync(proceed, cancellation), "duplicate_send");
    await RejectAsync(async () => { await client.ReceiveDecisionAsync(cancellation); }, "duplicate_receive");
}

// Fixed frames may arrive fragmented; peer identity is checked by the kernel,
// not inferred from a pipe name. No installed process or elevation is used.
{
    var session = Guid.NewGuid().ToString("N");
    using var server = UpdateHandoff.CreateServer(session);
    var accepted = UpdateHandoff.AcceptAsync(server, current, cancellation);
    using var raw = new NamedPipeClientStream(".", UpdateHandoff.PipeName(session), PipeDirection.InOut,
        PipeOptions.Asynchronous, TokenImpersonationLevel.Anonymous);
    await raw.ConnectAsync(cancellation);
    using var sender = await accepted;
    var sending = sender.SendDecisionAsync(true, cancellation);
    var ready = UpdateHandoff.Encode(UpdateHandoff.Frame.Ready);
    await raw.WriteAsync(ready.AsMemory(0, 3), cancellation);
    await raw.WriteAsync(ready.AsMemory(3), cancellation);
    var decision = new byte[UpdateHandoff.FrameSize];
    await raw.ReadExactlyAsync(decision, cancellation);
    Assert(UpdateHandoff.Decode(decision) == UpdateHandoff.Frame.Proceed, "fragmented_ready");
    await raw.WriteAsync(UpdateHandoff.Encode(UpdateHandoff.Frame.AckCancel), cancellation);
    await RejectAsync(() => sending, "wrong_acknowledgement");
    Assert(sender.ProceedMayHaveBeenDelivered, "ack_failure_does_not_undo_possible_dispatch");
}
{
    var session = Guid.NewGuid().ToString("N");
    using var server = UpdateHandoff.CreateServer(session);
    var connected = server.WaitForConnectionAsync(cancellation);
    using var client = await UpdateHandoff.ConnectAsync(session, current, cancellation);
    await connected;
    var receive = client.ReceiveDecisionAsync(cancellation);
    var ready = new byte[UpdateHandoff.FrameSize];
    await server.ReadExactlyAsync(ready, cancellation);
    server.Dispose();
    await RejectAsync(async () => { await receive; }, "eof_is_not_permission");
}
{
    var session = Guid.NewGuid().ToString("N");
    using var server = UpdateHandoff.CreateServer(session);
    var connected = server.WaitForConnectionAsync(cancellation);
    using var client = await UpdateHandoff.ConnectAsync(session, current, cancellation);
    await connected;
    using var shortDeadline = new CancellationTokenSource(TimeSpan.FromMilliseconds(50));
    await RejectAsync(async () => { await client.ReceiveDecisionAsync(shortDeadline.Token); }, "timeout_is_not_permission");
}
Console.WriteLine($"UPDATE_HANDOFF_TESTS_OK checks={checks} nativePipes=true elevation=false installationStarted=false");
await VerificationTests.RunAsync();
await SessionTests.RunAsync();
RequestTests.Run();

void Assert(bool value, string name)
{
    if (!value) throw new Exception("update_handoff_test_failed:" + name);
    checks++;
}
void Reject(Action action, string name)
{
    try { action(); }
    catch (Exception error) when (error is InvalidDataException or IOException or InvalidOperationException or UnauthorizedAccessException)
    { checks++; return; }
    throw new Exception("update_handoff_expected_rejection_missing:" + name);
}
async Task RejectAsync(Func<Task> action, string name)
{
    try { await action(); }
    catch (Exception error) when (error is InvalidDataException or IOException or InvalidOperationException or OperationCanceledException)
    { checks++; return; }
    throw new Exception("update_handoff_expected_rejection_missing:" + name);
}
