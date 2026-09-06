using System.Diagnostics;
using System.IO.Pipes;
using System.Reflection;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Text;
using System.Text.Json.Nodes;

internal static class InstallationWorkerTests
{
    public static int Run(Assembly assembly)
    {
        var checks = 0;
        void Assert(bool value, string name)
        {
            if (!value) throw new Exception("installation_worker_test_failed:" + name);
            checks++;
        }
        void Reject(Action action, string name)
        {
            try { action(); }
            catch (TargetInvocationException exception) when (exception.InnerException is not null) { Assert(true, name); return; }
            throw new Exception("installation_worker_invalid_input_accepted:" + name);
        }
        var requestType = assembly.GetType("Netgrid.SetupHost.InstallationRequest", true)!;
        var settingsType = assembly.GetType("Netgrid.SetupHost.SetupSettings", true)!;
        var frameType = assembly.GetType("Netgrid.SetupHost.InstallationFrame", true)!;
        var workerType = assembly.GetType("Netgrid.SetupHost.InstallationWorker", true)!;
        var systemDrive = Path.GetPathRoot(Environment.SystemDirectory)!;
        var settings = Activator.CreateInstance(settingsType, ["local", null, Path.Combine(systemDrive, "NETGRID-component-program"),
            Path.Combine(systemDrive, "NETGRID-component-data"), 3191, 8791, "30", "simple", true])!;
        using var current = Process.GetCurrentProcess();
        var request = Activator.CreateInstance(requestType, [Guid.NewGuid().ToString("N"), current.Id,
            current.StartTime.ToUniversalTime().Ticks, "de", settings])!;
        var encoded = (string)requestType.GetMethod("Encode")!.Invoke(request, null)!;
        var decodeRequest = requestType.GetMethod("Decode")!;
        var decoded = decodeRequest.Invoke(null, [encoded])!;
        Assert(request.Equals(decoded), "typed_settings_roundtrip");
        var json = JsonNode.Parse(Convert.FromBase64String(encoded))!.AsObject();
        Assert(json.Count == 5 && !json.ContainsKey("LogPath") && !json.ContainsKey("PipeName") && !json.ContainsKey("DirectoryPath"),
            "only_typed_settings_and_process_binding_serialized");
        var directory = (string)requestType.GetMethod("DirectoryPath")!.Invoke(request, null)!;
        Assert(Path.GetDirectoryName(directory) == Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows), "Temp"),
            "worker_payload_and_log_use_system_temporary_drive");
        foreach (var (key, value) in new (string, JsonNode?)[]
        {
            ("Session", "../unsafe"), ("ParentId", 0), ("ParentStart", 0L), ("Language", "es"),
            ("Settings", null), ("MsiPath", @"C:\untrusted.msi"), ("LogPath", @"C:\Windows\unsafe.txt"),
        })
        {
            var invalid = json.DeepClone().AsObject(); invalid[key] = value;
            Reject(() => decodeRequest.Invoke(null, [Convert.ToBase64String(Encoding.UTF8.GetBytes(invalid.ToJsonString()))]), "request_" + key);
        }
        foreach (var (key, value) in new (string, JsonNode?)[]
        {
            ("Profile", "public"), ("AccountAccessMode", "unknown"), ("RetentionDays", "999"), ("WebPort", 0),
            ("ServerPort", 65536), ("ServerPort", 3191), ("LanAddress", "10.0.0.1"), ("ProgramRoot", null),
        })
        {
            var invalid = json.DeepClone().AsObject(); invalid["Settings"]![key] = value;
            Reject(() => decodeRequest.Invoke(null, [Convert.ToBase64String(Encoding.UTF8.GetBytes(invalid.ToJsonString()))]), "setting_" + key);
        }
        var missing = json.DeepClone(); missing["Settings"]!.AsObject().Remove("DesktopShortcut");
        Reject(() => decodeRequest.Invoke(null, [Convert.ToBase64String(Encoding.UTF8.GetBytes(missing.ToJsonString()))]), "missing_bool_is_not_silent_false");
        foreach (var address in new[] { "8.8.8.8", "::1", "not-an-ip" })
        {
            var invalid = json.DeepClone(); invalid["Settings"]!["Profile"] = "private_lan";
            invalid["Settings"]!["LanAddress"] = address;
            Reject(() => decodeRequest.Invoke(null, [Convert.ToBase64String(Encoding.UTF8.GetBytes(invalid.ToJsonString()))]), "private_lan_ipv4_required");
        }
        Reject(() => decodeRequest.Invoke(null, [new string('a', 24001)]), "bounded_request_size");
        Reject(() => decodeRequest.Invoke(null, ["not base64"]), "invalid_base64");

        var decodeFrame = frameType.GetMethod("Decode")!;
        foreach (var args in new object[][]
        {
            [1, 0L, 0L, 0, 0], [2, 25L, 100L, 0, 0], [2, 120L, 100L, 1, 0],
            [2, -10L, 100L, 2, 0], [3, 0L, 0L, 0, 3010], [4, 0L, 0L, 3, -123],
        })
        {
            var frame = Activator.CreateInstance(frameType, args)!;
            var bytes = (byte[])frameType.GetMethod("Encode")!.Invoke(frame, null)!;
            Assert(bytes.Length == 32 && frame.Equals(decodeFrame.Invoke(null, [bytes])), "fixed_numeric_frame_roundtrip");
        }
        foreach (var args in new object[][] { [0, 0L, 0L, 0, 0], [1, 1L, 0L, 0, 0], [2, 0L, -1L, 0, 0],
            [2, 0L, 1L, 4, 0], [2, 0L, 1L, 0, 1], [3, 0L, 0L, 0, -1], [4, 0L, 0L, 6, 0] })
        {
            var frame = Activator.CreateInstance(frameType, args)!;
            var bytes = (byte[])frameType.GetMethod("Encode")!.Invoke(frame, null)!;
            Reject(() => decodeFrame.Invoke(null, [bytes]), "invalid_frame_fields");
        }
        Reject(() => decodeFrame.Invoke(null, [new byte[32]]), "invalid_protocol_magic");
        Reject(() => decodeFrame.Invoke(null, [new byte[33]]), "invalid_protocol_size");

        // Real Windows pipe and kernel peer queries; no elevation, MSI launch,
        // installed data or secret fields are involved in this component test.
        var name = "NETGRID-component-" + Guid.NewGuid().ToString("N");
        using var server = (NamedPipeServerStream)workerType.GetMethod("CreateServer")!.Invoke(null, [name])!;
        var security = server.GetAccessControl();
        var rules = security.GetAccessRules(true, false, typeof(SecurityIdentifier)).Cast<PipeAccessRule>().ToArray();
        Assert(security.AreAccessRulesProtected, "pipe_dacl_not_inherited");
        Assert(rules.Any(rule => rule.IdentityReference.Value == "S-1-5-2" && rule.AccessControlType == AccessControlType.Deny), "network_pipe_access_denied");
        Assert(rules.Any(rule => rule.IdentityReference.Value == "S-1-5-32-544" && rule.AccessControlType == AccessControlType.Allow), "alternate_windows_administrator_can_connect");
        Assert(!rules.Any(rule => rule.IdentityReference.Value == "S-1-1-0" && rule.AccessControlType == AccessControlType.Allow), "no_world_access");
        Reject(() => workerType.GetMethod("CreateServer")!.Invoke(null, [name]), "pipe_cannot_be_replaced_by_second_server");
        var waiting = server.WaitForConnectionAsync();
        using var client = new NamedPipeClientStream(".", name, PipeDirection.Out, PipeOptions.Asynchronous, TokenImpersonationLevel.Anonymous);
        client.Connect(5000); waiting.WaitAsync(TimeSpan.FromSeconds(5)).GetAwaiter().GetResult();
        var requirePeer = workerType.GetMethod("RequirePeer")!;
        requirePeer.Invoke(null, [server, current.Id, true]);
        requirePeer.Invoke(null, [client, current.Id, false]);
        Assert(true, "both_peer_ids_verified_by_kernel");
        Reject(() => requirePeer.Invoke(null, [server, current.Id + 1, true]), "wrong_client_rejected");
        Reject(() => requirePeer.Invoke(null, [client, current.Id + 1, false]), "wrong_server_rejected");
        var expected = Activator.CreateInstance(frameType, [2, 42L, 100L, 0, 0])!;
        var payload = (byte[])frameType.GetMethod("Encode")!.Invoke(expected, null)!;
        client.Write(payload, 0, 7); client.Write(payload, 7, payload.Length - 7);
        var received = new byte[32]; server.ReadExactly(received);
        Assert(expected.Equals(decodeFrame.Invoke(null, [received])), "fragmented_pipe_delivery_preserves_frame");
        client.Dispose();
        try { server.ReadExactly(new byte[32]); throw new Exception("broken_pipe_accepted"); }
        catch (EndOfStreamException) { Assert(true, "worker_exit_is_not_success_frame"); }
        return checks;
    }
}
