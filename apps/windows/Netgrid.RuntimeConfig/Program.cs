using System.Security.AccessControl;
using System.Security.Cryptography;
using System.Security.Principal;
using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Win32;

namespace Netgrid.RuntimeConfig;

internal static class Program
{
    private const string RegistryPath = @"SOFTWARE\LevelX2\NETGRID";
    private const string RegistryDataRootName = "RuntimeDataRoot";
    private const string PlaceholderSecret = "<installer-generated-secret>";

    public static int Main(string[] args)
    {
        try
        {
            Console.OutputEncoding = Encoding.UTF8;
            var command = CommandLine.Parse(args);
            if (string.Equals(command.Name, "remove-firewall", StringComparison.OrdinalIgnoreCase))
            {
                FirewallConfigurator.RemoveRules();
                Console.WriteLine("NETGRID_FIREWALL_REMOVE_OK");
                return 0;
            }
            if (!string.Equals(command.Name, "initialize", StringComparison.OrdinalIgnoreCase))
            {
                throw new RuntimeConfigException(
                    "unsupported_command",
                    "Es wird ausschließlich der Befehl 'initialize' unterstützt."
                );
            }

            var dataRoot = ResolveDataRoot(command.Optional("--data-root"), command.Optional("--state-file"));
            var programRoot = ResolveProgramRoot(command.Optional("--program-root"));
            var templatePath = ResolveTemplatePath(command.Optional("--template"), programRoot);
            ValidateDataRoot(dataRoot, programRoot);
            var network = NetworkSettings.FromCommand(command);

            var state = RuntimeInitializer.Initialize(
                dataRoot,
                programRoot,
                templatePath,
                command.Optional("--state-file"),
                network
            );
            if (command.Optional("--configure-firewall") == "true")
            {
                FirewallConfigurator.Apply(state.Network, programRoot);
            }
            Console.WriteLine(
                $"NETGRID_RUNTIME_CONFIG_OK dataRoot={state.DataRoot} preserved={state.PreservedExistingConfiguration.ToString().ToLowerInvariant()}"
            );
            return 0;
        }
        catch (RuntimeConfigException exception)
        {
            Console.Error.WriteLine(
                $"NETGRID_RUNTIME_CONFIG_ERROR code={exception.Code} message={exception.Message}"
            );
            return 2;
        }
        catch (Exception exception)
        {
            Console.Error.WriteLine(
                $"NETGRID_RUNTIME_CONFIG_ERROR code=unexpected_failure type={exception.GetType().Name}"
            );
            return 3;
        }
    }

    private static string ResolveDataRoot(string? requested, string? stateFile)
    {
        if (!string.IsNullOrWhiteSpace(requested))
        {
            return RequireAbsolutePath(requested, "data_root_invalid");
        }

        if (string.IsNullOrWhiteSpace(stateFile))
        {
            using var key = Registry.LocalMachine.OpenSubKey(RegistryPath, writable: false);
            if (key?.GetValue(RegistryDataRootName) is string registered && !string.IsNullOrWhiteSpace(registered))
            {
                return RequireAbsolutePath(registered, "registered_data_root_invalid");
            }
        }

        return Path.GetFullPath(Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
            "NETGRID"
        ));
    }

    private static string ResolveProgramRoot(string? requested)
    {
        if (!string.IsNullOrWhiteSpace(requested))
        {
            return RequireAbsolutePath(requested, "program_root_invalid");
        }
        var toolRoot = Directory.GetParent(AppContext.BaseDirectory)
            ?? throw new RuntimeConfigException("program_root_invalid", "Der installierte Programmordner konnte nicht bestimmt werden.");
        var programRoot = toolRoot.Parent
            ?? throw new RuntimeConfigException("program_root_invalid", "Der installierte Programmordner konnte nicht bestimmt werden.");
        return Path.TrimEndingDirectorySeparator(programRoot.FullName);
    }

    private static string ResolveTemplatePath(string? requested, string programRoot)
    {
        var value = string.IsNullOrWhiteSpace(requested)
            ? Path.Combine(programRoot, "config", "runtime.env.example")
            : requested;
        return RequireAbsoluteFile(value, "runtime_template_missing");
    }

    private static string RequireAbsoluteFile(string value, string code)
    {
        var fullPath = RequireAbsolutePath(value, code);
        if (!File.Exists(fullPath))
        {
            throw new RuntimeConfigException(code, "Die erforderliche Runtimevorlage fehlt.");
        }
        return fullPath;
    }

    private static string RequireAbsolutePath(string value, string code)
    {
        if (string.IsNullOrWhiteSpace(value) || !Path.IsPathFullyQualified(value))
        {
            throw new RuntimeConfigException(code, "Der Pfad muss absolut sein.");
        }
        if (value.IndexOfAny(['\r', '\n']) >= 0)
        {
            throw new RuntimeConfigException(code, "Der Pfad enthält unzulässige Steuerzeichen.");
        }
        try
        {
            return Path.TrimEndingDirectorySeparator(Path.GetFullPath(value));
        }
        catch (Exception exception) when (exception is ArgumentException or NotSupportedException or PathTooLongException)
        {
            throw new RuntimeConfigException(code, "Der Pfad ist für Windows ungültig.");
        }
    }

    private static void ValidateDataRoot(string dataRoot, string programRoot)
    {
        if (dataRoot.StartsWith(@"\\", StringComparison.Ordinal))
        {
            throw new RuntimeConfigException("data_root_network_share", "Netzwerkfreigaben sind als Datenordner nicht zulässig.");
        }

        var root = Path.GetPathRoot(dataRoot);
        if (string.IsNullOrWhiteSpace(root) || PathsEqual(root, dataRoot))
        {
            throw new RuntimeConfigException("data_root_too_broad", "Eine Laufwerkswurzel ist als Datenordner nicht zulässig.");
        }

        DriveInfo drive;
        try
        {
            drive = new DriveInfo(root);
        }
        catch (Exception exception) when (exception is ArgumentException or IOException)
        {
            throw new RuntimeConfigException("data_root_drive_invalid", "Das Ziellaufwerk ist nicht verfügbar.");
        }
        if (!drive.IsReady || drive.DriveType != DriveType.Fixed)
        {
            throw new RuntimeConfigException("data_root_drive_unsupported", "Der Datenordner muss auf einem dauerhaft verfügbaren lokalen Laufwerk liegen.");
        }

        if (ContainsPath(dataRoot, programRoot) || ContainsPath(programRoot, dataRoot))
        {
            throw new RuntimeConfigException("data_root_program_overlap", "Programm- und Datenordner dürfen sich nicht überlappen.");
        }

        for (var current = new DirectoryInfo(dataRoot); current is not null; current = current.Parent)
        {
            if (current.Exists && (current.Attributes & FileAttributes.ReparsePoint) != 0)
            {
                throw new RuntimeConfigException("data_root_reparse_point", "Der Datenordner darf keinen umgeleiteten Dateisystempfad verwenden.");
            }
        }
    }

    private static bool ContainsPath(string parent, string candidate)
    {
        var relative = Path.GetRelativePath(parent, candidate);
        return relative == "." || (!relative.StartsWith($"..{Path.DirectorySeparatorChar}", StringComparison.Ordinal) && relative != "..");
    }

    private static bool PathsEqual(string left, string right) =>
        string.Equals(
            Path.TrimEndingDirectorySeparator(Path.GetFullPath(left)),
            Path.TrimEndingDirectorySeparator(Path.GetFullPath(right)),
            StringComparison.OrdinalIgnoreCase
        );

    private sealed class CommandLine
    {
        private readonly IReadOnlyDictionary<string, string> _options;

        private CommandLine(string name, IReadOnlyDictionary<string, string> options)
        {
            Name = name;
            _options = options;
        }

        public string Name { get; }

        public string Required(string name) => Optional(name) ?? throw new RuntimeConfigException(
            "argument_missing",
            $"Das erforderliche Argument {name} fehlt."
        );

        public string? Optional(string name) => _options.TryGetValue(name, out var value) ? value : null;

        public static CommandLine Parse(string[] args)
        {
            if (args.Length == 0)
            {
                throw new RuntimeConfigException("command_missing", "Der Runtimekonfigurationsbefehl fehlt.");
            }
            var options = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            for (var index = 1; index < args.Length; index += 2)
            {
                if (index + 1 >= args.Length || !args[index].StartsWith("--", StringComparison.Ordinal))
                {
                    throw new RuntimeConfigException("argument_invalid", "Die Runtimekonfigurationsargumente sind unvollständig.");
                }
                if (!options.TryAdd(args[index], args[index + 1]))
                {
                    throw new RuntimeConfigException("argument_duplicate", $"Das Argument {args[index]} wurde mehrfach angegeben.");
                }
            }
            var allowed = new HashSet<string>(
                [
                    "--data-root",
                    "--program-root",
                    "--template",
                    "--state-file",
                    "--deployment-profile",
                    "--lan-address",
                    "--web-port",
                    "--server-port",
                    "--retention-days",
                    "--configure-firewall",
                ],
                StringComparer.OrdinalIgnoreCase
            );
            var unknown = options.Keys.FirstOrDefault(option => !allowed.Contains(option));
            if (unknown is not null)
            {
                throw new RuntimeConfigException("argument_unknown", $"Das Argument {unknown} ist nicht zulässig.");
            }
            return new CommandLine(args[0], options);
        }
    }

    private sealed class RuntimeConfigException(string code, string message) : Exception(message)
    {
        public string Code { get; } = code;
    }

    private sealed record InitializationResult(
        string DataRoot,
        bool PreservedExistingConfiguration,
        NetworkSettings Network
    );

    private sealed record NetworkSettings(
        string DeploymentProfile,
        string? LanAddress,
        int WebPort,
        int ServerPort,
        string RetentionDays
    )
    {
        private static readonly HashSet<string> RetentionValues = ["7", "30", "90", "180", "365", "never"];

        public bool IsPrivateLan => DeploymentProfile == "private_lan";
        public string PublicHost => IsPrivateLan ? LanAddress! : "127.0.0.1";

        public static NetworkSettings FromCommand(CommandLine command)
        {
            var profile = command.Optional("--deployment-profile") ?? "local";
            if (profile is not ("local" or "private_lan"))
            {
                throw new RuntimeConfigException("deployment_profile_invalid", "Die Betriebsart ist ungültig.");
            }
            var webPort = ParsePort(command.Optional("--web-port") ?? "3100", "web_port_invalid");
            var serverPort = ParsePort(command.Optional("--server-port") ?? "8787", "server_port_invalid");
            if (webPort == serverPort)
            {
                throw new RuntimeConfigException("ports_conflict", "Web- und Serverport müssen verschieden sein.");
            }
            var retention = command.Optional("--retention-days") ?? "30";
            if (!RetentionValues.Contains(retention))
            {
                throw new RuntimeConfigException("retention_invalid", "Die Spielaufbewahrung ist ungültig.");
            }
            var lanAddress = command.Optional("--lan-address");
            if (profile == "private_lan" && !IsPrivateIpv4(lanAddress))
            {
                throw new RuntimeConfigException("lan_address_invalid", "Das private Netzwerk benötigt eine private IPv4-Adresse.");
            }
            return new NetworkSettings(profile, profile == "private_lan" ? lanAddress : null, webPort, serverPort, retention);
        }

        public static NetworkSettings FromEnvironment(string path)
        {
            var values = ReadEnvironment(path);
            var profile = values.GetValueOrDefault("NETGRID_DEPLOYMENT_PROFILE") ?? "local";
            var lanAddress = profile == "private_lan"
                ? new Uri(values.GetValueOrDefault("NETGRID_WEB_BASE_URL") ?? throw new RuntimeConfigException("existing_network_invalid", "Die vorhandene LAN-Konfiguration ist unvollständig.")).Host
                : null;
            return new NetworkSettings(
                profile,
                lanAddress,
                ParsePort(values.GetValueOrDefault("PORT") ?? "3100", "existing_network_invalid"),
                ParsePort(values.GetValueOrDefault("NETGRID_SERVER_PORT") ?? "8787", "existing_network_invalid"),
                values.GetValueOrDefault("NETGRID_INITIAL_CLEANUP_RETENTION_DAYS") ?? "30"
            );
        }

        private static int ParsePort(string value, string code)
        {
            if (!int.TryParse(value, out var port) || port is < 1 or > 65535)
            {
                throw new RuntimeConfigException(code, "Der Port muss zwischen 1 und 65535 liegen.");
            }
            return port;
        }

        private static bool IsPrivateIpv4(string? value)
        {
            if (!IPAddress.TryParse(value, out var address) || address.AddressFamily != System.Net.Sockets.AddressFamily.InterNetwork) return false;
            var bytes = address.GetAddressBytes();
            return bytes[0] == 10 ||
                (bytes[0] == 172 && bytes[1] is >= 16 and <= 31) ||
                (bytes[0] == 192 && bytes[1] == 168);
        }
    }

    private static class RuntimeInitializer
    {
        private static readonly SecurityIdentifier Administrators = new(WellKnownSidType.BuiltinAdministratorsSid, null);
        private static readonly SecurityIdentifier LocalSystem = new(WellKnownSidType.LocalSystemSid, null);
        private static readonly SecurityIdentifier Users = new(WellKnownSidType.BuiltinUsersSid, null);
        private static readonly string[] MutableDirectories =
        [
            "runtime",
            @"runtime\multiplayer",
            @"runtime\backups",
            @"runtime\logs",
            @"runtime\maintenance",
            "card-images",
        ];

        public static InitializationResult Initialize(
            string dataRoot,
            string programRoot,
            string templatePath,
            string? stateFile,
            NetworkSettings requestedNetwork
        )
        {
            Directory.CreateDirectory(dataRoot);
            var configRoot = Path.Combine(dataRoot, "config");
            Directory.CreateDirectory(configRoot);
            foreach (var relative in MutableDirectories)
            {
                var directory = Path.Combine(dataRoot, relative);
                Directory.CreateDirectory(directory);
            }

            var environmentPath = Path.Combine(configRoot, "runtime.env");
            var preserved = File.Exists(environmentPath);
            if (preserved)
            {
                ValidateExistingEnvironment(environmentPath, dataRoot);
            }
            else
            {
                var template = File.ReadAllText(templatePath, Encoding.UTF8);
                var configured = MaterializeEnvironment(template, dataRoot, CreateSecret(), requestedNetwork);
                WriteTextAtomically(environmentPath, configured);
                ApplyFileAcl(environmentPath);
            }
            var effectiveNetwork = preserved
                ? NetworkSettings.FromEnvironment(environmentPath)
                : requestedNetwork;

            var installationState = new
            {
                schemaVersion = "netgrid-windows-install-state-v1",
                dataRoot,
                programRoot,
                deploymentProfile = effectiveNetwork.DeploymentProfile,
                webPort = effectiveNetwork.WebPort,
                serverPort = effectiveNetwork.ServerPort,
                retentionDays = effectiveNetwork.RetentionDays,
            };
            var localStatePath = Path.Combine(configRoot, "install-state.json");
            var localState = JsonSerializer.Serialize(installationState, new JsonSerializerOptions { WriteIndented = true }) + Environment.NewLine;
            if (!File.Exists(localStatePath) || !string.Equals(File.ReadAllText(localStatePath, Encoding.UTF8), localState, StringComparison.Ordinal))
            {
                WriteTextAtomically(localStatePath, localState);
                ApplyFileAcl(localStatePath);
            }

            if (!string.IsNullOrWhiteSpace(stateFile))
            {
                var isolatedStatePath = Path.GetFullPath(stateFile);
                Directory.CreateDirectory(Path.GetDirectoryName(isolatedStatePath)!);
                WriteTextAtomically(isolatedStatePath, JsonSerializer.Serialize(installationState) + Environment.NewLine);
            }
            else
            {
                using var key = Registry.LocalMachine.CreateSubKey(RegistryPath, writable: true)
                    ?? throw new RuntimeConfigException("registry_write_failed", "Der Installationsstatus konnte nicht gespeichert werden.");
                key.SetValue(RegistryDataRootName, dataRoot, RegistryValueKind.String);
            }

            foreach (var relative in MutableDirectories)
            {
                ApplyDirectoryAcl(Path.Combine(dataRoot, relative), FileSystemRights.Modify, inheritToChildren: true);
            }
            ApplyFileAcl(environmentPath);
            ApplyFileAcl(localStatePath);
            ApplyDirectoryAcl(configRoot, FileSystemRights.ReadAndExecute, inheritToChildren: true);
            ApplyDirectoryAcl(dataRoot, FileSystemRights.ReadAndExecute, inheritToChildren: false);

            return new InitializationResult(dataRoot, preserved, effectiveNetwork);
        }

        private static string MaterializeEnvironment(
            string template,
            string dataRoot,
            string secret,
            NetworkSettings network
        )
        {
            if (!template.Contains($"NETGRID_TOKEN_SALT={PlaceholderSecret}", StringComparison.Ordinal))
            {
                throw new RuntimeConfigException("runtime_template_secret_missing", "Die Runtimevorlage enthält keinen eindeutigen Secretplatzhalter.");
            }
            if (!template.Contains("NETGRID_DATA_ROOT=", StringComparison.Ordinal))
            {
                throw new RuntimeConfigException("runtime_template_data_root_missing", "Die Runtimevorlage enthält keinen Datenpfad.");
            }
            var lines = template.Replace("\r\n", "\n", StringComparison.Ordinal).Split('\n');
            var publicHost = network.PublicHost;
            var loopbackWeb = $"http://127.0.0.1:{network.WebPort}";
            var loopbackServer = $"http://127.0.0.1:{network.ServerPort}";
            var publicWeb = $"http://{publicHost}:{network.WebPort}";
            var publicServer = $"http://{publicHost}:{network.ServerPort}";
            var assignments = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["NETGRID_DATA_ROOT"] = $"\"{dataRoot}\"",
                ["NETGRID_SERVER_HOST"] = network.IsPrivateLan ? "0.0.0.0" : "127.0.0.1",
                ["NETGRID_SERVER_PORT"] = network.ServerPort.ToString(),
                ["HOSTNAME"] = network.IsPrivateLan ? "0.0.0.0" : "127.0.0.1",
                ["PORT"] = network.WebPort.ToString(),
                ["NETGRID_DEPLOYMENT_PROFILE"] = network.DeploymentProfile,
                ["NETGRID_WEB_BASE_URL"] = publicWeb,
                ["NETGRID_SERVER_BASE_URL"] = publicServer,
                ["NETGRID_ALLOWED_ORIGINS"] = network.IsPrivateLan ? $"{publicWeb},{loopbackWeb}" : loopbackWeb,
                ["NEXT_PUBLIC_NETGRID_SERVER_URL"] = publicServer,
                ["NETGRID_LAUNCHER_WEB_URL"] = loopbackWeb,
                ["NETGRID_LAUNCHER_SERVER_URL"] = loopbackServer,
                ["NETGRID_TOKEN_SALT"] = secret,
                ["NETGRID_RATE_LIMIT_PROFILE"] = network.IsPrivateLan ? "private_internet" : "local",
                ["NETGRID_MAINTENANCE_BASE_URL"] = loopbackWeb,
                ["NETGRID_MAINTENANCE_ALLOWED_ORIGINS"] = loopbackWeb,
                ["NETGRID_INITIAL_CLEANUP_RETENTION_DAYS"] = network.RetentionDays,
            };
            foreach (var (name, value) in assignments)
            {
                var indexes = lines.Select((line, index) => (line, index))
                    .Where(item => item.line.StartsWith($"{name}=", StringComparison.Ordinal))
                    .Select(item => item.index)
                    .ToArray();
                if (indexes.Length != 1)
                {
                    throw new RuntimeConfigException("runtime_template_ambiguous", $"Die Runtimevorlage enthält den Pflichtwert {name} nicht eindeutig.");
                }
                lines[indexes[0]] = $"{name}={value}";
            }
            return string.Join(Environment.NewLine, lines).TrimEnd() + Environment.NewLine;
        }

        private static void ValidateExistingEnvironment(string environmentPath, string expectedDataRoot)
        {
            var values = ReadEnvironment(environmentPath);
            if (!values.TryGetValue("NETGRID_DATA_ROOT", out var configuredRoot) || !PathsEqual(configuredRoot, expectedDataRoot))
            {
                throw new RuntimeConfigException("existing_data_root_mismatch", "Die vorhandene Runtimekonfiguration gehört zu einem anderen Datenordner.");
            }
            if (!values.TryGetValue("NETGRID_TOKEN_SALT", out var secret) || secret == PlaceholderSecret || secret.Length < 43)
            {
                throw new RuntimeConfigException("existing_secret_invalid", "Die vorhandene Runtimekonfiguration enthält kein gültiges Secret.");
            }
        }

        private static string CreateSecret()
        {
            Span<byte> bytes = stackalloc byte[32];
            RandomNumberGenerator.Fill(bytes);
            return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
        }

        private static void WriteTextAtomically(string target, string content)
        {
            var temporary = $"{target}.{Guid.NewGuid():N}.tmp";
            try
            {
                File.WriteAllText(temporary, content, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
                File.Move(temporary, target, overwrite: true);
            }
            finally
            {
                if (File.Exists(temporary)) File.Delete(temporary);
            }
        }

        private static void ApplyDirectoryAcl(string path, FileSystemRights userRights, bool inheritToChildren)
        {
            var inheritance = inheritToChildren
                ? InheritanceFlags.ContainerInherit | InheritanceFlags.ObjectInherit
                : InheritanceFlags.None;
            var security = new DirectorySecurity();
            security.SetAccessRuleProtection(isProtected: true, preserveInheritance: false);
            security.AddAccessRule(new FileSystemAccessRule(LocalSystem, FileSystemRights.FullControl, inheritance, PropagationFlags.None, AccessControlType.Allow));
            security.AddAccessRule(new FileSystemAccessRule(Administrators, FileSystemRights.FullControl, inheritance, PropagationFlags.None, AccessControlType.Allow));
            security.AddAccessRule(new FileSystemAccessRule(Users, userRights, inheritance, PropagationFlags.None, AccessControlType.Allow));
            new DirectoryInfo(path).SetAccessControl(security);
        }

        private static void ApplyFileAcl(string path)
        {
            var security = new FileSecurity();
            security.SetAccessRuleProtection(isProtected: true, preserveInheritance: false);
            security.AddAccessRule(new FileSystemAccessRule(LocalSystem, FileSystemRights.FullControl, AccessControlType.Allow));
            security.AddAccessRule(new FileSystemAccessRule(Administrators, FileSystemRights.FullControl, AccessControlType.Allow));
            security.AddAccessRule(new FileSystemAccessRule(Users, FileSystemRights.Read, AccessControlType.Allow));
            new FileInfo(path).SetAccessControl(security);
        }
    }

    private static Dictionary<string, string> ReadEnvironment(string path)
    {
        var values = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (var rawLine in File.ReadAllLines(path, Encoding.UTF8))
        {
            var line = rawLine.Trim();
            if (line.Length == 0 || line.StartsWith('#')) continue;
            var separator = line.IndexOf('=');
            if (separator <= 0 || !values.TryAdd(line[..separator], line[(separator + 1)..].Trim().Trim('"')))
            {
                throw new RuntimeConfigException("existing_environment_invalid", "Die vorhandene Runtimekonfiguration enthält mehrdeutige Werte.");
            }
        }
        return values;
    }

    private static class FirewallConfigurator
    {
        private const int PrivateProfile = 2;
        private const int InboundDirection = 1;
        private const int AllowAction = 1;
        private const int TcpProtocol = 6;
        private static readonly string[] RuleNames = ["NETGRID Web (Private)", "NETGRID Server (Private)"];

        public static void Apply(NetworkSettings network, string programRoot)
        {
            RemoveRules();
            if (!network.IsPrivateLan) return;
            var nodePath = Path.Combine(programRoot, "runtime", "node", "node.exe");
            if (!File.Exists(nodePath))
            {
                throw new RuntimeConfigException("firewall_program_missing", "Die installierte Node-Laufzeit für die Firewallregel fehlt.");
            }
            AddRule(RuleNames[0], nodePath, network.WebPort);
            AddRule(RuleNames[1], nodePath, network.ServerPort);
        }

        public static void RemoveRules()
        {
            dynamic policy = CreateCom("HNetCfg.FwPolicy2", "firewall_policy_unavailable");
            foreach (var name in RuleNames)
            {
                var exists = false;
                foreach (dynamic rule in policy.Rules)
                {
                    if (string.Equals((string)rule.Name, name, StringComparison.Ordinal))
                    {
                        exists = true;
                        break;
                    }
                }
                if (exists) policy.Rules.Remove(name);
            }
        }

        private static void AddRule(string name, string applicationPath, int port)
        {
            dynamic policy = CreateCom("HNetCfg.FwPolicy2", "firewall_policy_unavailable");
            dynamic rule = CreateCom("HNetCfg.FWRule", "firewall_rule_unavailable");
            rule.Name = name;
            rule.Description = "Erlaubt NETGRID ausschließlich in privaten Windows-Netzwerken.";
            rule.ApplicationName = applicationPath;
            rule.Protocol = TcpProtocol;
            rule.LocalPorts = port.ToString();
            rule.Direction = InboundDirection;
            rule.Profiles = PrivateProfile;
            rule.Action = AllowAction;
            rule.Enabled = true;
            policy.Rules.Add(rule);
        }

        private static dynamic CreateCom(string programId, string code)
        {
            var type = Type.GetTypeFromProgID(programId)
                ?? throw new RuntimeConfigException(code, "Die Windows-Firewallverwaltung ist nicht verfügbar.");
            return Activator.CreateInstance(type)
                ?? throw new RuntimeConfigException(code, "Die Windows-Firewallverwaltung konnte nicht geöffnet werden.");
        }
    }
}
