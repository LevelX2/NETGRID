using System.Diagnostics;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using Netgrid.Windows;

namespace Netgrid.Launcher;

internal sealed partial class LauncherRuntime : IAsyncDisposable
{
    private readonly string _programRoot;
    private readonly RuntimeEnvironment _environment;
    private readonly Uri _serverUrl;
    private readonly Uri _webUrl;
    private readonly SemaphoreSlim _lifecycle = new(1, 1);
    private readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(2) };
    private readonly string _controlToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
    private Process? _server;
    private Process? _web;
    private bool _stopping;
    private int _recoveryAttempts;

    private LauncherRuntime(string programRoot, RuntimeEnvironment environment)
    {
        _programRoot = programRoot;
        _environment = environment;
        _serverUrl = environment.OptionalUri("NETGRID_LAUNCHER_SERVER_URL", "NETGRID_SERVER_BASE_URL");
        _webUrl = environment.OptionalUri("NETGRID_LAUNCHER_WEB_URL", "NETGRID_WEB_BASE_URL");
    }

    public event EventHandler<string>? FatalFailure;
    public event EventHandler? Recovered;

    public Uri WebUrl => _webUrl;
    public string LogDirectory => Path.Combine(_environment.Required("NETGRID_DATA_ROOT"), "runtime", "logs");
    public string DataRoot => _environment.Required("NETGRID_DATA_ROOT");
    public string ProgramRoot => _programRoot;
    public string EnvironmentFile => Path.Combine(_environment.Required("NETGRID_DATA_ROOT"), "config", "runtime.env");

    public static LauncherRuntime Load(LauncherOptions options)
    {
        var root = Path.GetFullPath(options.ResolveProgramRoot());
        var environment = RuntimeEnvironment.Load(options.ResolveEnvironmentFile());
        return new LauncherRuntime(root, environment);
    }

    public async Task StartAsync()
    {
        await _lifecycle.WaitAsync();
        try
        {
            if (_server is { HasExited: false } && _web is { HasExited: false }) return;
            _stopping = false;
            _recoveryAttempts = 0;
            await StartPairAndWaitAsync();
            _ = MonitorAsync(_server!, _web!);
        }
        finally
        {
            _lifecycle.Release();
        }
    }

    public async Task StopAsync()
    {
        await _lifecycle.WaitAsync();
        try
        {
            _stopping = true;
            await StopProcessesAsync();
        }
        finally
        {
            _lifecycle.Release();
        }
    }

    public async Task<(bool Allowed, int ActiveMatchCount)> UpdateReadinessAsync()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, new Uri(_serverUrl, "/api/system/update-readiness"));
        request.Headers.Add("x-netgrid-launcher-control", _controlToken);
        using var response = await _http.SendAsync(request);
        response.EnsureSuccessStatusCode();
        var payload = await response.Content.ReadFromJsonAsync<UpdateReadiness>()
            ?? throw new InvalidOperationException("update_readiness_invalid");
        return (payload.UpdateAllowed, payload.ActiveMatchCount);
    }

    public async Task VerifyRecoveryPolicyAsync()
    {
        var recovered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var failed = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        EventHandler recoveredHandler = (_, _) => recovered.TrySetResult();
        EventHandler<string> failedHandler = (_, _) => failed.TrySetResult();
        Recovered += recoveredHandler;
        FatalFailure += failedHandler;
        try
        {
            var firstWeb = _web ?? throw new InvalidOperationException("launcher_web_missing");
            Kill(firstWeb);
            await recovered.Task.WaitAsync(TimeSpan.FromMinutes(2));
            var recoveredWeb = _web ?? throw new InvalidOperationException("launcher_recovered_web_missing");
            Kill(recoveredWeb);
            await failed.Task.WaitAsync(TimeSpan.FromMinutes(2));
        }
        finally
        {
            Recovered -= recoveredHandler;
            FatalFailure -= failedHandler;
        }
    }

    private async Task StartPairAndWaitAsync()
    {
        ValidateFiles();
        var logRoot = Path.Combine(_environment.Required("NETGRID_DATA_ROOT"), "runtime", "logs");
        Directory.CreateDirectory(logRoot);
        _server = StartNode(
            Path.Combine(_programRoot, "app", "server.mjs"),
            Path.Combine(_programRoot, "app"),
            Path.Combine(logRoot, "launcher-server.log"),
            launcherControl: true
        );
        _web = StartNode(
            Path.Combine(_programRoot, "app", "apps", "web", "server.js"),
            Path.Combine(_programRoot, "app", "apps", "web"),
            Path.Combine(logRoot, "launcher-web.log"),
            launcherControl: false
        );
        try
        {
            await WaitForReadyAsync(_server, _web);
        }
        catch
        {
            await StopProcessesAsync();
            throw;
        }
    }

    private Process StartNode(string entrypoint, string workingDirectory, string logPath, bool launcherControl)
    {
        var nodePath = Path.Combine(_programRoot, "runtime", "node", "node.exe");
        var startInfo = new ProcessStartInfo(nodePath)
        {
            WorkingDirectory = workingDirectory,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardInput = launcherControl,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
        };
        startInfo.ArgumentList.Add(entrypoint);
        foreach (var key in startInfo.Environment.Keys.Where(key =>
                     key.StartsWith("NETGRID_", StringComparison.OrdinalIgnoreCase) ||
                     key.Equals("NODE_ENV", StringComparison.OrdinalIgnoreCase) ||
                     key.Equals("HOSTNAME", StringComparison.OrdinalIgnoreCase) ||
                     key.Equals("PORT", StringComparison.OrdinalIgnoreCase) ||
                     key.Equals("NEXT_PUBLIC_NETGRID_SERVER_URL", StringComparison.OrdinalIgnoreCase)).ToArray())
        {
            startInfo.Environment.Remove(key);
        }
        startInfo.Environment.Remove("NODE_OPTIONS");
        foreach (var (name, value) in _environment.Values) startInfo.Environment[name] = value;
        if (launcherControl)
        {
            startInfo.Environment["NETGRID_LAUNCHER_CONTROL"] = "stdio";
            startInfo.Environment["NETGRID_LAUNCHER_CONTROL_TOKEN"] = _controlToken;
        }

        RotateLog(logPath);
        var logLock = new object();
        var process = new Process { StartInfo = startInfo, EnableRaisingEvents = true };
        process.OutputDataReceived += (_, eventArgs) => WriteLog(logPath, logLock, eventArgs.Data);
        process.ErrorDataReceived += (_, eventArgs) => WriteLog(logPath, logLock, eventArgs.Data);
        if (!process.Start()) throw new InvalidOperationException("launcher_process_start_failed");
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();
        return process;
    }

    private async Task WaitForReadyAsync(Process server, Process web)
    {
        var deadline = DateTimeOffset.UtcNow.AddMinutes(2);
        while (DateTimeOffset.UtcNow < deadline)
        {
            if (server.HasExited) throw new InvalidOperationException($"launcher_server_exited:{server.ExitCode}");
            if (web.HasExited) throw new InvalidOperationException($"launcher_web_exited:{web.ExitCode}");
            if (await IsHealthyAsync(new Uri(_serverUrl, "/health"), requireJsonOk: true) && await IsHealthyAsync(_webUrl, requireJsonOk: false)) return;
            await Task.Delay(250);
        }
        throw new TimeoutException("launcher_health_timeout");
    }

    private async Task<bool> IsHealthyAsync(Uri uri, bool requireJsonOk)
    {
        try
        {
            using var response = await _http.GetAsync(uri);
            if (!response.IsSuccessStatusCode) return false;
            if (!requireJsonOk) return true;
            var body = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
            return body?.ContainsKey("ok") == true;
        }
        catch (HttpRequestException)
        {
            return false;
        }
        catch (TaskCanceledException)
        {
            return false;
        }
    }

    private async Task MonitorAsync(Process server, Process web)
    {
        await Task.WhenAny(server.WaitForExitAsync(), web.WaitForExitAsync());
        if (_stopping || server != _server || web != _web) return;
        await _lifecycle.WaitAsync();
        try
        {
            if (_stopping || server != _server || web != _web) return;
            await StopProcessesAsync();
            if (_recoveryAttempts++ == 0)
            {
                try
                {
                    await StartPairAndWaitAsync();
                    Recovered?.Invoke(this, EventArgs.Empty);
                    _ = MonitorAsync(_server!, _web!);
                    return;
                }
                catch
                {
                    // The structured fatal event below is the single recovery result.
                }
            }
            FatalFailure?.Invoke(this, UiText.Get("launcher.fatal"));
        }
        finally
        {
            _lifecycle.Release();
        }
    }

    private async Task StopProcessesAsync()
    {
        var server = _server;
        var web = _web;
        _server = null;
        _web = null;
        if (server is { HasExited: false })
        {
            try
            {
                await server.StandardInput.WriteLineAsync("shutdown");
                await server.StandardInput.FlushAsync();
                using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
                await server.WaitForExitAsync(timeout.Token);
            }
            catch (Exception exception) when (exception is IOException or InvalidOperationException or OperationCanceledException)
            {
                Kill(server);
            }
        }
        if (web is { HasExited: false }) Kill(web);
        server?.Dispose();
        web?.Dispose();
    }

    private void ValidateFiles()
    {
        foreach (var file in new[]
                 {
                     Path.Combine(_programRoot, "runtime", "node", "node.exe"),
                     Path.Combine(_programRoot, "app", "server.mjs"),
                     Path.Combine(_programRoot, "app", "apps", "web", "server.js"),
                 })
        {
            if (!File.Exists(file)) throw new InvalidOperationException($"launcher_file_missing:{Path.GetFileName(file)}");
        }
    }

    private void WriteLog(string path, object sync, string? line)
    {
        if (line is null) return;
        var secret = _environment.Required("NETGRID_TOKEN_SALT");
        var redacted = SecretAssignment().Replace(line.Replace(secret, "<redacted>", StringComparison.Ordinal), "$1=<redacted>");
        lock (sync)
        {
            File.AppendAllText(path, $"{DateTimeOffset.Now:O} {redacted}{Environment.NewLine}");
        }
    }

    private static void RotateLog(string path)
    {
        if (!File.Exists(path) || new FileInfo(path).Length <= 2 * 1024 * 1024) return;
        var previous = $"{path}.previous";
        File.Move(path, previous, overwrite: true);
    }

    private static void Kill(Process process)
    {
        try
        {
            if (!process.HasExited) process.Kill(entireProcessTree: true);
        }
        catch (InvalidOperationException) { }
    }

    public async ValueTask DisposeAsync()
    {
        await StopAsync();
        _http.Dispose();
        _lifecycle.Dispose();
    }

    [GeneratedRegex(@"(?i)\b(token|password|secret|salt)\s*=\s*[^\s,;]+")]
    private static partial Regex SecretAssignment();

    private sealed record UpdateReadiness(bool UpdateAllowed, int ActiveMatchCount);
}
