using System.Diagnostics;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Win32;

namespace Netgrid.Windows;

internal static class UpdateVerification
{
    public static async Task AcceptPermitAsync(string programRoot, string lease, string session)
    {
        using var machine = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64);
        await AcceptPermitAsync(machine, programRoot, lease, session);
    }

    internal static async Task AcceptPermitAsync(RegistryKey machine, string programRoot, string lease, string session)
    {
        using var owner = InstallationGate.OpenVerificationOwner(machine, programRoot, lease);
        using var deadline = new CancellationTokenSource(TimeSpan.FromSeconds(30));
        using var peer = await UpdateHandoff.ConnectAsync(session, owner, deadline.Token);
        if (!await peer.ReceiveDecisionAsync(deadline.Token) ||
            !InstallationGate.IsCurrentVerificationAllowed(machine, programRoot, lease))
            throw new InvalidOperationException("update_verification_not_authorized");
    }

    public static ProcessStartInfo CreateStart(string programRoot, string environmentFile, string lease, string session)
    {
        InstallationGate.KeyFor(programRoot);
        InstallationGate.ValidateLease(lease);
        UpdateHandoff.PipeName(session);
        if (!Path.IsPathFullyQualified(environmentFile)) throw new InvalidOperationException("update_verification_environment_invalid");
        var start = new ProcessStartInfo(Path.Combine(programRoot, "NETGRID.exe"))
        {
            UseShellExecute = false, CreateNoWindow = true, RedirectStandardError = true,
        };
        foreach (var argument in new[] { "--headless-verify", "--program-root", programRoot,
            "--environment-file", environmentFile, "--update-lease", lease, "--verification-session", session })
            start.ArgumentList.Add(argument);
        return start;
    }

    public static string FormatFailure(string stage, Exception failure, bool cleanupFailed)
    {
        if (stage is not ("permit" or "load" or "start" or "stop" or "recheck" or "cleanup"))
            throw new InvalidOperationException("verification_diagnostic_stage_invalid");
        var causes = new List<Exception>();
        var pending = new Queue<Exception>(); pending.Enqueue(failure);
        while (pending.Count > 0 && causes.Count < 8)
        {
            var cause = pending.Dequeue(); causes.Add(cause);
            if (cause is AggregateException aggregate)
                foreach (var inner in aggregate.InnerExceptions.Take(8 - causes.Count)) pending.Enqueue(inner);
            else if (cause.InnerException is not null) pending.Enqueue(cause.InnerException);
        }
        var timedOut = causes.Any(error => error is OperationCanceledException or TimeoutException);
        var server = causes.Any(error => error.Message == "launcher_child_stop_failed:server");
        var code = server ? timedOut ? "server_timeout" : "server_failed" :
            causes.Any(error => error.Message == "launcher_child_stop_failed:web") ? "web_failed" :
            timedOut ? "timeout" :
            causes.Any(error => error is UnauthorizedAccessException) ? "access_denied" :
            causes.Any(error => error is IOException) ? "io" :
            causes.Any(error => error is InvalidOperationException) ? "invalid_state" : "unexpected";
        return $"NETGRID_VERIFICATION_ERROR stage={stage} code={code} cleanup={(cleanupFailed ? "failed" : "ok")}";
    }

    public static async Task<string?> ReadFailureAsync(TextReader reader, CancellationToken cancellationToken)
    {
        const int limit = 256;
        var retained = new StringBuilder(limit);
        var buffer = new char[128];
        var oversized = false;
        int read;
        // Drain while retaining at most one bounded record. Untrusted output
        // must neither exhaust memory nor block the child's stderr pipe.
        while ((read = await reader.ReadAsync(buffer.AsMemory(), cancellationToken)) != 0)
        {
            if (retained.Length + read > limit) oversized = true;
            if (!oversized) retained.Append(buffer, 0, read);
        }
        if (oversized) throw new InvalidOperationException("installation_gate_verification_diagnostic_invalid");
        if (retained.Length == 0) return null;
        var parsed = Regex.Match(retained.ToString(),
            @"\ANETGRID_VERIFICATION_ERROR stage=(permit|load|start|stop|recheck|cleanup) code=(server_timeout|server_failed|web_failed|timeout|access_denied|io|invalid_state|unexpected) cleanup=(ok|failed)\r?\n\z",
            RegexOptions.CultureInvariant, TimeSpan.FromSeconds(1));
        if (!parsed.Success) throw new InvalidOperationException("installation_gate_verification_diagnostic_invalid");
        return $"installation_gate_verification_{parsed.Groups[1].Value}_{parsed.Groups[2].Value}_cleanup_{parsed.Groups[3].Value}";
    }
}
