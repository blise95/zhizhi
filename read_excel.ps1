$filePath = 'e:\zhiliang\temp_query.xlsx'
$outPath = 'e:\zhiliang\excel_dump2.txt'
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$wb = $excel.Workbooks.Open($filePath)
$ws = $wb.Sheets.Item(1)
$used = $ws.UsedRange
$rows = $used.Rows.Count
$cols = $used.Columns.Count
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("Rows: $rows, Cols: $cols")
# Row 4 (first data row)
$rowData = @()
for ($c = 1; $c -le $cols; $c++) {
    $val = $ws.Cells.Item(4, $c).Text
    if ($val.Length -gt 15) { $val = $val.Substring(0,15) + '...' }
    $rowData += "[$c]" + $val
}
[void]$sb.AppendLine("Row 4 : " + ($rowData -join ' | '))
# Row 5
$rowData = @()
for ($c = 1; $c -le $cols; $c++) {
    $val = $ws.Cells.Item(5, $c).Text
    if ($val.Length -gt 15) { $val = $val.Substring(0,15) + '...' }
    $rowData += "[$c]" + $val
}
[void]$sb.AppendLine("Row 5 : " + ($rowData -join ' | '))
$wb.Close($false)
$excel.Quit()
[System.IO.File]::WriteAllText($outPath, $sb.ToString(), [System.Text.UTF8Encoding]::new($false))
Write-Host "Done"
