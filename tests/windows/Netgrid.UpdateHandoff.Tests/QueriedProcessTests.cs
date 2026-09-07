using System.Diagnostics;
using Netgrid.Windows;

internal static class QueriedProcessTests
{
    internal static async Task<int> RunAsync()
    {
        var checks = 0;
        void Reject(Action operation, string code)
        {
            try { operation(); throw new Exception("query_peer_test_accepted:" + code); }
            catch (InvalidOperationException error) when (error.Message == code) { checks++; }
        }
        using var current = Process.GetCurrentProcess();
        using (var live = UpdateHandoff.QueriedProcess.Open(current.Id, current.StartTime.ToUniversalTime().Ticks))
        { live.RequireAlive(); checks++; }
        Reject(() => UpdateHandoff.QueriedProcess.Open(0, 1), "installation_gate_msi_owner_invalid");
        Reject(() => UpdateHandoff.QueriedProcess.Open(current.Id, current.StartTime.ToUniversalTime().Ticks + 1), "installation_gate_msi_owner_exited_or_reused");
        var start = new ProcessStartInfo(Environment.ProcessPath!)
        {
            Arguments = "--query-peer-child", UseShellExecute = false, CreateNoWindow = true,
            RedirectStandardInput = true, RedirectStandardOutput = true
        };
        using var child = Process.Start(start)!;
        try
        {
            if (await child.StandardOutput.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(5)) != "READY") throw new Exception("query_peer_fixture_not_ready");
            using var bound = UpdateHandoff.QueriedProcess.Open(child.Id, child.StartTime.ToUniversalTime().Ticks);
            bound.RequireAlive(); checks++;
            await child.StandardInput.WriteLineAsync("exit"); child.StandardInput.Close();
            await child.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(5));
            if (child.ExitCode != 259) throw new Exception("query_peer_fixture_wrong_exit");
            Reject(bound.RequireAlive, "installation_gate_msi_owner_exited_or_reused");
        }
        finally { if (!child.HasExited) { child.Kill(); await child.WaitForExitAsync(); } }
        return checks;
    }
}
