#Requires -RunAsAdministrator
##Prefer IPv4 over IPv6
##Applies registry key https://docs.microsoft.com/en-US/troubleshoot/windows-server/networking/configure-ipv6-in-windows#use-registry-key-to-configure-ipv6
##Can be ran as a one-liner with the below command
###preferIPv4 = Invoke-WebRequest https://raw.githubusercontent.com/Twingate/Support/main/Client/Windows/preferIPv4.ps1 && Invoke-Expression $($preferIPv4.Content)
function Set-PreferIPv4 () {
    Try {
      If ((Get-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip6\Parameters' | Select-Object -ExpandProperty 'DisabledComponents' -ErrorAction SilentlyContinue) -eq 32) {
          Write-Host "IPv4 is already preferred over IPv6. No further actions necessary." -ForegroundColor Green
      }
      Else {
        Set-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip6\Parameters\" -Name "DisabledComponents" -Value 0x20
        Write-Host "Setting IPv4 preference over IPv6."  -ForegroundColor Green
        Write-Host "Reboot required for changes to take effect." -ForegroundColor Yellow
      }
    }
    Catch {
      New-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip6\Parameters\" -Name "DisabledComponents" -Value 0x20 -PropertyType "DWord"
      Write-Host "Setting IPv4 preference over IPv6."  -ForegroundColor Green
      Write-Host "Reboot required for changes to take effect." -ForegroundColor Yellow
    }
  }
  Set-PreferIPv4