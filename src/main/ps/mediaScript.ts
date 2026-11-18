/**
 * PowerShell bridge to the Windows Global System Media Transport Controls
 * (GSMTC) — the same "media session" Windows shows in the volume flyout.
 *
 * This is what lets Mili show the Spotify track without any Spotify API key
 * and with zero extra native dependencies: Windows PowerShell 5.1 ships with
 * the WinRT projection, so we can await the async GSMTC calls directly.
 *
 * Modes:
 *   -Action poll      → long running process, prints one JSON line per poll
 *   -Action playpause → one-shot control command
 *   -Action next / previous
 */

export const MEDIA_POWERSHELL = String.raw`param(
  [string]$Action = 'poll',
  [string]$ArtPath = '',
  [int]$IntervalMs = 1200
)

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false } catch { }
$ProgressPreference = 'SilentlyContinue'

$script:AwaitTask = $null
$script:ArtKey = ''
$script:ArtVersion = 0

function Initialize-WinRT {
  Add-Type -AssemblyName System.Runtime.WindowsRuntime
  foreach ($m in [System.WindowsRuntimeSystemExtensions].GetMethods()) {
    if ($m.Name -eq 'AsTask' -and $m.GetParameters().Count -eq 1 -and $m.GetParameters()[0].ParameterType.Name -like 'IAsyncOperation*') {
      $script:AwaitTask = $m
      break
    }
  }
  if ($null -eq $script:AwaitTask) { throw 'WinRT AsTask bridge unavailable' }
  [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime] | Out-Null
}

function Await($operation, [Type]$resultType) {
  $task = $script:AwaitTask.MakeGenericMethod($resultType).Invoke($null, @($operation))
  [void]$task.Wait(-1)
  return $task.Result
}

function Write-Json($payload) {
  [Console]::Out.WriteLine(($payload | ConvertTo-Json -Compress -Depth 5))
  [Console]::Out.Flush()
}

function Select-Session($manager) {
  $sessions = @($manager.GetSessions())
  $preferred = @()
  foreach ($s in $sessions) {
    if ($s.SourceAppUserModelId -like '*spotify*') { $preferred += $s }
  }
  foreach ($s in $preferred) {
    if ($s.GetPlaybackInfo().PlaybackStatus.ToString() -eq 'Playing') { return $s }
  }
  foreach ($s in $sessions) {
    if ($s.GetPlaybackInfo().PlaybackStatus.ToString() -eq 'Playing') { return $s }
  }
  if ($preferred.Count -gt 0) { return $preferred[0] }
  return $manager.GetCurrentSession()
}

function Save-Artwork($reference, [string]$path) {
  try {
    if ($null -eq $reference -or [string]::IsNullOrEmpty($path)) { return }
    $stream = Await ($reference.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
    if ($null -eq $stream) { return }
    $size = [int]$stream.Size
    if ($size -le 0 -or $size -gt 8000000) { $stream.Dispose(); return }
    $reader = [Windows.Storage.Streams.DataReader]::new($stream)
    [void](Await ($reader.LoadAsync([uint32]$size)) ([uint32]))
    $buffer = New-Object byte[] $size
    $reader.ReadBytes($buffer)
    $reader.Dispose()
    $stream.Dispose()
    $folder = [System.IO.Path]::GetDirectoryName($path)
    if ($folder -and -not [System.IO.Directory]::Exists($folder)) {
      [void][System.IO.Directory]::CreateDirectory($folder)
    }
    [System.IO.File]::WriteAllBytes($path, $buffer)
  } catch { }
}

function Get-State($manager, [string]$artPath) {
  $state = [ordered]@{
    ok = $true
    hasSession = $false
    title = ''
    artist = ''
    album = ''
    source = ''
    status = 'closed'
    playing = $false
    positionMs = 0
    durationMs = 0
    lastUpdatedMs = 0
    artVersion = $script:ArtVersion
    error = ''
  }

  try {
    $session = Select-Session $manager
    if ($null -eq $session) { return $state }

    $info = $session.GetPlaybackInfo()
    $status = $info.PlaybackStatus.ToString()
    $state.hasSession = $true
    $state.status = $status
    $state.playing = ($status -eq 'Playing')
    $state.source = [string]$session.SourceAppUserModelId

    $props = Await ($session.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
    if ($null -ne $props) {
      $state.title = [string]$props.Title
      $state.artist = [string]$props.Artist
      $state.album = [string]$props.AlbumTitle

      $key = [string]$props.Title + '|' + [string]$props.Artist + '|' + [string]$props.AlbumTitle
      if ($key -ne $script:ArtKey) {
        $script:ArtKey = $key
        $script:ArtVersion = $script:ArtVersion + 1
        Save-Artwork $props.Thumbnail $artPath
      }
      $state.artVersion = $script:ArtVersion
    }

    $timeline = $session.GetTimelineProperties()
    $start = $timeline.StartTime.TotalMilliseconds
    $position = $timeline.Position.TotalMilliseconds - $start
    $duration = $timeline.EndTime.TotalMilliseconds - $start
    if ($state.playing) {
      $age = ([DateTimeOffset]::UtcNow - $timeline.LastUpdatedTime).TotalMilliseconds
      if ($age -gt 0 -and $age -lt 15000) { $position = $position + $age }
    }
    if ($position -lt 0) { $position = 0 }
    if ($duration -lt 0) { $duration = 0 }
    $state.positionMs = [int64]$position
    $state.durationMs = [int64]$duration
    $state.lastUpdatedMs = [int64][DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  } catch {
    $state.ok = $false
    $state.error = [string]$_.Exception.Message
  }

  return $state
}

function Invoke-Control($manager, [string]$actionName) {
  $payload = [ordered]@{ ok = $false; action = $actionName; error = '' }
  try {
    $session = Select-Session $manager
    if ($null -eq $session) {
      $payload.error = 'no-session'
      return $payload
    }
    $result = $false
    switch ($actionName) {
      'playpause' { $result = Await ($session.TryTogglePlayPauseAsync()) ([bool]) }
      'next' { $result = Await ($session.TrySkipNextAsync()) ([bool]) }
      'previous' { $result = Await ($session.TrySkipPreviousAsync()) ([bool]) }
      'play' { $result = Await ($session.TryPlayAsync()) ([bool]) }
      'pause' { $result = Await ($session.TryPauseAsync()) ([bool]) }
      default { $payload.error = 'unknown-action' }
    }
    $payload.ok = [bool]$result
  } catch {
    $payload.error = [string]$_.Exception.Message
  }
  return $payload
}

Initialize-WinRT
$manager = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])

if ($Action -eq 'poll') {
  while ($true) {
    Write-Json (Get-State $manager $ArtPath)
    Start-Sleep -Milliseconds $IntervalMs
  }
} else {
  Write-Json (Invoke-Control $manager $Action)
}
`
