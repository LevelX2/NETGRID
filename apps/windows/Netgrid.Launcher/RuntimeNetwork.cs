using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Netgrid.Launcher;

internal sealed class RuntimeNetworkException(string code, Exception? inner = null) : Exception(code, inner);

internal static class RuntimeNetwork
{
    internal static string[] LocalPrivateAddresses() => NetworkInterface.GetAllNetworkInterfaces()
        .Where(adapter => adapter.OperationalStatus == OperationalStatus.Up &&
            adapter.NetworkInterfaceType is not (NetworkInterfaceType.Loopback or NetworkInterfaceType.Tunnel))
        .SelectMany(adapter => adapter.GetIPProperties().UnicastAddresses)
        .Where(item => !item.IsTransient && item.DuplicateAddressDetectionState == DuplicateAddressDetectionState.Preferred)
        .Select(item => item.Address).Where(IsPrivate).Select(address => address.ToString()).Distinct().ToArray();

    private static bool IsPrivate(IPAddress address)
    {
        if (address.AddressFamily != AddressFamily.InterNetwork) return false;
        var bytes = address.GetAddressBytes();
        return bytes[0] == 10 || bytes[0] == 192 && bytes[1] == 168 ||
            bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31;
    }

    internal static Dictionary<string, string> Resolve(IReadOnlyDictionary<string, string> configured, string[] addresses)
    {
        var result = new Dictionary<string, string>(configured, StringComparer.Ordinal);
        if (configured["NETGRID_DEPLOYMENT_PROFILE"] != "private_lan") return result;
        var web = new Uri(configured["NETGRID_WEB_BASE_URL"]);
        var server = new Uri(configured["NETGRID_SERVER_BASE_URL"]);
        if (web.Host != server.Host || web.Scheme != "http" || server.Scheme != "http" ||
            !IPAddress.TryParse(web.Host, out var oldAddress) || !IsPrivate(oldAddress))
            throw new RuntimeNetworkException("launcher_network_configuration_invalid");
        var candidates = addresses.Where(value => IPAddress.TryParse(value, out var address) && IsPrivate(address)).Distinct().ToArray();
        var host = candidates.Contains(web.Host) ? web.Host : candidates.Length switch
        {
            0 => throw new RuntimeNetworkException("launcher_network_unavailable"),
            1 => candidates[0],
            _ => throw new RuntimeNetworkException("launcher_network_ambiguous"),
        };
        var publicWeb = new UriBuilder(web) { Host = host }.Uri.GetLeftPart(UriPartial.Authority);
        var publicServer = new UriBuilder(server) { Host = host }.Uri.GetLeftPart(UriPartial.Authority);
        result["NETGRID_PUBLIC_HOST"] = host;
        result["NETGRID_WEB_BASE_URL"] = publicWeb;
        result["NETGRID_SERVER_BASE_URL"] = publicServer;
        result["NEXT_PUBLIC_NETGRID_SERVER_URL"] = publicServer;
        result["NETGRID_ALLOWED_ORIGINS"] = $"{publicWeb},http://127.0.0.1:{web.Port}";
        return result;
    }

    internal static async Task<bool> BrowserReadyAsync(HttpClient http, Uri server, Uri web, Uri expectedServer)
    {
        var origin = web.GetLeftPart(UriPartial.Authority);
        using var request = new HttpRequestMessage(HttpMethod.Get, new Uri(server, "/health"));
        request.Headers.Add("Origin", origin);
        using var response = await http.SendAsync(request);
        if (!response.IsSuccessStatusCode ||
            !response.Headers.TryGetValues("Access-Control-Allow-Origin", out var allowed) || allowed.SingleOrDefault() != origin ||
            !response.Headers.TryGetValues("Access-Control-Allow-Credentials", out var credentials) || credentials.SingleOrDefault() != "true") return false;
        using var health = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        if (!health.RootElement.TryGetProperty("ok", out var ok) || ok.ValueKind != JsonValueKind.True) return false;
        using var page = await http.GetAsync(web);
        if (!page.IsSuccessStatusCode) return false;
        var binding = Regex.Match(await page.Content.ReadAsStringAsync(), "data-netgrid-server-origin=\"([^\"]+)\"");
        return binding.Success && WebUtility.HtmlDecode(binding.Groups[1].Value) == expectedServer.GetLeftPart(UriPartial.Authority);
    }
}
