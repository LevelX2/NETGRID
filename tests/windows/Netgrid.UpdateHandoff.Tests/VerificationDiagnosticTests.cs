using Netgrid.Windows;
using Netgrid.Updater;

internal static class VerificationDiagnosticTests
{
    internal static async Task<int> RunAsync()
    {
        var checks = 0;
        void Assert(bool value, string name) { if (!value) throw new Exception("verification_diagnostic_test_failed:" + name); checks++; }
        async Task<string?> Read(string text) => await UpdateVerification.ReadFailureAsync(new StringReader(text), CancellationToken.None);
        Assert(await Read("") is null, "empty_failure_retains_generic_exit_classification");
        const string secret = "credentials-path-token-DO-NOT-RETURN";
        foreach (var stage in new[] { "permit", "load", "start", "stop", "recheck", "cleanup" })
        foreach (var cleanupFailed in new[] { false, true })
        {
            var wire = UpdateVerification.FormatFailure(stage, new IOException(secret), cleanupFailed) + "\n";
            var code = await Read(wire);
            Assert(code == $"installation_gate_verification_{stage}_io_cleanup_{(cleanupFailed ? "failed" : "ok")}", "roundtrip_fixed_fields");
            Assert(code!.Length <= 120 && !wire.Contains(secret, StringComparison.Ordinal), "bounded_secret_free_diagnostic");
            Assert(UpdateSession.DiagnosticCode(new InvalidOperationException(code)) == code, "msi_helper_preserves_validated_code");
        }
        foreach (var text in new[] { secret, "\n", new string('x', 4096),
            "NETGRID_VERIFICATION_ERROR stage=stop code=" + secret + " cleanup=ok\n",
            "NETGRID_VERIFICATION_ERROR stage=stop code=server_timeout cleanup=ok\nextra\n" })
        {
            try { await Read(text); throw new Exception("diagnostic_invalid_record_accepted"); }
            catch (InvalidOperationException error) { Assert(error.Message == "installation_gate_verification_diagnostic_invalid", "untrusted_output_not_returned"); }
        }
        return checks;
    }
}
