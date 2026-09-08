using System.Globalization;
using System.Net;
using Microsoft.Win32;

namespace Netgrid.SetupHost;

internal sealed record ExistingSetupRegistration(string? ProgramRoot, string? DataRoot, bool DesktopShortcut)
{
    public bool Installed => ProgramRoot is not null;

    public static ExistingSetupRegistration Read()
    {
        using var machine = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64);
        using var key = machine.OpenSubKey(@"SOFTWARE\LevelX2\NETGRID", writable: false);
        return Parse(key?.GetValue("InstallDirectory"), key?.GetValue("RuntimeDataRoot"),
            key?.GetValue("CurrentProductCode"), key?.GetValue("DesktopShortcutPreference"));
    }

    public static ExistingSetupRegistration Parse(object? program, object? data, object? product, object? desktop)
    {
        if ((program is null) != (product is null) || (program is not null && data is null))
            throw new SetupException("existing_configuration_invalid");
        if (product is not null && (product is not string code || !Guid.TryParseExact(code, "B", out var id) || id == Guid.Empty))
            throw new SetupException("existing_configuration_invalid");
        return new(program is null ? null : Root(program), data is null ? null : Root(data),
            program is null || Installer.ReadDesktopShortcutPreference(desktop) == "1");
    }

    internal static string Root(object value)
    {
        if (value is not string path || !Path.IsPathFullyQualified(path) || path.StartsWith(@"\\", StringComparison.Ordinal))
            throw new SetupException("existing_configuration_invalid");
        try
        {
            var full = Path.TrimEndingDirectorySeparator(Path.GetFullPath(path));
            if (full == Path.TrimEndingDirectorySeparator(Path.GetPathRoot(full)!))
                throw new SetupException("existing_configuration_invalid");
            return full;
        }
        catch (Exception error) when (error is ArgumentException or NotSupportedException or PathTooLongException)
        { throw new SetupException("existing_configuration_invalid"); }
    }
}

/** Read-only projection of installer-owned configuration. Never read auth.json or expose secrets. */
internal sealed record ExistingSetupConfiguration(string Profile, string? LanAddress, int WebPort, int ServerPort,
    string RetentionDays, string AccountAccessMode)
{
    private static readonly HashSet<string> Fields = new(StringComparer.Ordinal)
    {
        "NETGRID_DATA_ROOT", "NETGRID_DEPLOYMENT_PROFILE", "PORT", "NETGRID_SERVER_PORT",
        "NETGRID_WEB_BASE_URL", "NETGRID_SERVER_BASE_URL", "NETGRID_INITIAL_CLEANUP_RETENTION_DAYS",
        "NETGRID_ACCOUNT_ACCESS_MODE",
    };

    public static ExistingSetupConfiguration? Read(string dataRoot, bool required)
    {
        var root = ExistingSetupRegistration.Root(dataRoot);
        var path = Path.Combine(root, "config", "runtime.env");
        if (!File.Exists(path))
        {
            if (required || File.Exists(Path.Combine(root, "config", "install-state.json")))
                throw new SetupException("existing_configuration_missing");
            return null;
        }
        return Parse(File.ReadLines(path), root);
    }

    public static ExistingSetupConfiguration Parse(IEnumerable<string> lines, string dataRoot)
    {
        var values = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (var raw in lines)
        {
            var line = raw.Trim();
            if (line.StartsWith('#')) continue;
            var separator = line.IndexOf('=');
            if (separator < 1) continue;
            var name = line[..separator].Trim();
            // Only these public installation values become UI state. All other
            // environment fields, including credentials, are deliberately excluded.
            if (!Fields.Contains(name)) continue;
            var value = line[(separator + 1)..].Trim();
            if (value.Length >= 2 && value[0] == '"' && value[^1] == '"') value = value[1..^1];
            if (!values.TryAdd(name, value)) throw new SetupException("existing_configuration_invalid");
        }
        if (values.Count != Fields.Count || !ExistingSetupRegistration.Root(values["NETGRID_DATA_ROOT"])
                .Equals(ExistingSetupRegistration.Root(dataRoot), StringComparison.OrdinalIgnoreCase))
            throw new SetupException("existing_configuration_invalid");
        var profile = values["NETGRID_DEPLOYMENT_PROFILE"];
        var webPort = Port(values["PORT"]);
        var serverPort = Port(values["NETGRID_SERVER_PORT"]);
        var web = Endpoint(values["NETGRID_WEB_BASE_URL"], webPort);
        var server = Endpoint(values["NETGRID_SERVER_BASE_URL"], serverPort);
        if (web.Host != server.Host || webPort == serverPort || profile is not ("local" or "private_lan"))
            throw new SetupException("existing_configuration_invalid");
        if (profile == "local" ? web.Host != "127.0.0.1" :
            !IPAddress.TryParse(web.Host, out var address) || !NetworkSelection.IsPrivate(address))
            throw new SetupException("existing_configuration_invalid");
        var retention = values["NETGRID_INITIAL_CLEANUP_RETENTION_DAYS"];
        var account = values["NETGRID_ACCOUNT_ACCESS_MODE"];
        if (!SetupContract.RetentionChoices.Any(choice => choice.Value == retention) || account is not ("simple" or "protected"))
            throw new SetupException("existing_configuration_invalid");
        return new(profile, profile == "private_lan" ? web.Host : null, webPort, serverPort, retention, account);
    }

    private static int Port(string value) => int.TryParse(value, NumberStyles.None, CultureInfo.InvariantCulture, out var port)
        && port is > 0 and <= 65535 ? port : throw new SetupException("existing_configuration_invalid");

    private static Uri Endpoint(string value, int port)
    {
        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) || uri.Scheme != "http" || uri.Port != port ||
            uri.UserInfo != "" || uri.AbsolutePath != "/" || uri.Query != "" || uri.Fragment != "")
            throw new SetupException("existing_configuration_invalid");
        return uri;
    }
}
