package com.example.loanminiapp.dto.step;

import lombok.Data;

import java.util.List;

@Data
public class Step4GuarantorListDTO {
    private List<Step4GuarantorDTO> guarantors;
    private String guaranteeSignMethod;
}


