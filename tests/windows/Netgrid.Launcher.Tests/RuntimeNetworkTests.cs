using System.Net;
using System.Reflection;

internal static class RuntimeNetworkTests
{
    internal static async Task<int> Run(Assembly assembly)
    {
        var checks = 0;
        var type = assembly.GetType("Netgrid.Launcher.RuntimeNetwork", true)!;
        var resolve = type.GetMethod("Resolve", BindingFlags.Static | BindingFlags.NonPublic)!;
        var browser = type.GetMethod("BrowserReadyAsync", BindingFlags.Static | BindingFlags.NonPublic)!;
        var original = new Dictionary<string, string>
        {
            ["NETGRID_DEPLOYMENT_PROFILE"] = "private_lan",
            ["NETGRID_WEB_BASE_URL"] = "http://192.168.68.54:3200",
            ["NETGRID_SERVER_BASE_URL"] = "http://192.168.68.54:8887",
            ["NETGRID_ALLOWED_ORIGINS"] = "http://192.168.68.54:3200,http://127.0.0.1:3200",
            ["NETGRID_LAUNCHER_WEB_URL"] = "http://127.0.0.1:3200",
            ["NETGRID_TOKEN_SALT"] = "unchanged-test-value",
            ["NETGRID_MAINTENANCE_ALLOWED_ORIGINS"] = "http://127.0.0.1:3200",
        };
        Dictionary<string, string> Resolve(Dictionary<string, string> values, params string[] addresses) =>
            (Dictionary<string, string>)resolve.Invoke(null, [values, addresses])!;
        void Assert(bool condition, string name) { if (!condition) throw new Exception("network_test:" + name); checks++; }
        void Reject(string code, Dictionary<string, string> values, params string[] addresses)
        {
            try { Resolve(values, addresses); }
            catch (TargetInvocationException error) when (error.InnerException?.Message == code) { checks++; return; }
            throw new Exception("network_rejection_missing:" + code);
        }
        var changed = Resolve(original, "192.168.68.58");
        Assert(changed["NETGRID_SERVER_BASE_URL"] == "http://192.168.68.58:8887", "server_port_preserved");
        Assert(changed["NETGRID_WEB_BASE_URL"] == "http://192.168.68.58:3200", "web_port_preserved");
        Assert(changed["NEXT_PUBLIC_NETGRID_SERVER_URL"] == changed["NETGRID_SERVER_BASE_URL"], "public_client_binding");
        Assert(changed["NETGRID_ALLOWED_ORIGINS"] == "http://192.168.68.58:3200,http://127.0.0.1:3200", "exact_origins_no_old_ip");
        Assert(original["NETGRID_SERVER_BASE_URL"] == "http://192.168.68.54:8887", "source_not_mutated");
        foreach (var key in new[] { "NETGRID_TOKEN_SALT", "NETGRID_MAINTENANCE_ALLOWED_ORIGINS", "NETGRID_LAUNCHER_WEB_URL" })
            Assert(changed[key] == original[key], "preserved_" + key);
        Assert(Resolve(original, "10.1.1.2", "192.168.68.54")["NETGRID_WEB_BASE_URL"] == original["NETGRID_WEB_BASE_URL"], "retains_available_configured_address");
        Assert(Resolve(original, "192.168.68.58", "192.168.68.58")["NETGRID_PUBLIC_HOST"] == "192.168.68.58", "deduplicates");
        Reject("launcher_network_ambiguous", original, "192.168.68.58", "10.1.1.2");
        Reject("launcher_network_unavailable", original);
        Reject("launcher_network_unavailable", original, "127.0.0.1", "169.254.1.2", "8.8.8.8", "::1");
        Reject("launcher_network_configuration_invalid", new(original) { ["NETGRID_SERVER_BASE_URL"] = "http://192.168.68.99:8887" }, "192.168.68.58");
        var local = new Dictionary<string, string>(original) { ["NETGRID_DEPLOYMENT_PROFILE"] = "local" };
        Assert(Resolve(local).OrderBy(pair => pair.Key).SequenceEqual(local.OrderBy(pair => pair.Key)), "local_mode_unchanged_offline");

        const string origin = "http://127.0.0.1:3200";
        const string expected = "http://192.168.68.58:8887";
        foreach (var scenario in new[] { "ok", "old_origin", "wildcard", "no_credentials", "forbidden", "not_ok", "old_binding", "missing_binding" })
        {
            using var http = new HttpClient(new Handler(request =>
            {
                if (request.RequestUri!.AbsolutePath == "/health")
                {
                    Assert(request.Headers.GetValues("Origin").Single() == origin, "request_origin_" + scenario);
                    var response = new HttpResponseMessage(scenario == "forbidden" ? HttpStatusCode.Forbidden : HttpStatusCode.OK)
                    { Content = new StringContent(scenario == "not_ok" ? "{\"ok\":false}" : "{\"ok\":true}") };
                    response.Headers.Add("Access-Control-Allow-Origin", scenario == "old_origin" ? "http://192.168.68.54:3200" : scenario == "wildcard" ? "*" : origin);
                    if (scenario != "no_credentials") response.Headers.Add("Access-Control-Allow-Credentials", "true");
                    return response;
                }
                return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(scenario == "missing_binding" ? "<html>" :
                    $"<html data-netgrid-server-origin=\"{(scenario == "old_binding" ? "http://192.168.68.54:8887" : expected)}\">") };
            }));
            var ready = await (Task<bool>)browser.Invoke(null, [http, new Uri("http://127.0.0.1:8887"), new Uri(origin), new Uri(expected)])!;
            Assert(ready == (scenario == "ok"), "browser_" + scenario);
        }
        return checks;
    }

    private sealed class Handler(Func<HttpRequestMessage, HttpResponseMessage> respond) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) => Task.FromResult(respond(request));
    }
}
