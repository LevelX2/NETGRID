using System.Diagnostics;
using System.Linq.Expressions;
using System.Reflection;

internal static partial class RuntimePreparationTests
{
    private static async Task MsiChecks(Assembly assembly, Action<bool, string> assert)
    {
        var stateType = assembly.GetType("Netgrid.Windows.InstallationGate+GateState", true)!;
        var responder = assembly.GetType("Netgrid.Launcher.MsiPreparationResponder", true)!
            .GetMethod("RunAsync", BindingFlags.Static | BindingFlags.NonPublic)!;
        using var current = Process.GetCurrentProcess();
        foreach (var mode in new[] { "healthy", "blocked", "revoked", "stop-failure", "bad-response" })
        {
            await using var fixture = await Fixture.Create(assembly, mode == "stop-failure" ? "--update-stop-child-fails" : "--installation-stop-child");
            if (mode == "blocked") fixture.Handler.PostBody = "{\"ok\":true,\"updateAllowed\":false,\"activeMatchCount\":2}";
            if (mode == "bad-response") fixture.Handler.PostBody = "{}";
            if (mode == "revoked") fixture.Handler.PostRelease = new(TaskCreationOptions.RunContinuationsAsynchronously);
            var lease = Guid.NewGuid().ToString("N");
            var start = new ProcessStartInfo(Environment.ProcessPath!)
            {
                UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true
            };
            foreach (var value in new[] { "--msi-client-fixture", lease, current.Id.ToString(), current.StartTime.ToUniversalTime().Ticks.ToString() }) start.ArgumentList.Add(value);
            using var worker = Process.Start(start)!;
            try
            {
                var state = Activator.CreateInstance(stateType, [lease, "preparing-msi", 0L, current.Id,
                    current.StartTime.ToUniversalTime().Ticks, worker.Id, worker.StartTime.ToUniversalTime().Ticks, lease, Guid.NewGuid().ToString("B").ToUpperInvariant()])!;
                var valid = true;
                Func<object?> reader = () => valid ? state : null;
                var typedReader = Expression.Lambda(typeof(Func<>).MakeGenericType(stateType),
                    Expression.Convert(Expression.Invoke(Expression.Constant(reader)), stateType)).Compile();
                var response = (Task)responder.Invoke(null, [fixture.Runtime, state, typedReader, fixture.Client, CancellationToken.None])!;
                if (mode == "revoked")
                {
                    await fixture.Handler.PostSeen.Task.WaitAsync(TimeSpan.FromSeconds(10));
                    valid = false;
                    fixture.Handler.PostRelease!.SetResult();
                }
                if (mode is "healthy" or "blocked") await response.WaitAsync(TimeSpan.FromSeconds(15));
                else
                {
                    var failed = false;
                    try { await response.WaitAsync(TimeSpan.FromSeconds(15)); }
                    catch (Exception error) when (error is InvalidOperationException or InvalidDataException) { failed = true; }
                    catch (AggregateException error) when (mode == "stop-failure" && error.Message.StartsWith("launcher_runtime_stop_failed", StringComparison.Ordinal)) { failed = true; }
                    assert(failed, "msi_responder_rejects_" + mode);
                }
                await worker.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(10));
                assert((await worker.StandardOutput.ReadToEndAsync()).Trim() == (mode == "healthy" ? "PROCEED" : mode == "blocked" ? "CANCEL" : "REJECTED"), "msi_peer_observed_" + mode);
                var terminal = mode is "healthy" or "stop-failure";
                assert(fixture.ServerObserver.HasExited == terminal && fixture.WebObserver.HasExited == terminal, "msi_runtime_ownership_" + mode);
                assert((bool)fixture.Runtime.GetType().GetProperty("IsTerminallyStopping")!.GetValue(fixture.Runtime)! == terminal, "msi_terminality_" + mode);
                assert(fixture.Handler.Methods.SequenceEqual(terminal ? new[] { "POST" } : new[] { "POST", "DELETE" }), "msi_existing_admission_owner_" + mode);
                if (!terminal) await fixture.CallRuntime("StartAsync");
            }
            finally { if (!worker.HasExited) { worker.Kill(); await worker.WaitForExitAsync(); } }
        }
    }
}

internal static class MsiPeerFixture
{
    internal static async Task<bool> TryChildAsync(string[] args)
    {
        if (args is not ["--msi-client-fixture", var lease, var pid, var started]) return false;
        var type = Assembly.Load("NETGRID").GetType("Netgrid.Windows.UpdateHandoff", true)!;
        using var parent = (Process)type.GetMethod("OpenParent")!.Invoke(null, [int.Parse(pid), long.Parse(started), Environment.ProcessPath!])!;
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(20));
        try
        {
            var connecting = (Task)type.GetMethod("ConnectAsync")!.Invoke(null, [lease, parent, timeout.Token])!;
            await connecting;
            using var peer = (IDisposable)connecting.GetType().GetProperty("Result")!.GetValue(connecting)!;
            var decision = (Task<bool>)peer.GetType().GetMethod("ReceiveDecisionAsync")!.Invoke(peer, [timeout.Token])!;
            Console.WriteLine(await decision ? "PROCEED" : "CANCEL");
        }
        catch (IOException) { Console.WriteLine("REJECTED"); }
        return true;
    }
}
