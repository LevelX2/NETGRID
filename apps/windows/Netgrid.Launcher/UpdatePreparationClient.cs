using System.Text.Json;

namespace Netgrid.Launcher;

internal sealed record UpdatePreparationStatus(bool Allowed, int ActiveMatchCount);

// One instance owns exactly one preparation attempt. The same nonce is kept
// for cancellation even when the prepare response was lost or malformed.
internal sealed class UpdatePreparationClient : IDisposable
{
    private readonly HttpClient _http;
    private readonly Uri _endpoint;
    private readonly string _controlToken;
    private readonly string _owner;

    public static UpdatePreparationClient Create(Uri serverUrl, string controlToken)
    {
        var http = new HttpClient(new SocketsHttpHandler { AllowAutoRedirect = false, UseProxy = false });
        try { return new(http, serverUrl, controlToken, Guid.NewGuid().ToString("N")); }
        catch { http.Dispose(); throw; }
    }

    internal UpdatePreparationClient(HttpClient http, Uri serverUrl, string controlToken, string owner)
    {
        if (!serverUrl.IsAbsoluteUri || serverUrl.Scheme != Uri.UriSchemeHttp || !serverUrl.IsLoopback ||
            !string.IsNullOrEmpty(serverUrl.UserInfo) || string.IsNullOrWhiteSpace(controlToken) ||
            owner.Length != 32 || owner.Any(character => character is not (>= '0' and <= '9') and not (>= 'a' and <= 'f')))
            throw new InvalidOperationException("update_preparation_client_invalid");
        _http = http;
        // The server drains for at most 30 seconds. Bound the complete response,
        // not only its headers, and never buffer an unbounded control payload.
        _http.Timeout = TimeSpan.FromSeconds(35);
        _http.MaxResponseContentBufferSize = 4096;
        _endpoint = new Uri(serverUrl, "/api/system/update-preparation");
        _controlToken = controlToken;
        _owner = owner;
    }

    public async Task<UpdatePreparationStatus> PrepareAsync()
    {
        using var payload = await SendAsync(HttpMethod.Post);
        var root = payload.RootElement;
        RequireFields(root, "ok", "updateAllowed", "activeMatchCount");
        if (root.GetProperty("ok").ValueKind != JsonValueKind.True ||
            root.GetProperty("updateAllowed").ValueKind is not (JsonValueKind.True or JsonValueKind.False) ||
            root.GetProperty("activeMatchCount").ValueKind != JsonValueKind.Number ||
            !root.GetProperty("activeMatchCount").TryGetInt32(out var count) || count < 0)
            throw new InvalidOperationException("update_preparation_response_invalid");
        var allowed = root.GetProperty("updateAllowed").GetBoolean();
        if (allowed != (count == 0)) throw new InvalidOperationException("update_preparation_response_invalid");
        return new(allowed, count);
    }

    public async Task CancelAsync()
    {
        using var payload = await SendAsync(HttpMethod.Delete);
        RequireFields(payload.RootElement, "ok");
        if (payload.RootElement.GetProperty("ok").ValueKind != JsonValueKind.True)
            throw new InvalidOperationException("update_preparation_response_invalid");
    }

    private async Task<JsonDocument> SendAsync(HttpMethod method)
    {
        using var request = new HttpRequestMessage(method, _endpoint);
        request.Headers.Add("x-netgrid-launcher-control", _controlToken);
        request.Headers.Add("x-netgrid-update-owner", _owner);
        using var response = await _http.SendAsync(request);
        response.EnsureSuccessStatusCode();
        try { return JsonDocument.Parse(await response.Content.ReadAsByteArrayAsync()); }
        catch (JsonException) { throw new InvalidOperationException("update_preparation_response_invalid"); }
    }

    private static void RequireFields(JsonElement root, params string[] fields)
    {
        if (root.ValueKind != JsonValueKind.Object)
            throw new InvalidOperationException("update_preparation_response_invalid");
        var names = root.EnumerateObject().Select(property => property.Name).ToArray();
        if (names.Length != fields.Length || names.Distinct(StringComparer.Ordinal).Count() != fields.Length ||
            fields.Any(field => !names.Contains(field, StringComparer.Ordinal)))
            throw new InvalidOperationException("update_preparation_response_invalid");
    }

    // Disposal is not cancellation: callers must await CancelAsync and inspect
    // its acknowledgement, or complete the verified stopped-runtime handoff.
    public void Dispose() => _http.Dispose();
}
