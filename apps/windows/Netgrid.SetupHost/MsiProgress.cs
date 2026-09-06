using System.Runtime.InteropServices;

namespace Netgrid.SetupHost;

// MSI progress units are not files, tasks or elapsed time. A reset starts a
// new MSI phase; script preparation explicitly has only an estimated total.
internal sealed record MsiProgressSnapshot(long Position, long Total, bool Preparing, bool Backward)
{
    public bool Determinate => !Preparing && Total > 0 && Position >= 0 && Position <= Total;
    public int? Percent => Determinate ? (int)((decimal)Position * 100 / Total) : null;
}

internal sealed class MsiProgressCounter
{
    private long _actionTicks;
    public MsiProgressSnapshot? Snapshot { get; private set; }

    public void ActionStart() => _actionTicks = 0;

    public MsiProgressSnapshot? ActionData()
    {
        // The MSI contract allows action data before the first progress reset.
        // Without a total it must not be treated as measured progress.
        if (Snapshot is null || _actionTicks == 0) return null;
        return Advance(_actionTicks);
    }

    public MsiProgressSnapshot? Progress(int kind, int amount, int directionOrActionData, int preparing)
    {
        if (kind is < 0 or > 3) throw Invalid("message_type");
        if (kind == 1 && directionOrActionData == 0)
        {
            _actionTicks = 0; // Field 2 is explicitly unused in this case.
            return null;
        }
        if (amount < 0) throw Invalid("negative_or_missing_amount");
        switch (kind)
        {
            case 0:
                if (directionOrActionData is not (0 or 1) || preparing is not (0 or 1))
                    throw Invalid("reset_flags");
                _actionTicks = 0;
                Snapshot = new(directionOrActionData == 0 ? 0 : amount, amount, preparing == 1, directionOrActionData == 1);
                return Snapshot;
            case 1:
                if (directionOrActionData != 1) throw Invalid("action_data_flag");
                _actionTicks = amount;
                return null;
            case 2:
                return Snapshot is null ? null : Advance(amount);
            case 3:
                if (Snapshot is null) return null;
                Snapshot = Snapshot with
                {
                    Total = checked(Snapshot.Total + amount),
                    // Preserve the distance already traversed in reverse mode.
                    Position = checked(Snapshot.Position + (Snapshot.Backward ? amount : 0)),
                };
                return Snapshot;
            default:
                throw Invalid("message_type");
        }
    }

    private MsiProgressSnapshot Advance(long amount)
    {
        var current = Snapshot ?? throw Invalid("reset_missing");
        Snapshot = current with { Position = checked(current.Position + (current.Backward ? -amount : amount)) };
        return Snapshot;
    }

    private static InvalidDataException Invalid(string reason) => new($"msi_progress_invalid:{reason}");
}

// Reads only numeric progress records. ActionData may contain paths or other
// private values; none are formatted, copied, logged or forwarded to the UI.
internal sealed class MsiProgressReader(Action<MsiProgressSnapshot> report)
{
    public const uint ActionStartMessage = 0x08000000;
    public const uint ActionDataMessage = 0x09000000;
    public const uint ProgressMessage = 0x0A000000;
    private readonly MsiProgressCounter _counter = new();
    private readonly object _gate = new();
    public Exception? Failure { get; private set; }

    public int Handle(IntPtr context, uint message, uint record)
    {
        lock (_gate)
        {
            if (Failure is not null) return 2; // IDCANCEL: stop, never fake progress.
            try
            {
                MsiProgressSnapshot? update;
                switch (message & 0xFF000000)
                {
                    case ActionStartMessage:
                        _counter.ActionStart();
                        return 1;
                    case ActionDataMessage:
                        update = _counter.ActionData();
                        break;
                    case ProgressMessage:
                        // Windows Installer also sends progress notifications
                        // with no record or a valid zero-field record, before
                        // any ticks (package opening and server-side startup).
                        // Acknowledge it without changing/reporting the counter.
                        // It is not a malformed numeric record or a cancellation.
                        if (record == 0) return 1;
                        if (MsiRecordGetFieldCount(record) == 0) return 1;
                        update = _counter.Progress(MsiRecordGetInteger(record, 1), MsiRecordGetInteger(record, 2),
                            MsiRecordGetInteger(record, 3), MsiRecordGetInteger(record, 4));
                        break;
                    default:
                        return 0; // Unhandled messages remain owned by Windows Installer.
                }
                if (update is not null) report(update);
                return 1; // IDOK
            }
            catch (Exception exception)
            {
                // Exceptions must never cross the unmanaged callback boundary.
                Failure = exception;
                return 2;
            }
        }
    }

    [DllImport("msi.dll", ExactSpelling = true)]
    private static extern int MsiRecordGetInteger(uint record, uint field);
    [DllImport("msi.dll", ExactSpelling = true)]
    private static extern uint MsiRecordGetFieldCount(uint record);
}
