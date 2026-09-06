using System.Net;
using System.Reflection;
using System.Text.Json;

internal static class UpdateFailureTests
{
    public static async Task<int> Run(Assembly assembly)
    {
        var checks = 0;
        var type = assembly.GetType("Netgrid.Launcher.UpdateFailure", true)!;
        var stage = assembly.GetType("Netgrid.Launcher.UpdateStage", true)!;
        var classify = type.GetMethod("Classify")!;
        object Classify(Exception exception, string phase, bool manual) => classify.Invoke(null, [exception, Enum.Parse(stage, phase), manual])!;
        T Field<T>(object failure, string name) => (T)type.GetProperty(name)!.GetValue(failure)!;
        void Assert(bool condition, string name)
        {
            if (!condition) throw new Exception("update_failure_test_failed:" + name);
            checks++;
        }
        var offline = new Exception[]
        {
            new HttpRequestException(HttpRequestError.NameResolutionError, "synthetic DNS failure"),
            new HttpRequestException(HttpRequestError.ConnectionError, "synthetic connection failure"),
            new TaskCanceledException("synthetic HTTP timeout"),
        };
        foreach (var exception in offline)
        {
            var manual = Classify(exception, "Checking", true);
            Assert(Field<bool>(manual, "Unavailable") && !Field<bool>(manual, "Quiet") &&
                Field<string>(manual, "MessageKey") == "launcher.update.unavailable", "manual_unavailable_is_not_update_failure");
            Assert(Field<bool>(Classify(exception, "Checking", false), "Quiet"), "offline_startup_stays_silent");
            foreach (var phase in new[] { "Downloading", "Preparing" })
            {
                var afterConsent = Classify(exception, phase, false);
                Assert(!Field<bool>(afterConsent, "Quiet") && !Field<bool>(afterConsent, "Unavailable") &&
                    Field<string>(afterConsent, "MessageKey") == "launcher.update.failed", "failure_after_consent_never_disappears_as_background_offline");
            }
        }
        foreach (var exception in new Exception[]
        {
            new HttpRequestException(HttpRequestError.HttpProtocolError, "status", null, HttpStatusCode.Forbidden),
            new HttpRequestException(HttpRequestError.HttpProtocolError, "status", null, HttpStatusCode.NotFound),
            new HttpRequestException(HttpRequestError.SecureConnectionError, "TLS failure"),
            new HttpRequestException(HttpRequestError.Unknown, "unclassified transport failure"),
            new InvalidOperationException("update_metadata_invalid"), new JsonException("invalid release response"),
        })
        {
            var failure = Classify(exception, "Checking", false);
            Assert(!Field<bool>(failure, "Unavailable") && !Field<bool>(failure, "Quiet") &&
                Field<string>(failure, "MessageKey") == "launcher.update.check_failed", "protocol_tls_and_metadata_errors_are_not_offline_or_current");
        }
        var rejected = Classify(new InvalidOperationException("update_download_hash_mismatch"), "Downloading", false);
        Assert(Field<string>(rejected, "Diagnostic").Contains("code=update_download_hash_mismatch", StringComparison.Ordinal), "integrity_cause_preserved");
        var secret = "synthetic-secret-never-log-this";
        var sensitive = Classify(new HttpRequestException(HttpRequestError.ConnectionError,
            $"https://user:{secret}@private.invalid/file?token={secret}", new IOException(secret)), "Checking", true);
        var diagnosis = Field<string>(sensitive, "Diagnostic");
        Assert(!diagnosis.Contains(secret) && !diagnosis.Contains("private.invalid") && !diagnosis.Contains("https://"), "no_exception_text_or_inner_secret_in_diagnosis");
        Assert(diagnosis.Contains("owner=launcher-update") && diagnosis.Contains("stage=Checking") &&
            diagnosis.Contains("httpError=ConnectionError") && diagnosis.Contains("hresult=0x"), "structured_owner_stage_and_transport_cause");

        // Exercise discovery's real caller contract. An unreachable feed must
        // throw, never become a null candidate (which would claim "up to date").
        using var http = new HttpClient(new OfflineHandler());
        var discovery = assembly.GetType("Netgrid.Launcher.UpdateDiscovery", true)!;
        try
        {
            await (Task)discovery.GetMethod("CheckAsync")!.Invoke(null, [http,
                new Uri("https://api.github.com/repos/LevelX2/NETGRID/releases"), "1.0.1", false])!;
            throw new Exception("offline_discovery_returned_candidate");
        }
        catch (HttpRequestException exception)
        { Assert(Field<bool>(Classify(exception, "Checking", true), "Unavailable"), "real_discovery_failure_reaches_presentation_policy"); }

        using var catalogStream = assembly.GetManifestResourceStream("NETGRID.WindowsUiStrings.json")!;
        var catalog = JsonSerializer.Deserialize<Dictionary<string, Dictionary<string, string>>>(catalogStream)!;
        foreach (var language in new[] { "de", "en", "fr" })
            foreach (var key in new[] { "launcher.update.unavailable", "launcher.update.check_failed", "launcher.update.diagnostic_failed" })
                Assert(!string.IsNullOrWhiteSpace(string.Format(catalog[language][key], diagnosis, "IOException (0x80070005)")), "localized_update_failure:" + language + ":" + key);

        var scratch = Path.Combine(Path.GetTempPath(), "NETGRID-UpdateFailure-Test-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(scratch);
        try
        {
            var record = type.GetMethod("Record")!;
            var path = Path.Combine(scratch, "launcher-update.log");
            record.Invoke(sensitive, [scratch]);
            Assert(File.ReadAllText(path).Contains(diagnosis) && !File.ReadAllText(path).Contains(secret), "actual_diagnostic_log_is_safe");
            File.WriteAllText(path, new string('x', 65537));
            record.Invoke(rejected, [scratch]);
            Assert(new FileInfo(path + ".previous").Length == 65537 && new FileInfo(path).Length < 2048, "bounded_log_rotation");
            Assert(Directory.GetFiles(scratch).Length == 2 && File.ReadAllText(path).Contains("update_download_hash_mismatch"), "only_current_and_previous_diagnostic_log");
            try { record.Invoke(sensitive, [path]); throw new Exception("diagnostic_write_failure_ignored"); }
            catch (TargetInvocationException exception) when (exception.InnerException is IOException)
            { Assert(true, "log_failure_not_silently_ignored"); }
        }
        finally
        {
            var resolved = Path.GetFullPath(scratch);
            if (Path.GetDirectoryName(resolved) != Path.TrimEndingDirectorySeparator(Path.GetFullPath(Path.GetTempPath())) ||
                !Path.GetFileName(resolved).StartsWith("NETGRID-UpdateFailure-Test-", StringComparison.Ordinal))
                throw new Exception("update_failure_test_cleanup_scope_invalid");
            Directory.Delete(resolved, recursive: true);
        }
        return checks;
    }

    private sealed class OfflineHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => throw new HttpRequestException(HttpRequestError.NameResolutionError, "synthetic unreachable update source");
    }
}
