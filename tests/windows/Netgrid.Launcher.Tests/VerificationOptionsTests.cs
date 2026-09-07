using System.Reflection;

internal static class VerificationOptionsTests
{
    internal static int Run(Assembly assembly)
    {
        var checks = 0;
        var type = assembly.GetType("Netgrid.Launcher.LauncherOptions", true)!;
        object Parse(string[] arguments) => type.GetMethod("Parse")!.Invoke(null, [arguments])!;
        var lease = Guid.NewGuid().ToString("N");
        var session = Guid.NewGuid().ToString("N");
        string[] valid = ["--headless-verify", "--program-root", @"C:\Program Files\NETGRID", "--environment-file",
            @"C:\ProgramData\NETGRID\config\runtime.env", "--update-lease", lease, "--verification-session", session];
        var options = Parse(valid);
        Assert((string?)type.GetProperty("UpdateLease")!.GetValue(options) == lease, "explicit_lease");
        Assert((string?)type.GetProperty("VerificationSession")!.GetValue(options) == session, "explicit_session");
        var standalone = Parse(["--headless-verify"]);
        Assert(type.GetProperty("UpdateLease")!.GetValue(standalone) is null, "standalone_has_no_update_exception");
        foreach (var index in new[] { 1, 3, 5, 7 })
            Reject(valid.Take(index).Concat(valid.Skip(index + 2)).ToArray(), "required_pair_" + index);
        Reject(valid.Skip(1).ToArray(), "headless_required");
        foreach (var flag in new[] { "--headless-smoke", "--open-maintenance" }) Reject([..valid, flag], "conflicting_" + flag);
        Reject([..valid, "--export-diagnostics", @"C:\diagnostic.zip"], "diagnostics_conflict");
        Reject([..valid, "--check-update-api", "https://api.github.com", "--check-update-output", @"C:\report.json", "--current-version", "1.0.1"], "update_diagnostics_conflict");
        foreach (var index in new[] { 5, 7 })
        {
            Reject([..valid, valid[index], valid[index + 1]], "duplicate_context_" + index);
            Reject([..valid, valid[index]], "missing_value_" + index);
            foreach (var malformed in new[] { "", "../escape", Guid.Empty.ToString("N"), Guid.NewGuid().ToString("D") })
            {
                var bad = valid.ToArray(); bad[index + 1] = malformed;
                Reject(bad, "malformed_identity_" + index);
            }
        }
        return checks;

        void Assert(bool value, string name)
        {
            if (!value) throw new Exception("verification_options_failed:" + name);
            checks++;
        }
        void Reject(string[] arguments, string name)
        {
            try { Parse(arguments); }
            catch (TargetInvocationException error) when (error.InnerException is InvalidOperationException or InvalidDataException) { checks++; return; }
            throw new Exception("verification_options_rejection_missing:" + name);
        }
    }
}
