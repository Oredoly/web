const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docPath = path.join(__dirname, '_requirements.docx');
const outPath = path.join(__dirname, '_requirements.txt');

const ps = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.IO.Compression.FileSystem
$z = [IO.Compression.ZipFile]::OpenRead('${docPath.replace(/\\/g, '\\\\')}')
$e = $z.GetEntry('word/document.xml')
$r = New-Object IO.StreamReader($e.Open())
$xml = $r.ReadToEnd()
$r.Close(); $z.Dispose()
$matches = [regex]::Matches($xml, '<w:t[^>]*>([^<]*)</w:t>')
$text = ($matches | ForEach-Object { $_.Groups[1].Value }) -join ''
[IO.File]::WriteAllText('${outPath.replace(/\\/g, '\\\\')}', $text, [System.Text.UTF8Encoding]::new($false))
Write-Output $text.Length
`;

execSync(`powershell -NoProfile -Command "${ps.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, {
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
});

const text = fs.readFileSync(outPath, 'utf8');
console.log(text);
