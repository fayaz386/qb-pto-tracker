Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Net;

public class ArpHelper2 {
    [DllImport("iphlpapi.dll", ExactSpelling=true)]
    public static extern int SendARP(uint DestIP, uint SrcIP, byte[] pMacAddr, ref int PhyAddrLen);

    public static string GetMac(string destIp, string srcIp) {
        byte[] destBytes = IPAddress.Parse(destIp).GetAddressBytes();
        byte[] srcBytes = IPAddress.Parse(srcIp).GetAddressBytes();
        
        uint dest = BitConverter.ToUInt32(destBytes, 0);
        uint src = BitConverter.ToUInt32(srcBytes, 0);
        
        byte[] macInfo = new byte[6];
        int macInfoLen = 6;
        
        int res = SendARP(dest, src, macInfo, ref macInfoLen);
        if (res == 0) {
            return BitConverter.ToString(macInfo).Replace("-", ":");
        }
        return "Failed with error code: " + res;
    }
}
"@

$dest = "192.168.0.48"
$src = "192.168.0.183"
Write-Host "Sending ARP request to $dest from $src..."
$mac = [ArpHelper2]::GetMac($dest, $src)
Write-Host "MAC Address: $mac"
