param(
  [string]$ProjectPath = (Split-Path $PSScriptRoot -Parent),
  [string]$UvCommand = "uv"
)

# Review and run manually. No task is registered by the Python package itself.
$actions = @(
  @{ Name = "CareerJobScout-Alerts"; Schedule = "MINUTE"; Modifier = 15; Args = "run alerts" },
  @{ Name = "CareerJobScout-ATS"; Schedule = "HOURLY"; Modifier = 6; Args = "run ats" },
  @{ Name = "CareerJobScout-CareerPages"; Schedule = "DAILY"; Modifier = 1; Args = "run career-pages" },
  @{ Name = "CareerJobScout-GoogleJobs"; Schedule = "DAILY"; Modifier = 1; Args = "run google-jobs" }
  @{ Name = "CareerJobScout-WeeklyDrafts"; Schedule = "WEEKLY"; Modifier = 1; Args = "draft" }
)
foreach ($task in $actions) {
  $command = "Set-Location -LiteralPath '$ProjectPath'; $UvCommand run job-scout $($task.Args)"
  schtasks /Create /F /TN $task.Name /SC $task.Schedule /MO $task.Modifier /TR "powershell.exe -NoProfile -WindowStyle Hidden -Command $command" | Out-Host
}
