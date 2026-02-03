# Replace text in guarantor files
$wxmlFile = "e:\workspace\miniapp\wx-miniapp\miniprogram\pages\order\create\guarantor\index.wxml"
$jsFile = "e:\workspace\miniapp\wx-miniapp\miniprogram\pages\order\create\guarantor\index.js"

# Replace WXML
$wxmlContent = Get-Content $wxmlFile -Raw -Encoding UTF8
$wxmlContent = $wxmlContent.Replace("共借人","担保人")
$wxmlContent = $wxmlContent.Replace("co-borrower","guarantor")
Set-Content $wxmlFile -Value $wxmlContent -Encoding UTF8

# Replace JS
$jsContent = Get-Content $jsFile -Raw -Encoding UTF8
$jsContent = $jsContent.Replace("共借人","担保人")
$jsContent = $jsContent.Replace("coBorrower","guarantor")
$jsContent = $jsContent.Replace("CoBorrower","Guarantor")
$jsContent = $jsContent.Replace("step3","step4")
Set-Content $jsFile -Value $jsContent -Encoding UTF8

Write-Host "Replacement completed successfully!"
