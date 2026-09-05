using System.Reflection;
using System.Runtime.ExceptionServices;

var scratch = Path.Combine(Path.GetTempPath(), $"netgrid-updater-unit-{Guid.NewGuid():N}");
Directory.CreateDirectory(scratch);
try
{
    var updater = Assembly.Load("NETGRID.Updater");
    var transaction = updater.GetType("Netgrid.Updater.UpdateTransaction", throwOnError: true)!;
    var readEnvironment = transaction.GetMethod("ReadEnvironment", BindingFlags.NonPublic | BindingFlags.Static)!;
    var fixture = Path.Combine(scratch, "runtime.env");
    var dataRoot = Path.Combine(scratch, "NETGRID Data");
    File.WriteAllText(fixture, $"# installer-generated format\nNETGRID_DATA_ROOT=\"{dataRoot}\"\nNETGRID_TOKEN_SALT=synthetic=value\nPORT=32141\n");
    var values = Read();
    Assert(values["NETGRID_DATA_ROOT"] == dataRoot, "quoted_data_root_not_decoded");
    Assert(values["NETGRID_TOKEN_SALT"] == "synthetic=value", "value_separator_changed");
    Assert(Path.GetFullPath(values["NETGRID_DATA_ROOT"]) == dataRoot, "data_root_not_a_windows_path");
    var writeFailure = transaction.GetMethod("WriteFailure", BindingFlags.NonPublic | BindingFlags.Static)!;
    var logPath = Path.Combine(scratch, "updater.log");
    writeFailure.Invoke(null, [logPath, new InvalidOperationException("updater_storage_failed:synthetic=value\r\nfile is not a database"), values]);
    var failureLog = File.ReadAllText(logPath);
    Assert(failureLog.Contains("transaction_failed:InvalidOperationException:updater_storage_failed:"), "failure_owner_code_not_logged");
    Assert(failureLog.Contains("file is not a database"), "failure_cause_not_logged");
    Assert(!failureLog.Contains("synthetic=value") && failureLog.Contains("<redacted>"), "failure_log_secret_leak");
    Assert(File.ReadAllLines(logPath).Length == 1, "failure_log_line_injection");
    writeFailure.Invoke(null, [logPath, new InvalidOperationException(new string('x', 2000)), values]);
    Assert(File.ReadAllLines(logPath).All(line => line.Length < 450), "failure_log_unbounded");

    File.WriteAllText(fixture, "PORT=32141\nPORT=32142\n");
    ExpectInvalid("updater_environment_duplicate:PORT");
    File.WriteAllText(fixture, "NETGRID_DATA_ROOT=\"C:\\NETGRID Data\n");
    ExpectInvalid("updater_environment_quotes_invalid");
    Console.WriteLine("WINDOWS_UPDATER_UNIT_TEST_OK quotedPaths=true duplicateAndMalformedValues=rejected failureCause=redacted-and-bounded");

    IReadOnlyDictionary<string, string> Read()
    {
        try { return (IReadOnlyDictionary<string, string>)readEnvironment.Invoke(null, [fixture])!; }
        catch (TargetInvocationException exception) when (exception.InnerException is not null)
        {
            ExceptionDispatchInfo.Capture(exception.InnerException).Throw();
            throw;
        }
    }

    void ExpectInvalid(string code)
    {
        try { Read(); }
        catch (InvalidOperationException exception) when (exception.Message == code) { return; }
        throw new InvalidOperationException($"expected_error_missing:{code}");
    }
}
finally
{
    // The only recursive removal is the exact fresh fixture directory above.
    Directory.Delete(scratch, recursive: true);
}

static void Assert(bool condition, string code)
{
    if (!condition) throw new InvalidOperationException(code);
}
