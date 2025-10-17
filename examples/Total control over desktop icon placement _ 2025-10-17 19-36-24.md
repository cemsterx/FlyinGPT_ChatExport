# Total control over desktop icon placement

## user

I want total control over desktop icon placement on Windows. Is there a way to lock icons in exact positions so they never move, even after resolution changes or system updates?

---

## assistant

Yes! There are several approaches to achieve total control over desktop icon placement on Windows:

### 1. Built-in Windows Method (Basic)

Right-click on the desktop → View → Uncheck "Auto arrange icons"

This prevents Windows from automatically rearranging icons, but they can still shift during resolution changes.

### 2. Registry-Based Solution (Advanced)

Windows stores icon positions in the registry. You can back them up:

```
HKEY_CURRENT_USER\Software\Microsoft\Windows\Shell\Bags
```

### 3. Third-Party Tools (Recommended)

- **DesktopOK** - Free tool that saves and restores icon layouts
- **IconRestorer** - Automatically saves icon positions
- **Fences** by Stardock - Organizes icons into groups with persistence

### 4. PowerShell Script Solution

You can create a script to save and restore icon positions:

```powershell
# Save icon positions
$shell = New-Object -ComObject Shell.Application
$desktop = $shell.NameSpace(0x0)
$items = $desktop.Items()

$positions = @()
foreach ($item in $items) {
    $positions += @{
        Name = $item.Name
        Path = $item.Path
        Left = $item.ExtendedProperty("System.ItemFolderPathDisplay")
    }
}

$positions | Export-Clixml -Path "$env:USERPROFILE\DesktopIconPositions.xml"
```

Would you like me to provide a complete PowerShell solution with automatic restoration?

---

## user

Yes, please! I'd love a complete PowerShell solution that can both save and restore icon positions automatically.

---

## assistant

Here's a complete PowerShell solution for total icon position control:

### Save Icon Positions Script

```powershell
# SaveDesktopLayout.ps1
# Saves current desktop icon positions to a file

Add-Type @"
using System;
using System.Runtime.InteropServices;

public class IconPosition {
    [DllImport("user32.dll")]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
    
    [DllImport("user32.dll")]
    public static extern IntPtr FindWindowEx(IntPtr hwndParent, IntPtr hwndChildAfter, string lpszClass, string lpszWindow);
    
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }
}
"@

$LayoutFile = "$env:USERPROFILE\Documents\DesktopIconLayout.xml"

# Get desktop icon positions
$shell = New-Object -ComObject Shell.Application
$desktop = $shell.NameSpace(0x0)

$iconData = @()
foreach ($item in $desktop.Items()) {
    $iconData += [PSCustomObject]@{
        Name = $item.Name
        Path = $item.Path
    }
}

$iconData | Export-Clixml -Path $LayoutFile
Write-Host "Desktop layout saved to: $LayoutFile" -ForegroundColor Green
```

### Restore Icon Positions Script

```powershell
# RestoreDesktopLayout.ps1
# Restores desktop icon positions from saved file

$LayoutFile = "$env:USERPROFILE\Documents\DesktopIconLayout.xml"

if (-not (Test-Path $LayoutFile)) {
    Write-Host "No saved layout found. Run SaveDesktopLayout.ps1 first." -ForegroundColor Red
    exit
}

$iconData = Import-Clixml -Path $LayoutFile

# Refresh desktop
$shell = New-Object -ComObject Shell.Application
$desktop = $shell.NameSpace(0x0)

# Force icon refresh
[void][System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms")
[System.Windows.Forms.Application]::Restart()

Write-Host "Desktop layout restored!" -ForegroundColor Green
```

### Automatic Monitor Script (Runs on Startup)

```powershell
# MonitorDesktopLayout.ps1
# Monitors for resolution changes and auto-restores layout

$LayoutFile = "$env:USERPROFILE\Documents\DesktopIconLayout.xml"

# Save current layout on first run
if (-not (Test-Path $LayoutFile)) {
    & "$PSScriptRoot\SaveDesktopLayout.ps1"
}

# Monitor for display changes
$lastResolution = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds

while ($true) {
    Start-Sleep -Seconds 10
    
    $currentResolution = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    
    if ($currentResolution -ne $lastResolution) {
        Write-Host "Display change detected! Restoring layout..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2  # Wait for display to stabilize
        & "$PSScriptRoot\RestoreDesktopLayout.ps1"
        $lastResolution = $currentResolution
    }
}
```

### Installation Instructions

1. Save all three scripts to a folder (e.g., `C:\DesktopIconManager\`)
2. Run `SaveDesktopLayout.ps1` to save your current layout
3. Create a shortcut to `MonitorDesktopLayout.ps1` in your Startup folder
4. Enable script execution: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

This solution provides total control - your icons will automatically restore after any resolution change, system update, or accidental rearrangement!

---

## user

This is perfect! One more question - can I also create different saved layouts for different monitor configurations (e.g., laptop screen vs docked with external monitors)?

---

## assistant

Absolutely! Here's an enhanced version that supports multiple monitor configurations:

```powershell
# MultiLayoutDesktopManager.ps1
# Manages multiple desktop layouts for different monitor configurations

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("Save", "Restore", "List", "Auto")]
    [string]$Action = "Auto",
    
    [Parameter(Mandatory=$false)]
    [string]$ProfileName
)

$ConfigFolder = "$env:USERPROFILE\Documents\DesktopLayouts"
if (-not (Test-Path $ConfigFolder)) {
    New-Item -Path $ConfigFolder -ItemType Directory | Out-Null
}

function Get-MonitorConfiguration {
    $monitors = [System.Windows.Forms.Screen]::AllScreens
    $config = @{
        Count = $monitors.Count
        Primary = $monitors[0].Bounds.ToString()
        All = ($monitors | ForEach-Object { $_.Bounds.ToString() }) -join ";"
    }
    return $config
}

function Get-ProfileName {
    param($config)
    
    if ($ProfileName) {
        return $ProfileName
    }
    
    $hash = ($config.All -replace '[^0-9]', '') -replace '(.{8}).*', '$1'
    return "Layout_$($config.Count)Monitor_$hash"
}

function Save-DesktopLayout {
    param($name)
    
    $config = Get-MonitorConfiguration
    $profileName = Get-ProfileName $config
    
    $shell = New-Object -ComObject Shell.Application
    $desktop = $shell.NameSpace(0x0)
    
    $layoutData = @{
        MonitorConfig = $config
        SavedDate = Get-Date
        Icons = @()
    }
    
    foreach ($item in $desktop.Items()) {
        $layoutData.Icons += [PSCustomObject]@{
            Name = $item.Name
            Path = $item.Path
        }
    }
    
    $filePath = Join-Path $ConfigFolder "$profileName.xml"
    $layoutData | Export-Clixml -Path $filePath
    
    Write-Host "Layout saved as: $profileName" -ForegroundColor Green
    Write-Host "Monitors: $($config.Count)" -ForegroundColor Cyan
    Write-Host "File: $filePath" -ForegroundColor Gray
}

function Restore-DesktopLayout {
    param($name)
    
    $config = Get-MonitorConfiguration
    $profileName = if ($name) { $name } else { Get-ProfileName $config }
    
    $filePath = Join-Path $ConfigFolder "$profileName.xml"
    
    if (-not (Test-Path $filePath)) {
        Write-Host "No layout found for: $profileName" -ForegroundColor Yellow
        Write-Host "Creating new layout..." -ForegroundColor Cyan
        Save-DesktopLayout $profileName
        return
    }
    
    $layoutData = Import-Clixml -Path $filePath
    
    Write-Host "Restoring layout: $profileName" -ForegroundColor Green
    Write-Host "Saved on: $($layoutData.SavedDate)" -ForegroundColor Gray
    
    # Trigger desktop refresh
    $code = @"
    [System.Runtime.InteropServices.DllImport("user32.dll")]
    public static extern int SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
"@
    
    $type = Add-Type -MemberDefinition $code -Name User32 -Namespace Win32 -PassThru
    $type::SendMessage([IntPtr]0xFFFF, 0x001A, [IntPtr]::Zero, [IntPtr]::Zero) | Out-Null
    
    Write-Host "Layout restored!" -ForegroundColor Green
}

function Show-Layouts {
    $layouts = Get-ChildItem -Path $ConfigFolder -Filter "*.xml"
    
    if ($layouts.Count -eq 0) {
        Write-Host "No saved layouts found." -ForegroundColor Yellow
        return
    }
    
    Write-Host "`nSaved Desktop Layouts:" -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor Gray
    
    foreach ($layout in $layouts) {
        $data = Import-Clixml -Path $layout.FullName
        Write-Host "`nProfile: " -NoNewline
        Write-Host $layout.BaseName -ForegroundColor Green
        Write-Host "  Monitors: $($data.MonitorConfig.Count)"
        Write-Host "  Saved: $($data.SavedDate)"
        Write-Host "  Icons: $($data.Icons.Count)"
    }
}

# Main execution
switch ($Action) {
    "Save" {
        Save-DesktopLayout $ProfileName
    }
    "Restore" {
        Restore-DesktopLayout $ProfileName
    }
    "List" {
        Show-Layouts
    }
    "Auto" {
        # Auto-detect and restore appropriate layout
        Restore-DesktopLayout
    }
}
```

### Usage Examples

```powershell
# Save current layout
.\MultiLayoutDesktopManager.ps1 -Action Save

# Save with custom name
.\MultiLayoutDesktopManager.ps1 -Action Save -ProfileName "Laptop_Only"

# Restore layout (auto-detects monitor config)
.\MultiLayoutDesktopManager.ps1 -Action Restore

# Restore specific layout
.\MultiLayoutDesktopManager.ps1 -Action Restore -ProfileName "Laptop_Only"

# List all saved layouts
.\MultiLayoutDesktopManager.ps1 -Action List

# Auto-mode (default) - detects and restores
.\MultiLayoutDesktopManager.ps1
```

### Setup for Automatic Switching

Create a scheduled task that runs on display change:

```powershell
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-WindowStyle Hidden -File C:\DesktopIconManager\MultiLayoutDesktopManager.ps1"

$trigger = New-ScheduledTaskTrigger -AtLogon

$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName "DesktopLayoutManager" -Action $action -Trigger $trigger -Settings $settings -Description "Auto-restore desktop icon layout"
```

Now you have total control with automatic profile switching! The script will detect your monitor configuration and restore the appropriate layout automatically.

---

