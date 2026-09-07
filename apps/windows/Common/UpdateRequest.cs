using System.Globalization;

namespace Netgrid.Windows;

internal sealed record UpdateRequest(int ParentPid, long ParentStart, string SetupPath, string SetupSha256,
    string ProgramRoot, string EnvironmentFile, string Lease, string Session, bool Restart)
{
    public static UpdateRequest Parse(string[] args)
    {
        if (args.Length == 0 || args[0] != "--apply") throw new InvalidOperationException("updater_arguments_invalid");
        var values = new Dictionary<string, string>(StringComparer.Ordinal);
        var restart = false;
        for (var index = 1; index < args.Length; index++)
        {
            var key = args[index];
            if (key == "--restart" && !restart) { restart = true; continue; }
            if (key is not ("--parent-pid" or "--parent-start" or "--setup" or "--sha256" or "--program-root" or
                "--environment-file" or "--update-lease" or "--handoff-session") || index + 1 >= args.Length ||
                !values.TryAdd(key, args[++index])) throw new InvalidOperationException("updater_arguments_invalid");
        }
        string Required(string key) => values.TryGetValue(key, out var value) ? value : throw new InvalidOperationException("updater_arguments_incomplete");
        if (!int.TryParse(Required("--parent-pid"), NumberStyles.None, CultureInfo.InvariantCulture, out var pid) || pid <= 0 ||
            !long.TryParse(Required("--parent-start"), NumberStyles.None, CultureInfo.InvariantCulture, out var time) || time <= 0 || time > DateTime.MaxValue.Ticks)
            throw new InvalidOperationException("updater_parent_invalid");
        string FullPath(string key)
        {
            var value = Required(key);
            if (!Path.IsPathFullyQualified(value)) throw new InvalidOperationException("updater_path_invalid");
            return Path.GetFullPath(value);
        }
        var root = Path.TrimEndingDirectorySeparator(FullPath("--program-root"));
        InstallationGate.KeyFor(root);
        var hash = Required("--sha256").ToLowerInvariant();
        if (hash.Length != 64 || !hash.All(Uri.IsHexDigit)) throw new InvalidOperationException("updater_hash_invalid");
        var lease = Required("--update-lease");
        InstallationGate.ValidateLease(lease);
        var session = Required("--handoff-session");
        UpdateHandoff.PipeName(session);
        return new(pid, time, FullPath("--setup"), hash, root, FullPath("--environment-file"), lease, session, restart);
    }

    public string[] Arguments() => ["--apply", "--parent-pid", ParentPid.ToString(CultureInfo.InvariantCulture),
        "--parent-start", ParentStart.ToString(CultureInfo.InvariantCulture), "--setup", SetupPath, "--sha256", SetupSha256,
        "--program-root", ProgramRoot, "--environment-file", EnvironmentFile, "--update-lease", Lease,
        "--handoff-session", Session, ..(Restart ? new[] { "--restart" } : Array.Empty<string>())];
}
