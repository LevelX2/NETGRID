using System.Diagnostics;
using Microsoft.Win32;

namespace Netgrid.Windows;

internal static class UpdateVerification
{
    public static async Task AcceptPermitAsync(string programRoot, string lease, string session)
    {
        using var machine = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64);
        await AcceptPermitAsync(machine, programRoot, lease, session);
    }

    internal static async Task AcceptPermitAsync(RegistryKey machine, string programRoot, string lease, string session)
    {
        using var owner = InstallationGate.OpenVerificationOwner(machine, programRoot, lease);
        using var deadline = new CancellationTokenSource(TimeSpan.FromSeconds(30));
        using var peer = await UpdateHandoff.ConnectAsync(session, owner, deadline.Token);
        if (!await peer.ReceiveDecisionAsync(deadline.Token) ||
            !InstallationGate.IsCurrentVerificationAllowed(machine, programRoot, lease))
            throw new InvalidOperationException("update_verification_not_authorized");
    }

    public static ProcessStartInfo CreateStart(string programRoot, string environmentFile, string lease, string session)
    {
        InstallationGate.KeyFor(programRoot);
        InstallationGate.ValidateLease(lease);
        UpdateHandoff.PipeName(session);
        if (!Path.IsPathFullyQualified(environmentFile)) throw new InvalidOperationException("update_verification_environment_invalid");
        var start = new ProcessStartInfo(Path.Combine(programRoot, "NETGRID.exe"))
        {
            UseShellExecute = false, CreateNoWindow = true,
        };
        foreach (var argument in new[] { "--headless-verify", "--program-root", programRoot,
            "--environment-file", environmentFile, "--update-lease", lease, "--verification-session", session })
            start.ArgumentList.Add(argument);
        return start;
    }
}
