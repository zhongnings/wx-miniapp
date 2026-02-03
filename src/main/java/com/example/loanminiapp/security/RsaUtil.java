package com.example.loanminiapp.security;

import javax.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import com.example.loanminiapp.entry.RsaProperties;

import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

import javax.crypto.Cipher;

@Component
@RequiredArgsConstructor
public class RsaUtil {

    private final RsaProperties props;
    private PublicKey publicKey;
    private PrivateKey privateKey;

    @PostConstruct
    public void init() throws Exception {
        KeyFactory kf = KeyFactory.getInstance("RSA");
        publicKey = kf.generatePublic(new X509EncodedKeySpec(
                Base64.getDecoder().decode(props.getPublicKey())));
        privateKey = kf.generatePrivate(new PKCS8EncodedKeySpec(
                Base64.getDecoder().decode(props.getPrivateKey())));
    }

    private String stripPem(String pem) {
        return pem.replaceAll("-----\\w+ PUBLIC KEY-----", "")
                  .replaceAll("-----\\w+ PRIVATE KEY-----", "")
                  .replaceAll("\\s", "");
    }

    public String getPublicKeyBase64() {
        return Base64.getEncoder().encodeToString(publicKey.getEncoded());
    }

    public String encryptByPublicKey(String data) {
        return doEncrypt(data, publicKey);
    }

    public String decryptByPrivateKey(String cipherTextBase64) {
        return doDecrypt(cipherTextBase64, privateKey);
    }

    public String encryptByPrivateKey(String plainText) {
        return doEncrypt(plainText, privateKey);
    }

    public String decryptByPublicKey(String cipherTextBase64) {
        return doDecrypt(cipherTextBase64, publicKey);
    }

    private static String doEncrypt(String data, java.security.Key key) {
        try {
            Cipher cipher = javax.crypto.Cipher.getInstance("RSA");
            cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, key);
            return Base64.getEncoder().encodeToString(
                    cipher.doFinal(data.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException("RSA encrypt error", e);
        }
    }

    private static String doDecrypt(String cipherTextBase64, java.security.Key key) {
        try {
            Cipher cipher = javax.crypto.Cipher.getInstance("RSA");
            cipher.init(javax.crypto.Cipher.DECRYPT_MODE, key);
            byte[] decrypted = cipher.doFinal(Base64.getDecoder().decode(cipherTextBase64));
            return new String(decrypted, java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("RSA decrypt error", e);
        }
    }

    public static void main(String[] args) throws Exception {

        String pubkey = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAo5Jnsxn5ht1ncx52Ipu33qyvk7grG7dTui6vlJwdb6HQvTqRPKeZYqLT+AtCtIhPINdjz5itOXa8qUKATxjG8BAIDSWtsao2+biC4rbRMcYD25me8GEM8m7MX+BPxXWrPSO9Ijb+9CyB2V6rFHhaBirmHiIboAL00WBTsGHQ50Rs9m36eCfJhgFUsN+1/GseYydSoC5qYD//8hAezEtjHKOFcfMC9Qmx6/XPhWWSpmabU8MTCISqcVZMnsmcOD8L8ZtQuHLTN7LXRUJM+28RmTHbqTYzyOT2L24/WCRZ6cvcVEpzJCXHB+VbcScCcoLaJV8O24H5EaWyuPIYF9LgcwIDAQAB";
        KeyFactory kf = KeyFactory.getInstance("RSA");
        PublicKey publicKey = kf.generatePublic(new X509EncodedKeySpec(
                Base64.getDecoder().decode(pubkey)));
        
        String encrypted = doEncrypt("123456", publicKey);
        System.out.println(encrypted);

        System.out.println("--------------------------------");
        String prikey = "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCjkmezGfmG3WdzHnYim7ferK+TuCsbt1O6Lq+UnB1vodC9OpE8p5liotP4C0K0iE8g12PPmK05drypQoBPGMbwEAgNJa2xqjb5uILittExxgPbmZ7wYQzybsxf4E/Fdas9I70iNv70LIHZXqsUeFoGKuYeIhugAvTRYFOwYdDnRGz2bfp4J8mGAVSw37X8ax5jJ1KgLmpgP//yEB7MS2Mco4Vx8wL1CbHr9c+FZZKmZptTwxMIhKpxVkyeyZw4Pwvxm1C4ctM3stdFQkz7bxGZMdupNjPI5PYvbj9YJFnpy9xUSnMkJccH5VtxJwJygtolXw7bgfkRpbK48hgX0uBzAgMBAAECggEANDGTRWMUbCRZzjH6IDDwCu2vWMN7feyRmucqv5DRE73ejYMStPgFyaOLX6q4LkMQfLo97xAYti1dJeVCa/rL/+4do5RSSE64HBb0LMOJHQjCUmBChxFwwCr6q903lxpk+a1dvH0v/Vn2VRYQIQgGMdGefB8GEZjf5a+HBNExh5ma0RXppw4ojswgAk7uST3SxT0JiV0v9xp/Gj3lykokNhB2OwJVv+1qekYhEGMaa4RUt/pk9HztDb++UQdZRLUt/LjLhxuhz6o9QekgT4MTxb6ilECA+6B504KE7tyaCKgES/qRFZeb8ygFk1QCWm1gckT5ozG5s/sQHmheiSo4AQKBgQDfhTpQVxZy+vfM8QIgORJryaL3FxoIIytAa23GhXTHgMhmzgkLvpuryj1aP9xBhwgj3zSrz1MxHuK3JRTpxgtmhCjHZV1NMumLxcwJbfKjR1I3F/BsyQYDe9QAa6fc5Tqe8U5p+uYs92abWTO1+bqioxPahUtyQmJ4CKNRq4bCswKBgQC7VyRzhN1wCxPtCFmP+5u7xJxEvIK9Q87xahL4AU5NQklwX3N0vI+WADg4qyQd0mhz+Y/P1LCS2aPQ0Gf8iFqXTT3xVPSCKK23E6f8vQplM64uno3K9tfUfTIi5c7XDY1cFs49EHZtFCsB9lbtGmB4Jl14ZiKWBHsAZlyF9qtLQQKBgE34PmA6EMWpD/m4dIJjBi79VlCVCWqfQf4lu1RNx2+0V7Os2XD0W38we/hYYG+nN8qzmL76Ak4XNQSn9cSaZe2r2kG79TDxupAcPlFnvgUA4wf+3MpF0Ugz0L8YzqR6fdll2XGUqOg0oOE925D1/Qmwk0NdzfScfZbbhIT/rXGLAoGBAK3/KM7WF2kKEO61M6IEGceSu2UoBPHOefVFBOstI1GkgFsLfEtvGplCCPWxFnFQTE1y+7wXGgy6cWjvN7WX2zPtvNtZgWMmbvm8GukllvMZxexsvNtG2nzz7s30zWB1qNZgJBsZIDT9Z1iCOIgtWG4fi+7YRcU50hgz+jk+OihBAoGAdhwhsI85mebRa9p28RoeeB1NsqPuP8BSrpKSBtUq8e5b7EvqumDfbqAZbsfn5SzFKFvHAaGg0WLZv4K5EJx4af4PFllCqoR9f/QyDgzSUzSfRXVjQSq4hNiTihEeWPzqX3l8HPLy62mRRwCEEImzZB4aGcxA9agN3mwqrIW5d1c=";
        PrivateKey privateKey = kf.generatePrivate(new PKCS8EncodedKeySpec(
            Base64.getDecoder().decode(prikey)));
        System.out.println(doDecrypt(encrypted, privateKey));
    }
}