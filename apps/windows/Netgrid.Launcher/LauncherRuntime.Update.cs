namespace Netgrid.Launcher;

internal sealed partial class LauncherRuntime
{
    // The existing lifecycle lock owns preparation through cancellation or
    // verified stop. There is no parallel update/recovery process owner.
    public Task<PreparedUpdate> PrepareUpdateAsync() => PrepareUpdateAsync(
        UpdatePreparationClient.Create(_serverUrl, _controlToken));

    internal async Task<PreparedUpdate> PrepareUpdateAsync(UpdatePreparationClient client)
    {
        try { await _lifecycle.WaitAsync(); }
        catch { client.Dispose(); throw; }
        try
        {
            ThrowIfInstallationStopping();
            if (_installationBlocked()) throw new InvalidOperationException("launcher_installation_stopping");
            if (_stopping || _server is not { HasExited: false } || _web is not { HasExited: false })
                throw new InvalidOperationException("launcher_update_runtime_not_running");
        }
        catch
        {
            client.Dispose();
            _lifecycle.Release();
            throw;
        }

        var prepared = new PreparedUpdate(this, client);
        try
        {
            prepared.Status = await client.PrepareAsync();
            return prepared;
        }
        catch (Exception preparationError)
        {
            // Even a lost POST response can leave the server reservation held.
            // The same client's nonce must receive a successful DELETE ack.
            try { await prepared.CancelAsync(); }
            catch (Exception cancellationError)
            {
                throw new AggregateException("launcher_update_preparation_unresolved", preparationError, cancellationError);
            }
            throw;
        }
    }

    internal sealed class PreparedUpdate(LauncherRuntime runtime, UpdatePreparationClient client) : IAsyncDisposable
    {
        private int _operation; // 0 idle, 1 executing, 2 resolved/closed
        public UpdatePreparationStatus Status { get; internal set; } = null!;
        public bool Stopped { get; private set; }

        public async Task CancelAsync()
        {
            Enter();
            try { await client.CancelAsync(); }
            catch (Exception cancellationError)
            {
                // Unknown cancellation is not permission to resume. Stop via
                // this same owner while it still holds the lifecycle lock.
                Interlocked.Exchange(ref runtime._installationStopping, 1);
                runtime._stopping = true;
                try { await runtime.StopProcessesAsync(); }
                catch (Exception stopError)
                {
                    throw new AggregateException("launcher_update_cancel_and_stop_failed", cancellationError, stopError);
                }
                throw;
            }
            finally { Complete(); }
        }

        public async Task StopAsync()
        {
            Enter();
            if (Status is not { Allowed: true })
            {
                Volatile.Write(ref _operation, 0);
                throw new InvalidOperationException("launcher_update_not_prepared");
            }
            Interlocked.Exchange(ref runtime._installationStopping, 1);
            runtime._stopping = true;
            try
            {
                // No forced-server-stop success in the update path: the server
                // must accept shutdown and exit zero after its close promise.
                await runtime.StopProcessesAsync(requireGracefulServer: true);
                Stopped = true;
            }
            finally { Complete(); }
        }

        private void Enter()
        {
            if (Interlocked.CompareExchange(ref _operation, 1, 0) != 0)
                throw new InvalidOperationException("launcher_update_preparation_phase_invalid");
        }

        private void Complete()
        {
            try { client.Dispose(); }
            finally
            {
                Volatile.Write(ref _operation, 2);
                runtime._lifecycle.Release();
            }
        }

        // A caller cannot silently abandon a held server reservation. Disposal
        // cancels explicitly; cancellation failure is surfaced and stays stopped.
        public ValueTask DisposeAsync() => Volatile.Read(ref _operation) == 2
            ? ValueTask.CompletedTask : new ValueTask(CancelAsync());
    }
}
