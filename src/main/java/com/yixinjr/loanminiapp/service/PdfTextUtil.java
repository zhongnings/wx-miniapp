package com.yixinjr.loanminiapp.service;

import com.spire.pdf.PdfDocument;
import com.spire.pdf.PdfPageBase;
import com.spire.pdf.texts.PdfTextReplaceOptions;
import com.spire.pdf.texts.PdfTextReplacer;
import com.spire.pdf.texts.ReplaceActionType;

import java.util.EnumSet;

/**
 * PDF文本替换工具 - 使用 Spire.PDF
 */
public class PdfTextUtil {
    
    private final PdfDocument document;
    private final static PdfTextReplaceOptions textReplaceOptions = new PdfTextReplaceOptions();

    static {
        textReplaceOptions.setReplaceType(EnumSet.of(ReplaceActionType.WholeWord));
    }
    
    public PdfTextUtil(PdfDocument document) {
        this.document = document;
    }
    
    /**
     * 替换PDF中的文本
     * 
     * @param searchText 要查找的文本（如 {{name}}）
     * @param replacement 替换后的文本
     * @return 替换的次数
     */
    public void replaceText(String searchText, String replacement) {
        // 遍历所有页面
        for (int i = 0; i < document.getPages().getCount(); i++) {
            PdfPageBase page = document.getPages().get(i);
            PdfTextReplacer pdfTextReplacer =  new PdfTextReplacer(page);

            pdfTextReplacer.setOptions(textReplaceOptions);
            pdfTextReplacer.replaceAllText(searchText, replacement);
        }
    }
}
