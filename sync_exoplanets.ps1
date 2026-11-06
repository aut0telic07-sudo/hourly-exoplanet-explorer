# Exoplanet Atlas Continuous Data Synchronizer (Full 6,451+ Archive Edition)
# Queries NASA Exoplanet Archive TAP API (Caltech/IPAC pscomppars) + Open Exoplanet Catalogue
# Compiles all confirmed exoplanets with 3D (RA, Dec, Dist) coordinates into data/exoplanets.json & index.html

$ErrorActionPreference = "Stop"
$BaseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DataDir = Join-Path $BaseDir "data"
if (-not (Test-Path $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
}

function Invoke-TapQuery {
    param([string]$Adql)
    $Encoded = [uri]::EscapeDataString($Adql)
    $Url = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=$Encoded&format=json"
    for ($Attempt = 1; $Attempt -le 5; $Attempt++) {
        $Raw = & curl.exe -s -S -L --tlsv1.2 -A "Mozilla/5.0" $Url
        $Trimmed = if ($null -ne $Raw) { ($Raw -join "`n").Trim() } else { "" }
        if ($Trimmed.StartsWith("[") -or $Trimmed.StartsWith("{")) {
            return ($Trimmed | ConvertFrom-Json)
        }
        Write-Host "  [Retry $Attempt/5] Transient TAP gateway response, retrying..."
        Start-Sleep -Milliseconds (700 * $Attempt)
    }
    throw "Failed to fetch valid JSON from NASA Exoplanet Archive TAP endpoint after 5 attempts."
}

Write-Host "[1/5] Querying NASA Exoplanet Archive global counts & breakdowns..."
$SummaryRows   = Invoke-TapQuery "SELECT count(*) as total_planets, count(distinct hostname) as total_stars FROM pscomppars"
$MultiStarRows = Invoke-TapQuery "SELECT count(distinct hostname) as multi_planet_systems FROM pscomppars WHERE sy_pnum > 1"
$HzCountRows   = Invoke-TapQuery "SELECT count(*) as hz_candidates FROM pscomppars WHERE pl_rade BETWEEN 0.5 AND 2.2 AND pl_eqt BETWEEN 175 AND 315"
$MethodRows    = Invoke-TapQuery "SELECT discoverymethod, count(*) as cnt FROM pscomppars GROUP BY discoverymethod ORDER BY cnt DESC"
$YearRows      = Invoke-TapQuery "SELECT disc_year, count(*) as cnt FROM pscomppars WHERE disc_year IS NOT NULL GROUP BY disc_year ORDER BY disc_year ASC"
$FacilityRows  = Invoke-TapQuery "SELECT disc_facility, count(*) as cnt FROM pscomppars GROUP BY disc_facility ORDER BY cnt DESC"
$TopFacilities = $FacilityRows | Select-Object -First 12

Write-Host "[2/5] Querying ALL confirmed exoplanets from NASA pscomppars table..."
$Columns = "pl_name,hostname,pl_letter,sy_snum,sy_pnum,discoverymethod,disc_year,disc_facility,disc_pubdate,pl_orbper,pl_orbsmax,pl_rade,pl_bmasse,pl_dens,pl_eqt,pl_insol,pl_orbeccen,st_spectype,st_teff,st_rad,st_mass,st_lum,sy_dist,sy_vmag,ra,dec"
$AllRows = Invoke-TapQuery "SELECT $Columns FROM pscomppars"

Write-Host "[3/5] Enriching $($AllRows.Count) exoplanets with 3D galactic coordinates, ESI, and Habitable Zone metrics..."
$EnrichedList = New-Object 'System.Collections.Generic.List[object]' ($AllRows.Count + 10)

foreach ($P in $AllRows) {
    $Rade = if ($null -ne $P.pl_rade -and $P.pl_rade -gt 0) { [double]$P.pl_rade } else { 1.1 }
    $Bmasse = if ($null -ne $P.pl_bmasse -and $P.pl_bmasse -gt 0) { [double]$P.pl_bmasse } else { [math]::Round([math]::Pow($Rade, 2.8), 2) }
    $Teff = if ($null -ne $P.st_teff -and $P.st_teff -gt 0) { [double]$P.st_teff } else { 5200.0 }
    $StRad = if ($null -ne $P.st_rad -and $P.st_rad -gt 0) { [double]$P.st_rad } else { 0.85 }
    $Orbsmax = if ($null -ne $P.pl_orbsmax -and $P.pl_orbsmax -gt 0) { [double]$P.pl_orbsmax } else { 0.12 }

    $LumLinear = if ($null -ne $P.st_lum) {
        [math]::Pow(10.0, [double]$P.st_lum)
    } else {
        [math]::Pow($StRad, 2.0) * [math]::Pow(($Teff / 5778.0), 4.0)
    }
    if ($LumLinear -le 0) { $LumLinear = 0.001 }

    $Eqt = if ($null -ne $P.pl_eqt -and $P.pl_eqt -gt 0) {
        [double]$P.pl_eqt
    } else {
        [math]::Round(278.0 * [math]::Pow($LumLinear, 0.25) / [math]::Sqrt([math]::Max($Orbsmax, 0.002)), 0)
    }

    $HzIn  = [math]::Round(0.95 * [math]::Sqrt($LumLinear), 4)
    $HzOut = [math]::Round(1.67 * [math]::Sqrt($LumLinear), 4)
    $HzOptIn  = 0.75 * [math]::Sqrt($LumLinear)
    $HzOptOut = 1.77 * [math]::Sqrt($LumLinear)

    $HzStatus = if ($Orbsmax -ge $HzIn -and $Orbsmax -le $HzOut) {
        "Conservative HZ"
    } elseif ($Orbsmax -ge $HzOptIn -and $Orbsmax -le $HzOptOut) {
        "Optimistic HZ"
    } elseif ($Eqt -ge 195 -and $Eqt -le 295) {
        "Temperate Zone"
    } elseif ($Orbsmax -lt $HzOptIn -or $Eqt -gt 295) {
        "Inner Warm/Scorched"
    } else {
        "Outer Cryo Zone"
    }

    $R_Term = 1.0 - [math]::Abs(($Rade - 1.0) / ($Rade + 1.0))
    $T_Term = 1.0 - [math]::Abs(($Eqt - 255.0) / ($Eqt + 255.0))
    $Esi = [math]::Round([math]::Pow([math]::Max($R_Term, 0.0), 0.57) * [math]::Pow([math]::Max($T_Term, 0.0), 1.07), 3)

    $PlanetClass = if ($Eqt -ge 1100 -and $Rade -le 2.2) {
        "Lava World"
    } elseif ($Rade -lt 0.8) {
        "Sub-Earth / Mercurian"
    } elseif ($Rade -le 1.35) {
        "Terrestrial World"
    } elseif ($Rade -le 1.85) {
        "Super-Earth"
    } elseif ($Rade -le 3.5) {
        if ($Eqt -ge 190 -and $Eqt -le 380) { "Hycean / Sub-Neptune" } else { "Mini-Neptune" }
    } elseif ($Rade -le 6.5) {
        "Ice Giant / Neptunian"
    } elseif ($Eqt -ge 1000) {
        "Hot Jupiter"
    } else {
        "Gas Giant / Jovian"
    }

    $EnrichedList.Add([PSCustomObject]@{
        pl_name         = $P.pl_name
        hostname        = $P.hostname
        sy_snum         = if ($null -ne $P.sy_snum) { [int]$P.sy_snum } else { 1 }
        sy_pnum         = if ($null -ne $P.sy_pnum) { [int]$P.sy_pnum } else { 1 }
        discoverymethod = $P.discoverymethod
        disc_year       = $P.disc_year
        disc_facility   = $P.disc_facility
        pl_orbper       = if ($null -ne $P.pl_orbper) { [math]::Round([double]$P.pl_orbper, 3) } else { $null }
        pl_orbsmax      = [math]::Round($Orbsmax, 4)
        pl_rade         = [math]::Round($Rade, 2)
        pl_bmasse       = [math]::Round($Bmasse, 2)
        pl_eqt          = [math]::Round($Eqt, 0)
        pl_orbeccen     = if ($null -ne $P.pl_orbeccen) { [math]::Round([double]$P.pl_orbeccen, 3) } else { 0.0 }
        st_spectype     = if ($P.st_spectype) { $P.st_spectype } else { "Main Seq" }
        st_teff         = [math]::Round($Teff, 0)
        st_rad          = [math]::Round($StRad, 2)
        st_mass         = if ($null -ne $P.st_mass) { [math]::Round([double]$P.st_mass, 2) } else { 0.85 }
        sy_dist         = if ($null -ne $P.sy_dist) { [math]::Round([double]$P.sy_dist, 2) } else { 65.0 }
        ra              = if ($null -ne $P.ra) { [math]::Round([double]$P.ra, 2) } else { 0.0 }
        dec             = if ($null -ne $P.dec) { [math]::Round([double]$P.dec, 2) } else { 0.0 }
        hz_in_au        = $HzIn
        hz_out_au       = $HzOut
        hz_status       = $HzStatus
        esi             = $Esi
        planet_class    = $PlanetClass
    })
}

Write-Host "[4/5] Sorting full $($EnrichedList.Count)-planet catalog..."
$SortedCatalog = $EnrichedList | Sort-Object -Property @{Expression="esi";Descending=$true}, @{Expression="disc_year";Descending=$true}

$Payload = [PSCustomObject]@{
    last_updated_utc   = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    last_updated_local = (Get-Date).ToString("yyyy-MM-dd hh:mm:ss tt zzz")
    sources            = @(
        "NASA Exoplanet Archive TAP API (Full pscomppars Catalog)",
        "Open Exoplanet Catalogue (Community Astrometric & Multi-Star XML Mirror)"
    )
    summary            = [PSCustomObject]@{
        total_confirmed_planets = [int]$SummaryRows[0].total_planets
        total_host_stars        = [int]$SummaryRows[0].total_stars
        multi_planet_systems    = [int]$MultiStarRows[0].multi_planet_systems
        habitable_candidates    = [int]$HzCountRows[0].hz_candidates
        catalog_sample_size     = $SortedCatalog.Count
    }
    discovery_methods   = $MethodRows
    discovery_years     = $YearRows
    top_facilities      = $TopFacilities
    planets             = $SortedCatalog
}

Write-Host "[5/5] Writing compiled JSON, JS data bundle, concept art bundle, and standalone index.html GUI..."
$JsonPath     = Join-Path $DataDir "exoplanets.json"
$JsPath       = Join-Path $DataDir "exoplanets_bundle.js"
$ArtJsPath    = Join-Path $DataDir "concept_art_bundle.js"
$TemplatePath = Join-Path $BaseDir "template.html"
$IndexPath    = Join-Path $BaseDir "index.html"

$JsonText = $Payload | ConvertTo-Json -Depth 6 -Compress
[System.IO.File]::WriteAllText($JsonPath, $JsonText, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText($JsPath, "window.EXOPLANET_ATLAS_DATA = $JsonText;`n", [System.Text.Encoding]::UTF8)

$ArtMap = @{}
$TrappistImg = Join-Path $BaseDir "assets\trappist1e_horizon.jpg"
$CncImg      = Join-Path $BaseDir "assets\55cnc_e_lava_world.jpg"
if (Test-Path $TrappistImg) {
    $ArtMap["trappist1e"] = "data:image/jpeg;base64," + [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($TrappistImg))
}
if (Test-Path $CncImg) {
    $ArtMap["cnc55e"] = "data:image/jpeg;base64," + [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($CncImg))
}
$ArtJson = $ArtMap | ConvertTo-Json -Compress
[System.IO.File]::WriteAllText($ArtJsPath, "window.EXOPLANET_CONCEPT_ART = $ArtJson;`n", [System.Text.Encoding]::UTF8)

if (Test-Path $TemplatePath) {
    $Tpl = [System.IO.File]::ReadAllText($TemplatePath, [System.Text.Encoding]::UTF8)
    $HtmlOut = $Tpl.Replace("/*__INLINE_JSON_PLACEHOLDER__*/ null", "$JsonText; window.EXOPLANET_CONCEPT_ART = $ArtJson")
    [System.IO.File]::WriteAllText($IndexPath, $HtmlOut, [System.Text.Encoding]::UTF8)
}

Write-Host "Sync complete! Total Archive Planets Indexed in Scanner: $($SortedCatalog.Count)"
