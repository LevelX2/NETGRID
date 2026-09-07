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
    private int _installationStopping;
    private int _recoveryAttempts;
    private readonly Func<bool> _installationBlocked;
    private readonly CancellationTokenSource _installationWatchCancellation = new();
    private Task? _installationWatch;

    private LauncherRuntime(string programRoot, RuntimeEnvironment environment)
        : this(programRoot, environment, () => InstallationGate.IsCurrentProcessBlocked(programRoot)) { }

    private LauncherRuntime(string programRoot, RuntimeEnvironment environment, Func<bool> installationBlocked)
    {
        _installationBlocked = installationBlocked;
        _programRoot = programRoot;
        _environment = environment;
        _serverUrl = environment.OptionalUri("NETGRID_LAUNCHER_SERVER_URL", "NETGRID_SERVER_BASE_URL");
        _webUrl = environment.OptionalUri("NETGRID_LAUNCHER_WEB_URL", "NETGRID_WEB_BASE_URL");
    }

    public event EventHandler<string>? FatalFailure;
    public event EventHandler? Recovered;
    public event EventHandler<string?>? InstallationStopped;

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
            ThrowIfInstallationStopping();
            if (_installationBlocked())
            {
                Interlocked.Exchange(ref _installationStopping, 1);
                ThrowIfInstallationStopping();
            }
            _installationWatch ??= WatchInstallationAsync();
            if (!_stopping && _server is { HasExited: false } && _web is { HasExited: false }) return;
            // A previous failed stop still owns its handles. Never overwrite
            // them with a fresh pair, even when a user explicitly retries.
            if (_server is not null || _web is not null) await StopProcessesAsync();
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

    // The installer owns a terminal stop, unlike an ordinary recoverable stop.
    // Publish it before waiting for the owner lock so already queued retries
    // cannot acquire the lock first and reset _stopping/start another pair.
    public Task StopForInstallationAsync()
    {
        Interlocked.Exchange(ref _installationStopping, 1);
        return StopAsync();
    }

    private bool InstallationStopping => Volatile.Read(ref _installationStopping) != 0;

    private void ThrowIfInstallationStopping()
    {
        if (InstallationStopping) throw new InvalidOperationException("launcher_installation_stopping");
    }

    private async Task WatchInstallationAsync()
    {
        string? failure = null;
        try
        {
            while (true)
            {
                await Task.Delay(200, _installationWatchCancellation.Token);
                if (!_installationBlocked()) continue;
                break;
            }
        }
        catch (OperationCanceledException) when (_installationWatchCancellation.IsCancellationRequested) { return; }
        catch (Exception)
        {
            // An unreadable/corrupt coordination state is not "no installer".
            // Stop through the owner and close instead of recovering blindly.
            failure = "launcher.installation.guard_failed";
        }
        try { await StopForInstallationAsync(); }
        catch (Exception)
        {
            // Do not publish a successful installer stop or discard the owner
            // after a shutdown failure. A later explicit stop may retry.
            FatalFailure?.Invoke(this, UiText.Get("launcher.stop.failure"));
            return;
        }
        InstallationStopped?.Invoke(this, failure);
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
        ThrowIfInstallationStopping();
        ValidateFiles();
        var logRoot = Path.Combine(_environment.Required("NETGRID_DATA_ROOT"), "runtime", "logs");
        Directory.CreateDirectory(logRoot);
        try
        {
            StartNode(
                Path.Combine(_programRoot, "app", "server.mjs"),
                Path.Combine(_programRoot, "app"),
                Path.Combine(logRoot, "launcher-server.log"),
                launcherControl: true
            );
            StartNode(
                Path.Combine(_programRoot, "app", "apps", "web", "server.js"),
                Path.Combine(_programRoot, "app", "apps", "web"),
                Path.Combine(logRoot, "launcher-web.log"),
                launcherControl: false
            );
            await WaitForReadyAsync(_server!, _web!);
        }
        catch
        {
            await StopProcessesAsync();
            throw;
        }
    }

    private void StartNode(string entrypoint, string workingDirectory, string logPath, bool launcherControl)
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
        try
        {
            if (!process.Start()) throw new InvalidOperationException("launcher_process_start_failed");
        }
        catch { process.Dispose(); throw; }
        // Publish ownership immediately after creation, before asynchronous
        // log setup can throw. StartPairAndWaitAsync owns failure cleanup.
        if (launcherControl) _server = process;
        else _web = process;
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();
    }

    private async Task WaitForReadyAsync(Process server, Process web)
    {
        var deadline = DateTimeOffset.UtcNow.AddMinutes(2);
        while (DateTimeOffset.UtcNow < deadline)
        {
            ThrowIfInstallationStopping();
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
        if (InstallationStopping || _stopping || server != _server || web != _web) return;
        await _lifecycle.WaitAsync();
        try
        {
            if (InstallationStopping || _stopping || server != _server || web != _web) return;
            try { await StopProcessesAsync(); }
            catch (Exception)
            {
                FatalFailure?.Invoke(this, UiText.Get("launcher.stop.failure"));
                return;
            }
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
                    if (InstallationStopping) return;
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

    private async Task StopProcessesAsync(bool requireGracefulServer = false)
    {
        // Each slot remains owned until that exact Process handle has proved
        // exit. Failure in one child must not prevent stopping the other one.
        var failures = new List<Exception>();
        if (requireGracefulServer && _server is null)
            failures.Add(new InvalidOperationException("launcher_update_server_missing"));
        await StopOwnedAsync(_server, "server", graceful: true);
        await StopOwnedAsync(_web, "web", graceful: false);
        if (failures.Count > 0)
        {
            _stopping = true;
            throw new AggregateException("launcher_runtime_stop_failed", failures);
        }

        async Task StopOwnedAsync(Process? process, string role, bool graceful)
        {
            if (process is null) return;
            try
            {
                if (requireGracefulServer && graceful && process.HasExited)
                    throw new InvalidOperationException("launcher_update_server_already_exited");
                if (!process.HasExited && graceful)
                {
                    try
                    {
                        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
                        await process.StandardInput.WriteLineAsync("shutdown".AsMemory(), timeout.Token);
                        await process.StandardInput.FlushAsync(timeout.Token);
                        await process.WaitForExitAsync(timeout.Token);
                    }
                    catch (Exception error) when (!requireGracefulServer && error is IOException or InvalidOperationException or OperationCanceledException)
                    {
                        // Existing bounded shutdown policy: only our retained
                        // child is eligible for forced termination.
                        Kill(process);
                    }
                }
                if (!process.HasExited) Kill(process);
                using var exitTimeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
                await process.WaitForExitAsync(exitTimeout.Token);
                if (!process.HasExited) throw new InvalidOperationException("launcher_child_exit_unverified");
                if (requireGracefulServer && graceful && process.ExitCode != 0)
                    throw new InvalidOperationException("launcher_update_server_shutdown_failed");
                if (role == "server") _server = null;
                else _web = null;
                process.Dispose();
            }
            catch (Exception error)
            {
                failures.Add(new InvalidOperationException("launcher_child_stop_failed:" + role, error));
            }
        }
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
        catch (InvalidOperationException) when (process.HasExited) { }
    }

    public async ValueTask DisposeAsync()
    {
        await _installationWatchCancellation.CancelAsync();
        if (_installationWatch is not null) await _installationWatch;
        await StopAsync();
        _installationWatchCancellation.Dispose();
        _http.Dispose();
        _lifecycle.Dispose();
    }

    [GeneratedRegex(@"(?i)\b(token|password|secret|salt)\s*=\s*[^\s,;]+")]
    private static partial Regex SecretAssignment();

    private sealed record UpdateReadiness(bool UpdateAllowed, int ActiveMatchCount);
}
