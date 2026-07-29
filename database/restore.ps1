# Restore quickbite database from JSON dump (requires mongosh)
$ErrorActionPreference = "Stop"
$mongosh = "C:\Users\ADMIN\AppData\Local\Programs\mongosh\mongosh.exe"
$uri = "mongodb://localhost:27017/quickbite"
$dumpDir = Join-Path $PSScriptRoot "quickbite"

if (-not (Test-Path $mongosh)) {
    throw "mongosh not found at $mongosh"
}

Get-ChildItem $dumpDir -Filter "*.json" | ForEach-Object {
    $col = $_.BaseName
    $path = $_.FullName.Replace("\", "/")
    Write-Host "Restoring $col..."
    & $mongosh $uri --quiet --eval @"
const data = EJSON.parse(cat('$path'));
db.getCollection('$col').deleteMany({});
if (data.length) db.getCollection('$col').insertMany(data);
print('$col: ' + data.length + ' documents');
"@
}

Write-Host "Done."
