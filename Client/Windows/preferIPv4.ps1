#Requires -RunAsAdministrator
#Prefer IPv4 over IPv6
#Applies registry key https://docs.microsoft.com/en-US/troubleshoot/windows-server/networking/configure-ipv6-in-windows#use-registry-key-to-configure-ipv6
#
#Can be ran as a one-liner with the below command
#
#preferIPv4 = Invoke-WebRequest https://raw.githubusercontent.com/Twingate/Support/main/Client/Windows/preferIPv4.ps1 && Invoke-Expression $($preferIPv4.Content)

function Set-PreferIPv4 () {
    try {
      if ((Get-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip6\Parameters' | Select-Object -ExpandProperty 'DisabledComponents' -ErrorAction SilentlyContinue) -eq 32) {
          Write-Host "IPv4 is already preferred over IPv6. No further actions necessary." -ForegroundColor Green
      }
      elseif (Get-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip6\Parameters' | Select-Object -ExpandProperty 'DisabledComponents' -ErrorAction SilentlyContinue) {
        Set-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip6\Parameters\" -Name "DisabledComponents" -Value 0x20 
        Write-Host "Setting IPv4 preference over IPv6."  -ForegroundColor Green
        Write-Host "Reboot required for changes to take effect." -ForegroundColor Yellow
      }
      else {
        try {
          New-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip6\Parameters\" -Name "DisabledComponents" -Value 0x20 -PropertyType "DWord" -ErrorAction Stop
          Write-Host "Setting IPv4 preference over IPv6."  -ForegroundColor Green
          Write-Host "Reboot required for changes to take effect." -ForegroundColor Yellow
        }
        catch {
          Write-Output "Ran into an issue: $($PSItem.ToString())"    
        }
      }
    }
    catch {
      if ($($PSItem.ToString()) -eq "Requested registry access is not allowed.") {
        Write-Output "Ran into an issue: powershell must be ran as administrator"   
      } 
      else {
        Write-Output "Ran into an issue: $($PSItem.ToString())"    
      }
}
Set-PreferIPv4