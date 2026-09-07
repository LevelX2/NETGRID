using System.Diagnostics;
using System.Net;
using System.Reflection;

internal static partial class RuntimePreparationTests
{
    public static async Task<int> Run(Assembly assembly)
    {
        var checks = 0;
        void Assert(bool value, string name)
        {
            if (!value) throw new Exception("runtime_preparation_test_failed:" + name);
            checks++;
        }
        async Task Reject(Task task, string code)
        {
            try { await task; throw new Exception("runtime_preparation_test_failed:accepted_" + code); }
            catch (Exception error) when (error.Message.StartsWith(code, StringComparison.Ordinal)) { checks++; }
        }
        await using (var fixture = await Fixture.Create(assembly))
        {
            fixture.Handler.PostRelease = new(TaskCreationOptions.RunContinuationsAsynchronously);
            var preparing = fixture.Prepare();
            await fixture.Handler.PostSeen.Task.WaitAsync(TimeSpan.FromSeconds(3));
            Assert(fixture.Lock.CurrentCount == 0, "post_owns_existing_lifecycle_lock");
            var start = fixture.CallRuntime("StartAsync");
            Assert(!start.IsCompleted, "start_queued_during_post");
            fixture.Handler.PostRelease.SetResult();
            var prepared = await preparing;
            Assert(fixture.Lock.CurrentCount == 0 && !start.IsCompleted, "successful_prepare_retains_lock");
            fixture.Handler.DeleteRelease = new(TaskCreationOptions.RunContinuationsAsynchronously);
            var cancelling = Call(prepared, "CancelAsync");
            await fixture.Handler.DeleteSeen.Task.WaitAsync(TimeSpan.FromSeconds(3));
            Assert(!start.IsCompleted, "cancel_does_not_release_before_ack");
            await Reject(Call(prepared, "StopAsync"), "launcher_update_preparation_phase_invalid");
            fixture.Handler.DeleteRelease.SetResult();
            await cancelling;
            await start.WaitAsync(TimeSpan.FromSeconds(3));
            Assert(!fixture.ServerObserver.HasExited && !fixture.WebObserver.HasExited, "acknowledged_cancel_preserves_runtime");
            Assert(fixture.Handler.Methods.SequenceEqual(new[] { "POST", "DELETE" }), "same_attempt_is_explicitly_cancelled");
            await ((IAsyncDisposable)prepared).DisposeAsync();
            Assert(fixture.Lock.CurrentCount == 1, "dispose_after_cancel_does_not_release_twice");
        }

        await using (var fixture = await Fixture.Create(assembly))
        {
            var prepared = await fixture.Prepare();
            var start = fixture.CallRuntime("StartAsync");
            await Call(prepared, "StopAsync");
            await Reject(start, "launcher_installation_stopping");
            Assert((bool)prepared.GetType().GetProperty("Stopped")!.GetValue(prepared)!, "verified_stop_marks_handoff_ready");
            Assert(fixture.ServerObserver.HasExited && fixture.ServerObserver.ExitCode == 0 && fixture.WebObserver.HasExited, "update_stop_proves_both_exits_and_server_success");
            Assert(fixture.Handler.Methods.SequenceEqual(new[] { "POST" }), "completed_stop_does_not_cancel_dead_server");
            await ((IAsyncDisposable)prepared).DisposeAsync();
            await Reject(Call(prepared, "CancelAsync"), "launcher_update_preparation_phase_invalid");
        }

        await using (var fixture = await Fixture.Create(assembly))
        {
            fixture.Handler.PostBody = "{\"ok\":true,\"updateAllowed\":false,\"activeMatchCount\":2}";
            var prepared = await fixture.Prepare();
            await Reject(Call(prepared, "StopAsync"), "launcher_update_not_prepared");
            Assert(!fixture.ServerObserver.HasExited && !fixture.WebObserver.HasExited, "active_games_prevent_stop");
            await ((IAsyncDisposable)prepared).DisposeAsync();
            Assert(fixture.Lock.CurrentCount == 1, "blocked_attempt_disposal_quittiert_cancel");
        }

        foreach (var badPost in new[] { false, true })
        {
            await using var fixture = await Fixture.Create(assembly);
            if (badPost) fixture.Handler.PostBody = "not json";
            fixture.Handler.DeleteBody = "{\"ok\":false}";
            if (badPost) await Reject(fixture.Prepare(), "launcher_update_preparation_unresolved");
            else
            {
                var prepared = await fixture.Prepare();
                await Reject(Call(prepared, "CancelAsync"), "update_preparation_response_invalid");
                await ((IAsyncDisposable)prepared).DisposeAsync();
            }
            Assert(fixture.ServerObserver.HasExited && fixture.WebObserver.HasExited, "lost_cancel_ack_does_not_leave_normal_runtime");
            await Reject(fixture.CallRuntime("StartAsync"), "launcher_installation_stopping");
            Assert(fixture.Lock.CurrentCount == 1, "failed_cancel_releases_lock_but_retains_terminal_guard");
        }

        await using (var fixture = await Fixture.Create(assembly))
        {
            fixture.Handler.PostBody = "not json";
            await Reject(fixture.Prepare(), "update_preparation_response_invalid");
            Assert(fixture.Handler.Methods.SequenceEqual(new[] { "POST", "DELETE" }), "lost_prepare_response_is_cancelled_with_same_nonce");
            await fixture.CallRuntime("StartAsync");
            Assert(!fixture.ServerObserver.HasExited, "verified_retraction_allows_existing_runtime");
        }

        foreach (var mode in new[] { "--update-stop-child-fails", "--update-stop-child-ignore" })
        {
            await using var fixture = await Fixture.Create(assembly, mode);
            var prepared = await fixture.Prepare();
            if (mode.EndsWith("ignore", StringComparison.Ordinal)) fixture.Server.StandardInput.Dispose();
            await Reject(Call(prepared, "StopAsync"), "launcher_runtime_stop_failed");
            Assert(!(bool)prepared.GetType().GetProperty("Stopped")!.GetValue(prepared)!, "failed_shutdown_never_authorizes_handoff");
            Assert(fixture.WebObserver.HasExited, "strict_server_failure_still_stops_web");
            Assert(mode.EndsWith("ignore", StringComparison.Ordinal) ? !fixture.ServerObserver.HasExited : fixture.ServerObserver.ExitCode == 7,
                "strict_stop_does_not_hide_server_failure_with_kill");
            await Reject(fixture.CallRuntime("StartAsync"), "launcher_installation_stopping");
            await ((IAsyncDisposable)prepared).DisposeAsync();
        }
        await using (var fixture = await Fixture.Create(assembly))
        {
            var prepared = await fixture.Prepare();
            await fixture.Server.StandardInput.WriteLineAsync("shutdown");
            await fixture.Server.StandardInput.FlushAsync();
            await fixture.ServerObserver.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(3));
            await Reject(Call(prepared, "StopAsync"), "launcher_runtime_stop_failed");
            Assert(!(bool)prepared.GetType().GetProperty("Stopped")!.GetValue(prepared)!, "even_exit_zero_before_owned_stop_is_not_handoff_proof");
            await ((IAsyncDisposable)prepared).DisposeAsync();
        }
        foreach (var mode in new[] { "--installation-stop-child", "--update-stop-child-fails", "--update-stop-child-ignore" })
        {
            await using var fixture = await Fixture.Create(assembly, mode);
            if (mode.EndsWith("ignore", StringComparison.Ordinal)) fixture.Server.StandardInput.Dispose();
            if (mode == "--installation-stop-child")
            {
                await fixture.CallRuntime("StopForVerificationAsync");
                Assert(fixture.ServerObserver.HasExited && fixture.ServerObserver.ExitCode == 0, "verification_requires_graceful_exit_zero");
            }
            else
            {
                await Reject(fixture.CallRuntime("StopForVerificationAsync"), "launcher_runtime_stop_failed");
                Assert(mode.EndsWith("ignore", StringComparison.Ordinal) ? !fixture.ServerObserver.HasExited : fixture.ServerObserver.ExitCode == 7,
                    "verification_stop_does_not_convert_failed_flush_to_success");
            }
            Assert(fixture.WebObserver.HasExited, "verification_stop_tracks_web_exit");
            Assert(fixture.Handler.Methods.Count == 0, "verification_does_not_acquire_second_server_preparation");
            await Reject(fixture.CallRuntime("StartAsync"), "launcher_installation_stopping");
        }
        await TransferChecks(assembly, Assert, Reject);
        await MsiChecks(assembly, Assert);
        return checks;
    }

    private static async Task Call(object owner, string method) =>
        await ((Task)owner.GetType().GetMethod(method)!.Invoke(owner, null)!).WaitAsync(TimeSpan.FromSeconds(15));

    private sealed class Fixture : IAsyncDisposable
    {
        private const BindingFlags Private = BindingFlags.NonPublic | BindingFlags.Instance;
        public required object Runtime;
        public required object Client;
        public required Handler Handler;
        public required Process Server;
        public required Process ServerObserver;
        public required Process WebObserver;
        private Task? _preparing;
        public SemaphoreSlim Lock => (SemaphoreSlim)Runtime.GetType().GetField("_lifecycle", Private)!.GetValue(Runtime)!;

        public static async Task<Fixture> Create(Assembly assembly, string serverMode = "--installation-stop-child")
        {
            var environment = Activator.CreateInstance(assembly.GetType("Netgrid.Launcher.RuntimeEnvironment", true)!, Private, null,
                [new Dictionary<string, string> {
                    ["NETGRID_SERVER_BASE_URL"] = "http://127.0.0.1:1",
                    ["NETGRID_WEB_BASE_URL"] = "http://127.0.0.1:2",
                }], null)!;
            var runtime = Activator.CreateInstance(assembly.GetType("Netgrid.Launcher.LauncherRuntime", true)!, Private, null,
                [Path.Combine(Path.GetTempPath(), "NETGRID-inert-update-owner-fixture"), environment, (Func<bool>)(() => false)], null)!;
            var handler = new Handler();
            var client = Activator.CreateInstance(assembly.GetType("Netgrid.Launcher.UpdatePreparationClient", true)!, Private, null,
                [new HttpClient(handler), new Uri("http://127.0.0.1:1"), "synthetic-control", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"], null)!;
            var children = new List<Process>();
            var observers = new List<Process>();
            try
            {
                foreach (var (field, mode) in new[] { ("_server", serverMode), ("_web", "--installation-stop-child") })
                {
                    var executable = Environment.ProcessPath!;
                    if (Path.GetFileNameWithoutExtension(executable) != "Netgrid.Launcher.Tests") throw new Exception("update_owner_fixture_host_invalid");
                    var process = Process.Start(new ProcessStartInfo(executable) {
                        Arguments = mode, UseShellExecute = false, CreateNoWindow = true,
                        RedirectStandardInput = true, RedirectStandardOutput = true,
                    })!;
                    children.Add(process);
                    var observer = Process.GetProcessById(process.Id);
                    _ = observer.Handle;
                    observers.Add(observer);
                    runtime.GetType().GetField(field, Private)!.SetValue(runtime, process);
                    if (await process.StandardOutput.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(10)) != "READY") throw new Exception("update_owner_fixture_not_ready");
                }
                return new Fixture { Runtime = runtime, Client = client, Handler = handler,
                    Server = children[0], ServerObserver = observers[0], WebObserver = observers[1] };
            }
            catch
            {
                foreach (var observer in observers)
                {
                    if (!observer.HasExited) { observer.Kill(); await observer.WaitForExitAsync(); }
                    observer.Dispose();
                }
                await ((IAsyncDisposable)runtime).DisposeAsync();
                ((IDisposable)client).Dispose();
                throw;
            }
        }

        public async Task<object> Prepare()
        {
            var task = (Task)Runtime.GetType().GetMethod("PrepareUpdateAsync", Private)!.Invoke(Runtime, [Client])!;
            _preparing = task;
            await task.WaitAsync(TimeSpan.FromSeconds(15));
            return task.GetType().GetProperty("Result")!.GetValue(task)!;
        }
        public Task CallRuntime(string method) => Call(Runtime, method);
        public async ValueTask DisposeAsync()
        {
            // These observer handles were captured from this fixture's own
            // Process.Start results. No PID rediscovery or foreign kill occurs.
            Handler.PostRelease?.TrySetResult();
            Handler.DeleteRelease?.TrySetResult();
            try
            {
                if (_preparing is { } pending)
                {
                    // Release any deliberately held HTTP response and resolve
                    // a returned scope before disposing its runtime owner.
                    // Expected failed attempts already performed their cleanup.
                    await Task.WhenAny(pending, Task.Delay(TimeSpan.FromSeconds(15)));
                    if (!pending.IsCompleted) throw new Exception("update_owner_fixture_cleanup_prepare_timeout");
                    if (pending.IsCompletedSuccessfully)
                        await ((IAsyncDisposable)pending.GetType().GetProperty("Result")!.GetValue(pending)!).DisposeAsync();
                }
                await ((IAsyncDisposable)Runtime).DisposeAsync();
            }
            finally
            {
                foreach (var observer in new[] { ServerObserver, WebObserver })
                {
                    if (!observer.HasExited) { observer.Kill(); await observer.WaitForExitAsync(); }
                    observer.Dispose();
                }
                ((IDisposable)Client).Dispose();
            }
        }
    }

    private sealed class Handler : HttpMessageHandler
    {
        public string PostBody = "{\"ok\":true,\"updateAllowed\":true,\"activeMatchCount\":0}";
        public string DeleteBody = "{\"ok\":true}";
        public TaskCompletionSource? PostRelease, DeleteRelease;
        public TaskCompletionSource PostSeen = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public TaskCompletionSource DeleteSeen = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public List<string> Methods = [];
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (request.Headers.GetValues("x-netgrid-update-owner").Single() != "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" ||
                request.Headers.GetValues("x-netgrid-launcher-control").Single() != "synthetic-control" || request.RequestUri!.Host != "127.0.0.1")
                throw new Exception("update_owner_fixture_request_invalid");
            Methods.Add(request.Method.Method);
            var post = request.Method == HttpMethod.Post;
            (post ? PostSeen : DeleteSeen).TrySetResult();
            if ((post ? PostRelease : DeleteRelease) is { } release) await release.Task.WaitAsync(cancellationToken);
            return new(HttpStatusCode.OK) { Content = new StringContent(post ? PostBody : DeleteBody) };
        }
    }
}
