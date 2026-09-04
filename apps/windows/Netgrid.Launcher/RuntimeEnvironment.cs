namespace Netgrid.Launcher;

internal sealed class RuntimeEnvironment
{
    private readonly IReadOnlyDictionary<string, string> _values;

    private RuntimeEnvironment(IReadOnlyDictionary<string, string> values)
    {
        _values = values;
    }

    public IEnumerable<KeyValuePair<string, string>> Values => _values;

    public string Required(string name)
    {
        if (!_values.TryGetValue(name, out var value) || string.IsNullOrWhiteSpace(value))
            throw new InvalidOperationException($"launcher_environment_missing:{name}");
        if (value.Contains("<installer-generated-secret>", StringComparison.Ordinal))
            throw new InvalidOperationException($"launcher_environment_placeholder:{name}");
        return value;
    }

    public Uri RequiredUri(string name)
    {
        var value = Required(name);
        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            throw new InvalidOperationException($"launcher_environment_uri_invalid:{name}");
        return uri;
    }

    public Uri OptionalUri(string name, string fallbackName)
    {
        if (!_values.TryGetValue(name, out var value) || string.IsNullOrWhiteSpace(value))
            return RequiredUri(fallbackName);
        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            throw new InvalidOperationException($"launcher_environment_uri_invalid:{name}");
        return uri;
    }

    public static RuntimeEnvironment Load(string path)
    {
        if (!File.Exists(path)) throw new InvalidOperationException("launcher_environment_missing");
        var values = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (var rawLine in File.ReadAllLines(path))
        {
            var line = rawLine.Trim();
            if (line.Length == 0 || line.StartsWith('#')) continue;
            var separator = line.IndexOf('=');
            if (separator <= 0) throw new InvalidOperationException("launcher_environment_line_invalid");
            var name = line[..separator].Trim();
            var value = line[(separator + 1)..].Trim();
            if (value.Length >= 2 && value[0] == '"' && value[^1] == '"') value = value[1..^1];
            if (!values.TryAdd(name, value)) throw new InvalidOperationException($"launcher_environment_duplicate:{name}");
        }
        var environment = new RuntimeEnvironment(values);
        environment.Required("NETGRID_DATA_ROOT");
        environment.Required("NETGRID_TOKEN_SALT");
        environment.RequiredUri("NETGRID_SERVER_BASE_URL");
        environment.RequiredUri("NETGRID_WEB_BASE_URL");
        return environment;
    }
}
