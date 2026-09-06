using System.Reflection;
using System.Runtime.InteropServices;

internal static class MsiProgressTests
{
    public static int Run(Assembly assembly)
    {
        var counterType = assembly.GetType("Netgrid.SetupHost.MsiProgressCounter", true)!;
        var snapshotType = assembly.GetType("Netgrid.SetupHost.MsiProgressSnapshot", true)!;
        var counter = Activator.CreateInstance(counterType)!;
        var checks = 0;
        object? Progress(int kind, int amount, int flag = int.MinValue, int preparing = int.MinValue) =>
            counterType.GetMethod("Progress")!.Invoke(counter, [kind, amount, flag, preparing]);
        T Value<T>(object snapshot, string name) => (T)snapshotType.GetProperty(name)!.GetValue(snapshot)!;
        void Assert(bool condition, string name)
        {
            if (!condition) throw new Exception($"msi_progress_test_failed:{name}");
            checks++;
        }
        Assert(Progress(2, 25) is null, "no_progress_before_reset");
        var largest = Activator.CreateInstance(snapshotType, [long.MaxValue, long.MaxValue, false, false])!;
        Assert(Value<int>(largest, "Percent") == 100, "percentage_does_not_overflow_long_counter");
        var snapshot = Progress(0, 1000, 0, 1)!;
        Assert(Value<bool>(snapshot, "Preparing") && !Value<bool>(snapshot, "Determinate"), "preparation_is_not_measured_execution");
        snapshot = Progress(2, 1200)!;
        Assert(Value<long>(snapshot, "Position") == 1200 && snapshotType.GetProperty("Percent")!.GetValue(snapshot) is null, "estimated_total_may_be_exceeded_without_fake_percentage");
        snapshot = Progress(0, 1000, 0, 0)!;
        Assert(Value<long>(snapshot, "Position") == 0 && Value<int>(snapshot, "Percent") == 0, "execution_reset_starts_new_phase");
        snapshot = Progress(2, 250)!;
        Assert(Value<int>(snapshot, "Percent") == 25, "explicit_progress_uses_reported_units");
        Progress(1, 100, 1);
        snapshot = counterType.GetMethod("ActionData")!.Invoke(counter, null)!;
        Assert(Value<long>(snapshot, "Position") == 350, "implicit_action_data_units");
        counterType.GetMethod("ActionStart")!.Invoke(counter, null);
        Assert(counterType.GetMethod("ActionData")!.Invoke(counter, null) is null, "action_boundary_clears_implicit_increment");
        Progress(1, 100, 1);
        Progress(1, int.MinValue, 0);
        Assert(counterType.GetMethod("ActionData")!.Invoke(counter, null) is null, "explicit_mode_ignores_unused_field");
        snapshot = Progress(3, 400)!;
        Assert(Value<long>(snapshot, "Total") == 1400 && Value<long>(snapshot, "Position") == 350 && Value<int>(snapshot, "Percent") == 25, "total_addition_preserves_work_done");
        snapshot = Progress(0, 1000, 1, 0)!;
        Assert(Value<bool>(snapshot, "Backward") && Value<long>(snapshot, "Position") == 1000, "reverse_reset");
        snapshot = Progress(2, 250)!;
        Assert(Value<long>(snapshot, "Position") == 750, "reverse_progress");
        snapshot = Progress(3, 500)!;
        Assert(Value<long>(snapshot, "Position") == 1250 && Value<long>(snapshot, "Total") == 1500, "reverse_addition_preserves_traversed_distance");
        snapshot = Progress(0, 0, 0, 0)!;
        Assert(!Value<bool>(snapshot, "Determinate"), "zero_total_has_no_percentage");
        foreach (var input in new[] { new[] { 4, 1, 0, 0 }, new[] { 0, -1, 0, 0 }, new[] { 0, 1, 2, 0 }, new[] { 0, 1, 0, 2 }, new[] { 1, 1, 2, 0 } })
        {
            try { Progress(input[0], input[1], input[2], input[3]); throw new Exception("invalid_progress_accepted"); }
            catch (TargetInvocationException exception) when (exception.InnerException is InvalidDataException)
            { Assert(true, "invalid_numeric_record_rejected"); }
        }

        // Exercise the actual MSI record API without installing anything.
        var readerType = assembly.GetType("Netgrid.SetupHost.MsiProgressReader", true)!;
        var reportMethod = typeof(MsiProgressTests).GetMethod(nameof(Observe), BindingFlags.Static | BindingFlags.NonPublic)!.MakeGenericMethod(snapshotType);
        var callback = Delegate.CreateDelegate(typeof(Action<>).MakeGenericType(snapshotType), reportMethod);
        var reader = Activator.CreateInstance(readerType, [callback])!;
        var handle = readerType.GetMethod("Handle")!;
        int Handle(uint kind, uint record) => (int)handle.Invoke(reader, [IntPtr.Zero, kind, record])!;
        var record = MsiCreateRecord(4);
        if (record == 0) throw new Exception("msi_test_record_creation_failed");
        try
        {
            _observed = null;
            Assert(Handle(0x0A000000, 0) == 1 && _observed is null && readerType.GetProperty("Failure")!.GetValue(reader) is null,
                "native_empty_progress_notification_is_not_cancellation_or_measured_work");
            foreach (var (field, value) in new[] { (1u, 0), (2u, 500), (3u, 0), (4u, 0) })
                if (MsiRecordSetInteger(record, field, value) != 0) throw new Exception("msi_test_record_write_failed");
            _observed = null;
            Assert(Handle(0x0A000030, record) == 1 && _observed is not null, "native_record_decoded_with_message_flags");
            Assert(Value<long>(_observed!, "Total") == 500, "native_total_matches_record");
            Assert(MsiRecordGetInteger(record, 2) == 500, "callback_does_not_close_installer_owned_record");
            Assert(Handle(0x04000000, 0) == 0, "other_messages_not_intercepted");
            var previousSnapshot = _observed;
            Assert(Handle(0x0A000000, 0) == 1 && ReferenceEquals(_observed, previousSnapshot), "empty_progress_preserves_existing_counter");
            MsiRecordSetInteger(record, 1, 4);
            Assert(Handle(0x0A000000, record) == 2 && readerType.GetProperty("Failure")!.GetValue(reader) is InvalidDataException, "invalid_native_record_cancels_without_throwing_across_callback");
            Assert(Handle(0x0A000000, record) == 2, "failure_is_sticky");
            MsiRecordSetInteger(record, 1, 0);
            var failingCallback = Delegate.CreateDelegate(typeof(Action<>).MakeGenericType(snapshotType),
                typeof(MsiProgressTests).GetMethod(nameof(FailReport), BindingFlags.Static | BindingFlags.NonPublic)!.MakeGenericMethod(snapshotType));
            var failingReader = Activator.CreateInstance(readerType, [failingCallback])!;
            Assert((int)handle.Invoke(failingReader, [IntPtr.Zero, 0x0A000000u, record])! == 2 &&
                readerType.GetProperty("Failure")!.GetValue(failingReader) is IOException,
                "disconnected_report_channel_cancels_callback");
        }
        finally { MsiCloseHandle(record); _observed = null; }

        // Exercise the real external-UI registration, quiet UI and log APIs, but
        // inject a non-installing operation. No MSI product is opened or changed.
        var nativeType = assembly.GetType("Netgrid.SetupHost.MsiNative", true)!;
        var withProgress = nativeType.GetMethod("WithProgress", BindingFlags.Static | BindingFlags.NonPublic)!;
        var logPath = Path.Combine(Path.GetTempPath(), "NETGRID-component-msi-" + Guid.NewGuid().ToString("N") + ".log");
        try
        {
            var cleanReader = Activator.CreateInstance(readerType, [callback])!;
            var called = false;
            Func<uint> noInstall = () => { called = true; return 3010; };
            Assert((uint)withProgress.Invoke(null, [logPath, cleanReader, noInstall])! == 3010 && called,
                "native_callback_and_log_registration_preserve_exit_code_without_installing");
            Assert(MsiSetExternalUIRecord(IntPtr.Zero, 0, IntPtr.Zero, out var previous) == 0 && previous == IntPtr.Zero,
                "native_callback_unregistered_after_completion");
            Func<uint> fail = () => throw new IOException("synthetic_msi_operation_failure");
            try { withProgress.Invoke(null, [logPath, cleanReader, fail]); throw new Exception("native_failure_hidden"); }
            catch (TargetInvocationException exception) when (exception.InnerException is IOException)
            { Assert(true, "native_operation_failure_propagates"); }
            Assert(MsiSetExternalUIRecord(IntPtr.Zero, 0, IntPtr.Zero, out previous) == 0 && previous == IntPtr.Zero,
                "native_callback_unregistered_after_failure");
        }
        finally { if (File.Exists(logPath)) File.Delete(logPath); }
        return checks;
    }

    private static object? _observed;
    private static void Observe<T>(T snapshot) => _observed = snapshot;
    private static void FailReport<T>(T snapshot) => throw new IOException("synthetic_pipe_disconnected");
    [DllImport("msi.dll", ExactSpelling = true)] private static extern uint MsiCreateRecord(uint fields);
    [DllImport("msi.dll", ExactSpelling = true)] private static extern uint MsiRecordSetInteger(uint record, uint field, int value);
    [DllImport("msi.dll", ExactSpelling = true)] private static extern int MsiRecordGetInteger(uint record, uint field);
    [DllImport("msi.dll", ExactSpelling = true)] private static extern uint MsiCloseHandle(uint record);
    [DllImport("msi.dll", ExactSpelling = true)] private static extern uint MsiSetExternalUIRecord(IntPtr handler, uint filter, IntPtr context, out IntPtr previous);
}
