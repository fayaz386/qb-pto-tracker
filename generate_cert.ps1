# Get all local IPv4 addresses
$ipV4 = Get-NetIPAddress -AddressFamily IPv4 | Select-Object -ExpandProperty IPAddress
$dnsNames = @("localhost", $env:COMPUTERNAME) + $ipV4

Write-Host "Creating Certificate for: $($dnsNames -join ', ')"

$certParams = @{
    DnsName           = $dnsNames
    CertStoreLocation = "Cert:\CurrentUser\My"
    FriendlyName      = "PTO Tracker HR System"
    KeyUsage          = "DigitalSignature", "KeyEncipherment"
    TextExtension     = @("2.5.29.37={text}1.3.6.1.5.5.7.3.1")
    NotAfter          = (Get-Date).AddYears(10)
}

$cert = New-SelfSignedCertificate @certParams

$pwd = ConvertTo-SecureString -String "password" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "server.pfx" -Password $pwd -Force

Write-Host "Certificate generated successfully."
