using System.Net;

namespace Netgrid.Launcher;

internal enum UpdateStage { Checking, Downloading, Preparing }

// Offline discovery is an explicit product state, not a failed installation.
// HTTP status, TLS, metadata and integrity failures must never become "offline"
// or "up to date". A download failure after consent must never disappear either.
internal sealed record UpdateFailure(string MessageKey, bool Quiet, bool Unavailable, string Diagnostic)
{
    public static UpdateFailure Classify(Exception exception, UpdateStage stage, bool manual)
    {
        var unavailable = stage == UpdateStage.Checking && (exception is TaskCanceledException ||
            exception is HttpRequestException { StatusCode: null, HttpRequestError:
                HttpRequestError.NameResolutionError or HttpRequestError.ConnectionError });
        var message = unavailable ? "launcher.update.unavailable" : stage == UpdateStage.Checking
            ? "launcher.update.check_failed" : "launcher.update.failed";
        var http = exception as HttpRequestException;
        var code = exception.Message switch
        {
            "update_download_hash_mismatch" or "update_integrity_sources_disagree" or "update_metadata_invalid" or
            "update_checksum_missing" or "update_release_response_invalid" or "update_asset_origin_invalid" or
            "update_current_version_invalid" or "installed_version_missing" or "updater_missing" => exception.Message,
            _ => "exception_without_public_code",
        };
        // Never copy exception messages, URLs, headers, paths or inner exceptions.
        var diagnostic = $"owner=launcher-update stage={stage} code={code} type={exception.GetType().Name} " +
            $"hresult=0x{exception.HResult:X8} httpStatus={(http?.StatusCode is HttpStatusCode status ? ((int)status).ToString() : "none")} " +
            $"httpError={http?.HttpRequestError.ToString() ?? "none"}";
        return new(message, unavailable && !manual, unavailable, diagnostic);
    }

    public void Record(string logDirectory)
    {
        Directory.CreateDirectory(logDirectory);
        var path = Path.Combine(logDirectory, "launcher-update.log");
        if (File.Exists(path) && new FileInfo(path).Length > 64 * 1024)
            File.Move(path, path + ".previous", overwrite: true);
        File.AppendAllText(path, $"{DateTimeOffset.UtcNow:O} {Diagnostic}{Environment.NewLine}");
    }
}
