using System.Reflection;

internal static class HeadlessVerificationTests
{
    internal static async Task<int> Run(Assembly assembly)
    {
        var owner = assembly.GetType("Netgrid.Launcher.HeadlessVerification", true)!;
        var execute = owner.GetMethod("ExecuteAsync", BindingFlags.Static | BindingFlags.NonPublic)!;
        var checks = 0;
        void Assert(bool value, string name) { if (!value) throw new Exception("headless_verification_test_failed:" + name); checks++; }
        async Task<(int Exit, string Output)> Run(Func<Action<string>, Task> operation, Func<ValueTask> cleanup)
        {
            using var output = new StringWriter();
            var exit = await (Task<int>)execute.Invoke(null, [operation, cleanup, output])!;
            return (exit, output.ToString());
        }
        var cleaned = 0;
        var success = await Run(_ => Task.CompletedTask, () => { cleaned++; return ValueTask.CompletedTask; });
        Assert(success.Exit == 0 && success.Output == "" && cleaned == 1, "success_requires_cleanup_and_has_no_error_record");
        const string secret = "private-credential-and-user-path-do-not-log";
        var serverFailure = new AggregateException(secret,
            new InvalidOperationException("launcher_child_stop_failed:server", new TaskCanceledException(secret)));
        foreach (var cleanupFails in new[] { false, true })
        {
            var failed = await Run(stage => { stage("stop"); throw serverFailure; },
                () => cleanupFails ? ValueTask.FromException(new IOException(secret)) : ValueTask.CompletedTask);
            Assert(failed.Exit == 2, "failed_verification_stays_failed");
            Assert(failed.Output == $"NETGRID_VERIFICATION_ERROR stage=stop code=server_timeout cleanup={(cleanupFails ? "failed" : "ok")}{Environment.NewLine}", "primary_timeout_survives_cleanup");
            Assert(!failed.Output.Contains(secret, StringComparison.Ordinal), "no_arbitrary_exception_text");
        }
        var cleanupOnly = await Run(_ => Task.CompletedTask, () => ValueTask.FromException(new IOException(secret)));
        Assert(cleanupOnly.Exit == 2 && cleanupOnly.Output.Contains("stage=cleanup code=io cleanup=failed", StringComparison.Ordinal), "cleanup_failure_prevents_success");
        foreach (var stage in new[] { "permit", "load", "start", "stop", "recheck" })
        {
            var failed = await Run(setStage => { setStage(stage); throw new InvalidOperationException(secret); }, () => ValueTask.CompletedTask);
            Assert(failed.Exit == 2 && failed.Output.Contains($"stage={stage} code=invalid_state", StringComparison.Ordinal), "phase_is_retained_" + stage);
        }
        // Exercise the actual headless Program dispatch without starting a
        // runtime, opening a UI, changing registry, or touching real data.
        var program = assembly.GetType("Netgrid.Launcher.Program", true)!.GetMethod("RunAsync", BindingFlags.Static | BindingFlags.NonPublic)!;
        var missing = Path.Combine(Path.GetTempPath(), "NETGRID-missing-verifier-" + Guid.NewGuid().ToString("N"));
        var originalError = Console.Error;
        using var captured = new StringWriter();
        try
        {
            Console.SetError(captured);
            var exit = await (Task<int>)program.Invoke(null, [new[] { "--headless-verify", "--program-root", missing, "--environment-file", Path.Combine(missing, "runtime.env") }])!;
            Assert(exit == 2 && captured.ToString() == "NETGRID_VERIFICATION_ERROR stage=load code=invalid_state cleanup=ok" + Environment.NewLine, "actual_program_dispatch_reports_load_failure");
            Assert(!Directory.Exists(missing) && !captured.ToString().Contains(missing, StringComparison.Ordinal), "dispatch_is_readonly_and_path_is_not_logged");
        }
        finally { Console.SetError(originalError); }
        return checks;
    }
}
