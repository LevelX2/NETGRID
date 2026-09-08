using System.Reflection;
using System.Runtime.ExceptionServices;

internal static class RecoveryTests
{
    internal static int Run(Assembly assembly)
    {
        var checks = 0;
        var execute = assembly.GetType("Netgrid.Updater.UpdateRecovery", true)!.GetMethod("Execute", BindingFlags.NonPublic | BindingFlags.Static)!;
        var parse = assembly.GetType("Netgrid.Updater.RecoveryRequest", true)!.GetMethod("Parse", BindingFlags.Public | BindingFlags.Static)!;
        var valid = Arguments();
        Check(Invoke(parse, [valid]) is not null, "valid_request_rejected");
        foreach (var malformed in new[] { Array.Empty<string>(), new[] { "--repair-worker" },
            Replace(valid, 6, "0"), Replace(valid, 8, "-1"), Replace(valid, 8, long.MaxValue.ToString()),
            Replace(valid, 1, "--different-root"), [.. valid, "extra"] })
            Reject(() => Invoke(parse, [malformed]), "updater_recovery_request_invalid");

        Scenario("success", ["absent", "program", "absent", "data", "health", "absent", "complete"], null);
        Scenario("program", ["absent", "program"], "updater_recovery_program_restore_failed");
        Scenario("data", ["absent", "program", "absent", "data"], "fixture_data_restore_failed");
        Scenario("health", ["absent", "program", "absent", "data", "health"], "updater_recovery_health_failed");
        Scenario("busy-1", ["absent"], "installation_gate_recovery_products_remain");
        Scenario("busy-2", ["absent", "program", "absent"], "installation_gate_recovery_products_remain");
        Scenario("busy-3", ["absent", "program", "absent", "data", "health", "absent"], "installation_gate_recovery_products_remain");
        Scenario("completion", ["absent", "program", "absent", "data", "health", "absent", "complete"], "fixture_completion_failed");
        return checks;

        void Scenario(string mode, string[] expected, string? error)
        {
            var trace = new List<string>();
            var absence = 0;
            Func<int> program = () => { trace.Add("program"); return mode == "program" ? 1603 : 0; };
            Action data = () => { trace.Add("data"); if (mode == "data") throw new InvalidOperationException("fixture_data_restore_failed"); };
            Func<bool> health = () => { trace.Add("health"); return mode != "health"; };
            Func<bool> busy = () => { trace.Add("absent"); return mode == "busy-" + ++absence; };
            Action complete = () => { trace.Add("complete"); if (mode == "completion") throw new InvalidOperationException("fixture_completion_failed"); };
            Action run = () => Invoke(execute, [program, data, health, busy, complete]);
            if (error is null) run(); else Reject(run, error);
            Check(trace.SequenceEqual(expected), "operation_order_" + mode);
        }
        void Check(bool value, string code) { checks++; if (!value) throw new Exception("recovery_test_failed:" + code); }
        void Reject(Action action, string code)
        {
            checks++;
            try { action(); }
            catch (InvalidOperationException error) when (error.Message == code) { return; }
            throw new Exception("recovery_test_accepted:" + code);
        }
    }
    private static string[] Arguments() => ["--repair-worker", "--program-root", @"C:\NETGRID-recovery-fixture\program", "--lease",
        Guid.NewGuid().ToString("N"), "--parent-pid", "1234", "--parent-start", "638000000000000000"];
    private static string[] Replace(string[] input, int index, string value) { var result = input.ToArray(); result[index] = value; return result; }
    private static object? Invoke(MethodInfo method, object?[] args)
    {
        try { return method.Invoke(null, args); }
        catch (TargetInvocationException error) when (error.InnerException is not null)
        { ExceptionDispatchInfo.Capture(error.InnerException).Throw(); throw; }
    }
}
