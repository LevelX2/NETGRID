using System.Net;
using System.Reflection;
using System.Text;

internal static class UpdatePreparationTests
{
    public static async Task<int> Run(Assembly assembly)
    {
        var type = assembly.GetType("Netgrid.Launcher.UpdatePreparationClient", true)!;
        var prepare = type.GetMethod("PrepareAsync")!;
        var cancel = type.GetMethod("CancelAsync")!;
        const string owner = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        const string token = "synthetic-launcher-token";
        var checks = 0;
        object Client(Handler handler, string address = "http://127.0.0.1:1/")
        {
            var http = new HttpClient(handler);
            try { return Activator.CreateInstance(type, BindingFlags.Instance | BindingFlags.NonPublic,
                null, [http, new Uri(address), token, owner], null)!; }
            catch { http.Dispose(); throw; }
        }
        async Task Invoke(MethodInfo method, object client) => await (Task)method.Invoke(client, null)!;

        foreach (var body in new[]
        {
            "{}", "null", "[]", "not json",
            "{\"ok\":false,\"updateAllowed\":true,\"activeMatchCount\":0}",
            "{\"ok\":true,\"updateAllowed\":true,\"activeMatchCount\":1}",
            "{\"ok\":true,\"updateAllowed\":false,\"activeMatchCount\":0}",
            "{\"ok\":true,\"updateAllowed\":false,\"activeMatchCount\":-1}",
            "{\"ok\":true,\"updateAllowed\":false,\"activeMatchCount\":1.5}",
            "{\"ok\":true,\"updateAllowed\":false,\"activeMatchCount\":2147483648}",
            "{\"ok\":true,\"updateAllowed\":\"true\",\"activeMatchCount\":0}",
            "{\"ok\":true,\"updateAllowed\":true,\"activeMatchCount\":\"0\"}",
            "{\"ok\":true,\"ok\":false,\"updateAllowed\":true,\"activeMatchCount\":0}",
            "{\"ok\":true,\"updateAllowed\":true,\"activeMatchCount\":0,\"extra\":true}",
        })
        {
            var handler = new Handler(body);
            using var client = (IDisposable)Client(handler);
            try { await Invoke(prepare, client); throw new Exception("malformed_preparation_accepted"); }
            catch (InvalidOperationException error) when (error.Message == "update_preparation_response_invalid") { checks++; }
            handler.Body = "{\"ok\":true}";
            await Invoke(cancel, client);
            Assert(handler.Calls.Count == 2 && handler.Calls[0] == ("POST", owner, token) && handler.Calls[1] == ("DELETE", owner, token), "cancel_keeps_attempt_identity_after_invalid_response");
        }

        foreach (var count in new[] { 0, 2 })
        {
            using var client = (IDisposable)Client(new Handler($"{{\"ok\":true,\"updateAllowed\":{(count == 0 ? "true" : "false")},\"activeMatchCount\":{count}}}"));
            var task = (Task)prepare.Invoke(client, null)!;
            await task;
            var result = task.GetType().GetProperty("Result")!.GetValue(task)!;
            Assert((bool)result.GetType().GetProperty("Allowed")!.GetValue(result)! == (count == 0), "allowed_status_preserved");
            Assert((int)result.GetType().GetProperty("ActiveMatchCount")!.GetValue(result)! == count, "active_count_preserved");
        }

        foreach (var body in new[] { "{}", "{\"ok\":false}", "{\"ok\":true,\"ok\":true}", "{\"ok\":true,\"extra\":0}" })
        {
            using var client = (IDisposable)Client(new Handler(body));
            try { await Invoke(cancel, client); throw new Exception("invalid_cancel_acknowledgement_accepted"); }
            catch (InvalidOperationException error) when (error.Message == "update_preparation_response_invalid") { checks++; }
        }
        foreach (var status in new[] { HttpStatusCode.Forbidden, HttpStatusCode.ServiceUnavailable, HttpStatusCode.Redirect })
        {
            using var client = (IDisposable)Client(new Handler("{\"ok\":true}") { Status = status });
            try { await Invoke(cancel, client); throw new Exception("failed_cancel_http_accepted"); }
            catch (HttpRequestException) { checks++; }
        }
        using (var oversized = (IDisposable)Client(new Handler(new string(' ', 5000))))
        {
            try { await Invoke(prepare, oversized); throw new Exception("oversized_control_response_accepted"); }
            catch (HttpRequestException) { checks++; }
        }
        foreach (var address in new[] { "https://127.0.0.1/", "http://192.168.1.1/", "http://example.com/", "http://user:password@127.0.0.1/" })
        {
            try { using var client = (IDisposable)Client(new Handler("{}"), address); throw new Exception("nonlocal_control_endpoint_accepted"); }
            catch (TargetInvocationException error) when (error.InnerException is InvalidOperationException { Message: "update_preparation_client_invalid" }) { checks++; }
        }
        return checks;

        void Assert(bool condition, string code)
        {
            if (!condition) throw new Exception($"update_preparation_test_failed:{code}");
            checks++;
        }
    }

    private sealed class Handler(string body) : HttpMessageHandler
    {
        public string Body = body;
        public HttpStatusCode Status = HttpStatusCode.OK;
        public List<(string Method, string Owner, string Token)> Calls { get; } = [];
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (request.RequestUri != new Uri("http://127.0.0.1:1/api/system/update-preparation")) throw new Exception("fixture_endpoint_invalid");
            Calls.Add((request.Method.Method, request.Headers.GetValues("x-netgrid-update-owner").Single(), request.Headers.GetValues("x-netgrid-launcher-control").Single()));
            return Task.FromResult(new HttpResponseMessage(Status) { Content = new StringContent(Body, Encoding.UTF8, "application/json") });
        }
    }
}
