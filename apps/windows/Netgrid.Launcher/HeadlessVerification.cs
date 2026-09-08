using Netgrid.Windows;

namespace Netgrid.Launcher;

internal static class HeadlessVerification
{
    public static Task<int> RunAsync(LauncherOptions options)
    {
        LauncherRuntime? runtime = null;
        return ExecuteAsync(async stage =>
        {
            stage("permit");
            if (options.VerificationSession is not null)
                await UpdateVerification.AcceptPermitAsync(options.ResolveProgramRoot(), options.UpdateLease!, options.VerificationSession);
            stage("load");
            runtime = LauncherRuntime.Load(options);
            stage("start");
            await runtime.StartAsync();
            stage("stop");
            await runtime.StopForVerificationAsync();
            stage("recheck");
            if (options.UpdateLease is not null && !InstallationGate.IsCurrentVerificationAllowed(options.ResolveProgramRoot(), options.UpdateLease))
                throw new InvalidOperationException("launcher_verification_revoked");
        }, () => runtime is null ? ValueTask.CompletedTask : runtime.DisposeAsync(), Console.Error);
    }

    internal static async Task<int> ExecuteAsync(Func<Action<string>, Task> operation, Func<ValueTask> cleanup, TextWriter diagnostics)
    {
        var stage = "permit";
        Exception? failure = null;
        var cleanupFailed = false;
        try { await operation(value => stage = value); }
        catch (Exception error) { failure = error; }
        try { await cleanup(); }
        catch (Exception error)
        {
            cleanupFailed = true;
            if (failure is null) { stage = "cleanup"; failure = error; }
        }
        if (failure is null) return 0;
        // Report the primary failure after cleanup, so Dispose cannot mask it.
        await diagnostics.WriteLineAsync(UpdateVerification.FormatFailure(stage, failure, cleanupFailed));
        return 2;
    }
}
