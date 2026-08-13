Add-Type -AssemblyName System.IO.Compression.FileSystem
$docPath = 'd:\大学\党建工作与志愿服务\社会实践\PBL\8.8~8.14\作品管理与成长档案模块需求清单.docx'
$outPath = 'c:\Users\admin\Desktop\web-AoZhang\_requirements.txt'
$z = [IO.Compression.ZipFile]::OpenRead($docPath)
$e = $z.GetEntry('word/document.xml')
$r = New-Object IO.StreamReader($e.Open())
$xml = $r.ReadToEnd()
$r.Close()
$z.Dispose()
$matches = [regex]::Matches($xml, '<w:t[^>]*>([^<]*)</w:t>')
$text = ($matches | ForEach-Object { $_.Groups[1].Value }) -join ''
[System.IO.File]::WriteAllText($outPath, $text, [System.Text.Encoding]::UTF8)
Write-Host "Written $($text.Length) chars to $outPath"
