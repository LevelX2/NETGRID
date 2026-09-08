using System.Buffers.Binary;
using System.Security.Cryptography;

namespace Netgrid.Windows;

// Unsigned private-alpha transport: apphost stub + original MSI + fixed footer.
// This is an integrity/container codec, not an installation or trust authority.
// Callers own immutable input handles, path protection, staging and publication.
internal static class SetupBundle
{
    internal const int FooterSize = 184;
    private const int FooterHashOffset = 152;
    private static ReadOnlySpan<byte> Magic => "NETGRIDSETUPv001"u8;
    private static ReadOnlySpan<byte> MsiMagic => [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

    internal sealed record Metadata(Version ProductVersion, Guid ProductCode, long PayloadBytes, long PayloadFileCount);
    internal sealed record Contents(Metadata Product, long StubBytes, long MsiBytes, string StubSha256, string MsiSha256);

    public static Contents Write(Stream stub, Stream msi, Stream destination, Metadata product)
    {
        Validate(product);
        RequireInput(stub);
        RequireInput(msi);
        if (ReferenceEquals(stub, msi) || ReferenceEquals(destination, stub) || ReferenceEquals(destination, msi) ||
            !destination.CanWrite || !destination.CanSeek || destination.Position != 0 || destination.Length != 0)
            throw Invalid("output_invalid");
        var stubBytes = stub.Length;
        var msiBytes = msi.Length;
        ValidateLengths(stubBytes, msiBytes, CombinedLength(stubBytes, msiBytes));
        RequireMagic(stub, 0, "MZ"u8, "stub_invalid");
        RequireMagic(msi, 0, MsiMagic, "msi_invalid");
        stub.Position = 0;
        msi.Position = 0;
        var stubHash = CopyHash(stub, stubBytes, destination);
        var msiHash = CopyHash(msi, msiBytes, destination);
        var footer = new byte[FooterSize];
        Magic.CopyTo(footer);
        BinaryPrimitives.WriteInt32LittleEndian(footer.AsSpan(16), 1);
        BinaryPrimitives.WriteInt32LittleEndian(footer.AsSpan(20), FooterSize);
        BinaryPrimitives.WriteInt64LittleEndian(footer.AsSpan(24), stubBytes);
        BinaryPrimitives.WriteInt64LittleEndian(footer.AsSpan(32), msiBytes);
        BinaryPrimitives.WriteInt64LittleEndian(footer.AsSpan(40), product.PayloadBytes);
        BinaryPrimitives.WriteInt64LittleEndian(footer.AsSpan(48), product.PayloadFileCount);
        BinaryPrimitives.WriteInt32LittleEndian(footer.AsSpan(56), product.ProductVersion.Major);
        BinaryPrimitives.WriteInt32LittleEndian(footer.AsSpan(60), product.ProductVersion.Minor);
        BinaryPrimitives.WriteInt32LittleEndian(footer.AsSpan(64), product.ProductVersion.Build);
        product.ProductCode.TryWriteBytes(footer.AsSpan(72, 16));
        stubHash.CopyTo(footer, 88);
        msiHash.CopyTo(footer, 120);
        SHA256.HashData(footer.AsSpan(0, FooterHashOffset), footer.AsSpan(FooterHashOffset));
        destination.Write(footer);
        return new(product, stubBytes, msiBytes, Hex(stubHash), Hex(msiHash));
    }

    // Fully validates the container, including stub and MSI bytes. No magic scan,
    // legacy-resource fallback or acceptance of extra bytes after the footer.
    public static Contents ReadVerified(Stream bundle)
    {
        RequireInput(bundle);
        if (bundle.Length < FooterSize) throw Invalid("footer_missing");
        bundle.Position = bundle.Length - FooterSize;
        var footer = new byte[FooterSize];
        ReadExactly(bundle, footer);
        if (!footer.AsSpan(0, 16).SequenceEqual(Magic) ||
            BinaryPrimitives.ReadInt32LittleEndian(footer.AsSpan(16)) != 1 ||
            BinaryPrimitives.ReadInt32LittleEndian(footer.AsSpan(20)) != FooterSize ||
            BinaryPrimitives.ReadInt32LittleEndian(footer.AsSpan(68)) != 0)
            throw Invalid("footer_invalid");
        if (!CryptographicOperations.FixedTimeEquals(SHA256.HashData(footer.AsSpan(0, FooterHashOffset)), footer.AsSpan(FooterHashOffset)))
            throw Invalid("footer_hash_mismatch");
        var stubBytes = BinaryPrimitives.ReadInt64LittleEndian(footer.AsSpan(24));
        var msiBytes = BinaryPrimitives.ReadInt64LittleEndian(footer.AsSpan(32));
        ValidateLengths(stubBytes, msiBytes, bundle.Length);
        var major = BinaryPrimitives.ReadInt32LittleEndian(footer.AsSpan(56));
        var minor = BinaryPrimitives.ReadInt32LittleEndian(footer.AsSpan(60));
        var build = BinaryPrimitives.ReadInt32LittleEndian(footer.AsSpan(64));
        if (major < 0 || minor < 0 || build < 0) throw Invalid("metadata_invalid");
        var product = new Metadata(new Version(major, minor, build), new Guid(footer.AsSpan(72, 16)),
            BinaryPrimitives.ReadInt64LittleEndian(footer.AsSpan(40)), BinaryPrimitives.ReadInt64LittleEndian(footer.AsSpan(48)));
        Validate(product);
        RequireMagic(bundle, 0, "MZ"u8, "stub_invalid");
        RequireMagic(bundle, stubBytes, MsiMagic, "msi_invalid");
        bundle.Position = 0;
        var stubHash = CopyHash(bundle, stubBytes, null);
        var msiHash = CopyHash(bundle, msiBytes, null);
        if (!CryptographicOperations.FixedTimeEquals(stubHash, footer.AsSpan(88, 32)) ||
            !CryptographicOperations.FixedTimeEquals(msiHash, footer.AsSpan(120, 32)))
            throw Invalid("payload_hash_mismatch");
        return new(product, stubBytes, msiBytes, Hex(stubHash), Hex(msiHash));
    }

    public static Contents ExtractVerified(Stream bundle, Stream destination)
    {
        if (ReferenceEquals(bundle, destination) || !destination.CanWrite || !destination.CanSeek ||
            destination.Position != 0 || destination.Length != 0) throw Invalid("output_invalid");
        var contents = ReadVerified(bundle);
        bundle.Position = contents.StubBytes;
        var hash = CopyHash(bundle, contents.MsiBytes, destination);
        if (Hex(hash) != contents.MsiSha256) throw Invalid("payload_hash_mismatch");
        return contents;
    }

    private static byte[] CopyHash(Stream input, long count, Stream? output)
    {
        using var hash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
        var buffer = new byte[81920];
        while (count > 0)
        {
            var read = input.Read(buffer, 0, (int)Math.Min(count, buffer.Length));
            if (read == 0) throw Invalid("input_truncated");
            hash.AppendData(buffer, 0, read);
            output?.Write(buffer, 0, read);
            count -= read;
        }
        return hash.GetHashAndReset();
    }

    private static void RequireMagic(Stream input, long position, ReadOnlySpan<byte> expected, string code)
    {
        input.Position = position;
        Span<byte> actual = stackalloc byte[expected.Length];
        ReadExactly(input, actual);
        if (!actual.SequenceEqual(expected)) throw Invalid(code);
    }
    private static void ReadExactly(Stream input, Span<byte> target)
    {
        try { input.ReadExactly(target); }
        catch (EndOfStreamException) { throw Invalid("input_truncated"); }
    }
    private static void Validate(Metadata product)
    {
        if (product.ProductVersion is null || product.ProductVersion.Major is < 0 or > 255 ||
            product.ProductVersion.Minor is < 0 or > 255 || product.ProductVersion.Build is < 0 or > 65535 ||
            product.ProductVersion.Revision != -1 || product.ProductCode == Guid.Empty ||
            product.PayloadBytes <= 0 || product.PayloadFileCount <= 0)
            throw Invalid("metadata_invalid");
    }
    private static void RequireInput(Stream input)
    {
        if (!input.CanRead || !input.CanSeek) throw Invalid("input_invalid");
    }
    private static long CombinedLength(long stub, long msi)
    {
        try { return checked(stub + msi + FooterSize); }
        catch (OverflowException) { throw Invalid("length_invalid"); }
    }
    private static void ValidateLengths(long stub, long msi, long total)
    {
        if (stub < 64 || msi < 8 || CombinedLength(stub, msi) != total) throw Invalid("length_invalid");
    }
    private static string Hex(byte[] bytes) => Convert.ToHexString(bytes).ToLowerInvariant();
    private static SetupBundleException Invalid(string code) => new("setup_bundle_" + code);
}

internal sealed class SetupBundleException(string code) : InvalidOperationException(code)
{
    public string Code { get; } = code;
}
