using System.Security.AccessControl;
using System.Security.Principal;

namespace Netgrid.Windows;

// The installed data-root boundary, not a development export or a second
// database schema. Historical backups and executable caches are not live data.
internal sealed class UpdateDataLayout
{
    public string Root { get; }
    public string ArchiveRoot { get; }
    public IReadOnlyList<string> Excluded { get; }
    public IReadOnlyList<string> ProtectedFiles { get; }

    public UpdateDataLayout(string root, IReadOnlyDictionary<string, string> environment)
    {
        Root = Absolute(root);
        if (!environment.TryGetValue("NETGRID_RUNTIME_PROFILE", out var profile) || profile != "release" ||
            !environment.TryGetValue("NETGRID_DATA_ROOT", out var configured) || !Same(Absolute(configured), Root))
            throw new InvalidOperationException("update_data_environment_scope_invalid");
        ArchiveRoot = Path.Combine(Root, "config", "update-backups");
        var backups = Resolve("NETGRID_STORAGE_BACKUP_DIR", "runtime", "backups");
        string[] installerOwned = [ArchiveRoot, Path.Combine(Root, "config", "updates"),
            Path.Combine(Root, "config", "installer"), Path.Combine(Root, "runtime", "updates")];
        Excluded = [.. installerOwned, backups];
        var match = Resolve("NETGRID_SQLITE_STORAGE_PATH", "runtime", "multiplayer", "netgrid.sqlite");
        var account = environment.TryGetValue("NETGRID_ACCOUNT_SQLITE_PATH", out var accountPath) && !string.IsNullOrWhiteSpace(accountPath)
            ? Absolute(accountPath.Trim()) : match;
        var auth = Resolve("NETGRID_MAINTENANCE_AUTH_PATH", "runtime", "maintenance", "auth.json");
        var decks = Resolve("NETGRID_DECK_LIBRARY_PATH", "runtime", "decks");
        var log = Resolve("NETGRID_CONNECTION_AUDIT_LOG_PATH", "runtime", "logs", "connection-audit.ndjson");
        ProtectedFiles = [Path.Combine(Root, "config", "runtime.env"), auth];
        foreach (var excluded in Excluded) RequireChild(excluded);
        foreach (var live in new[] { match, account, auth, decks, log, ProtectedFiles[0],
            Path.Combine(Root, "card-images"), Path.Combine(Root, "card-image-packs"), Path.Combine(Root, "card-image-import") })
        {
            RequireChild(live);
            if (Excluded.Any(excluded => Within(live, excluded) || Within(excluded, live)))
                throw new InvalidOperationException("update_data_exclusion_overlaps_live_data");
        }
        // A custom backup directory must not swallow the archive/cache owner.
        if (installerOwned.Any(other => Within(backups, other) || Within(other, backups)))
            throw new InvalidOperationException("update_data_backup_scope_invalid");

        string Resolve(string key, params string[] parts) => environment.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value)
            ? Absolute(value.Trim()) : Path.Combine([Root, .. parts]);
    }

    public bool IsExcluded(string path) => Excluded.Any(excluded => Within(path, excluded));
    public bool IsProtected(string path) => ProtectedFiles.Any(file => Same(file, path));
    public string Relative(string path)
    {
        RequireChild(path);
        return Path.GetRelativePath(Root, path);
    }
    public string Target(string relative)
    {
        if (string.IsNullOrEmpty(relative) || Path.IsPathRooted(relative)) throw new InvalidOperationException("update_data_entry_invalid");
        foreach (var part in relative.Split(Path.DirectorySeparatorChar))
        {
            if (part.Length == 0 || part is "." or ".." || part.EndsWith(' ') || part.EndsWith('.') ||
                part.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
                throw new InvalidOperationException("update_data_entry_invalid");
            var stem = part.Split('.')[0].ToUpperInvariant();
            if (stem is "CON" or "PRN" or "AUX" or "NUL" ||
                (stem.Length == 4 && (stem.StartsWith("COM") || stem.StartsWith("LPT")) && stem[3] is >= '1' and <= '9'))
                throw new InvalidOperationException("update_data_entry_invalid");
        }
        var target = Path.GetFullPath(Path.Combine(Root, relative));
        RequireChild(target);
        if (IsExcluded(target) || !string.Equals(Path.GetRelativePath(Root, target), relative, StringComparison.Ordinal))
            throw new InvalidOperationException("update_data_entry_invalid");
        return target;
    }
    public static string Absolute(string path)
    {
        if (string.IsNullOrWhiteSpace(path) || path.Length < 4 || !char.IsAsciiLetter(path[0]) || path[1] != ':' ||
            (path[2] != '\\' && path[2] != '/') || path.IndexOf(':', 2) >= 0 || path.IndexOfAny(['\0', '*', '?']) >= 0)
            throw new InvalidOperationException("update_data_root_invalid");
        var result = Path.TrimEndingDirectorySeparator(Path.GetFullPath(path));
        if (result.Length <= 3) throw new InvalidOperationException("update_data_root_too_broad");
        return result;
    }
    public static bool Same(string left, string right) => left.Equals(right, StringComparison.OrdinalIgnoreCase);
    public static bool Within(string path, string root) => Same(path, root) || path.StartsWith(root + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase);
    private void RequireChild(string path)
    {
        if (Same(path, Root) || !Within(path, Root)) throw new InvalidOperationException("update_data_path_outside_root");
    }
    internal static DirectorySecurity PrivateArchiveSecurity()
    {
        var security = new DirectorySecurity();
        // The ordinary initiating user must not retain owner authority to
        // weaken an archive's DACL after the elevated process exits.
        security.SetOwner(new SecurityIdentifier(WellKnownSidType.BuiltinAdministratorsSid, null));
        security.SetAccessRuleProtection(true, false);
        foreach (var sid in new[] { WellKnownSidType.LocalSystemSid, WellKnownSidType.BuiltinAdministratorsSid })
            security.AddAccessRule(new FileSystemAccessRule(new SecurityIdentifier(sid, null), FileSystemRights.FullControl,
                InheritanceFlags.ContainerInherit | InheritanceFlags.ObjectInherit, PropagationFlags.None, AccessControlType.Allow));
        return security;
    }
}
