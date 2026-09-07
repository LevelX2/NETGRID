using Netgrid.Windows;

internal static class RequestTests
{
    public static void Run()
    {
        var checks = 0;
        var original = new UpdateRequest(123, DateTime.UtcNow.Ticks, @"C:\NETGRID Data\runtime\updates\staging\setup.exe",
            new string('a', 64), @"C:\Program Files\NETGRID", @"C:\NETGRID Data\config\runtime.env",
            Guid.NewGuid().ToString("N"), Guid.NewGuid().ToString("N"), true);
        var arguments = original.Arguments();
        Assert(UpdateRequest.Parse(arguments) == original, "roundtrip_preserves_every_binding");
        Assert(!UpdateRequest.Parse(arguments[..^1]).Restart, "restart_is_explicit");
        Reject([], "empty");
        Reject(["--apply"], "old_unbound_request_rejected");
        Reject([..arguments, "--restart"], "duplicate_restart");
        Reject([..arguments, "--unknown", "value"], "unknown_parameter");
        for (var index = 1; index < arguments.Length - 1; index += 2)
        {
            Reject(arguments.Take(index).Concat(arguments.Skip(index + 2)).ToArray(), "missing_" + arguments[index]);
            Reject([..arguments, arguments[index], arguments[index + 1]], "duplicate_" + arguments[index]);
            Reject([..arguments, arguments[index]], "no_value_" + arguments[index]);
        }
        foreach (var (key, bad) in new[] {
            ("--parent-pid", "0"), ("--parent-pid", "-1"), ("--parent-pid", "+123"),
            ("--parent-start", "0"), ("--parent-start", long.MaxValue.ToString()),
            ("--setup", "relative.exe"), ("--program-root", "C:\\"), ("--environment-file", "runtime.env"),
            ("--sha256", new string('z', 64)), ("--sha256", "abcd"),
            ("--update-lease", Guid.Empty.ToString("N")), ("--update-lease", Guid.NewGuid().ToString("D")),
            ("--handoff-session", "../escape"), ("--handoff-session", Guid.Empty.ToString("N")) })
        {
            var modified = arguments.ToArray(); modified[Array.IndexOf(modified, key) + 1] = bad;
            Reject(modified, "invalid_" + key);
        }
        Console.WriteLine($"UPDATE_REQUEST_TESTS_OK checks={checks} legacyUnboundRequests=rejected");
        void Assert(bool value, string name) { if (!value) throw new Exception("request_test_failed:" + name); checks++; }
        void Reject(string[] input, string name)
        {
            try { UpdateRequest.Parse(input); }
            catch (Exception error) when (error is InvalidOperationException or InvalidDataException) { checks++; return; }
            throw new Exception("request_rejection_missing:" + name);
        }
    }
}
