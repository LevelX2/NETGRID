using System;

internal static class Program
{
    private static void Main(string[] args)
    {
        if (MsiHelperExitTests.TryChild(args)) return;
        if (args.Length != 0) throw new ArgumentException("test_arguments_invalid");
        Console.WriteLine("MSI_HELPER_EXIT_FRAMEWORK_TESTS_OK checks=" + MsiHelperExitTests.Run() +
            " framework=" + Environment.Version + " x64=" + Environment.Is64BitProcess +
            " registry=isolated_HKCU MSI=not-started");
    }
}
