using System.Security.AccessControl;
using System.Security.Cryptography;
using System.Security.Principal;
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

            var state = RuntimeInitializer.Initialize(
                dataRoot,
                programRoot,
                templatePath,
                command.Optional("--state-file")
            );
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
            var allowed = new HashSet<string>(["--data-root", "--program-root", "--template", "--state-file"], StringComparer.OrdinalIgnoreCase);
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

    private sealed record InitializationResult(string DataRoot, bool PreservedExistingConfiguration);

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

        public static InitializationResult Initialize(string dataRoot, string programRoot, string templatePath, string? stateFile)
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
                var configured = MaterializeEnvironment(template, dataRoot, CreateSecret());
                WriteTextAtomically(environmentPath, configured);
                ApplyFileAcl(environmentPath);
            }

            var installationState = new
            {
                schemaVersion = "netgrid-windows-install-state-v1",
                dataRoot,
                programRoot,
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

            return new InitializationResult(dataRoot, preserved);
        }

        private static string MaterializeEnvironment(string template, string dataRoot, string secret)
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
            var dataRootAssignments = 0;
            var secretAssignments = 0;
            for (var index = 0; index < lines.Length; index++)
            {
                if (lines[index].StartsWith("NETGRID_DATA_ROOT=", StringComparison.Ordinal))
                {
                    lines[index] = $"NETGRID_DATA_ROOT=\"{dataRoot}\"";
                    dataRootAssignments++;
                }
                if (lines[index].StartsWith("NETGRID_TOKEN_SALT=", StringComparison.Ordinal))
                {
                    lines[index] = $"NETGRID_TOKEN_SALT={secret}";
                    secretAssignments++;
                }
            }
            if (dataRootAssignments != 1 || secretAssignments != 1)
            {
                throw new RuntimeConfigException("runtime_template_ambiguous", "Die Runtimevorlage enthält mehrdeutige Pflichtwerte.");
            }
            return string.Join(Environment.NewLine, lines).TrimEnd() + Environment.NewLine;
        }

        private static void ValidateExistingEnvironment(string environmentPath, string expectedDataRoot)
        {
            var values = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (var rawLine in File.ReadAllLines(environmentPath, Encoding.UTF8))
            {
                var line = rawLine.Trim();
                if (line.Length == 0 || line.StartsWith('#')) continue;
                var separator = line.IndexOf('=');
                if (separator <= 0) continue;
                values[line[..separator]] = line[(separator + 1)..].Trim().Trim('"');
            }
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
}
