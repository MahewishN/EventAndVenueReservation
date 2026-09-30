package com.slotlock.auth.service;

import com.slotlock.auth.entity.EmailOtp;
import com.slotlock.auth.entity.OtpPurpose;
import com.slotlock.auth.repository.EmailOtpRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class EmailOtpService {

    private static final int OTP_LENGTH = 6;

    private final EmailOtpRepository emailOtpRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${slotlock.otp.expiration-minutes:15}")
    private int expirationMinutes;

    @Value("${slotlock.otp.max-attempts:5}")
    private int maxAttempts;

    public EmailOtpService(
            EmailOtpRepository emailOtpRepository,
            EmailService emailService,
            PasswordEncoder passwordEncoder)
    {
        this.emailOtpRepository = emailOtpRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void sendOtp(String email, OtpPurpose purpose)
    {
        String normalizedEmail = normalizeEmail(email);

        //Invalidate previously issued OTP for this purpose
        emailOtpRepository.deleteByEmailAndOtpPurpose
                (normalizedEmail, purpose);

        String otp = generateOtp();

        EmailOtp emailOtp = new EmailOtp();
        emailOtp.setEmail(normalizedEmail);
        emailOtp.setOtpHash(passwordEncoder.encode(otp));
        emailOtp.setOtpPurpose(purpose);
        emailOtp.setExpiresAt(LocalDateTime.now().plusMinutes(expirationMinutes));
        emailOtp.setAttempts(0);
        emailOtp.setUsed(false);

        emailOtpRepository.save(emailOtp);

        emailService.sendOtpEmail(normalizedEmail, otp);
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public void verifyOtp(String email, String otp, OtpPurpose purpose)
    {
        String normalizedEmail = normalizeEmail(email);

        EmailOtp emailOtp = emailOtpRepository
                .findTopByEmailAndOtpPurposeAndUsedFalseOrderByIdDesc
                        (normalizedEmail, purpose)
                .orElseThrow(()-> new ResponseStatusException
                        (HttpStatus.BAD_REQUEST, "No active OTP found"));

        if(emailOtp.getExpiresAt().isBefore(LocalDateTime.now()))
        {
            emailOtp.setUsed(true);
            emailOtpRepository.save(emailOtp);

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP has expired. Please request a new one");
        }

        if(emailOtp.getAttempts() >= maxAttempts)
        {
            emailOtp.setUsed(true);
            emailOtpRepository.save(emailOtp);

            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Maximum OTP attempts exceeded");
        }

        //Count each verification attempt
        emailOtp.setAttempts(emailOtp.getAttempts() + 1);
        if(!passwordEncoder.matches(otp, emailOtp.getOtpHash()))
        {
            if(emailOtp.getAttempts() >= maxAttempts)
            {
                emailOtp.setUsed(true);
            }
            emailOtpRepository.save(emailOtp);

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP");
        }

        //OTP is valid. It must not be reusable
        emailOtp.setUsed(true);
        emailOtpRepository.save(emailOtp);
    }

    private String generateOtp()
    {
        int number = secureRandom.nextInt(1_000_000);
        return String.format("%06d", number);
    }

    private String normalizeEmail(String email)
    {
        if(email == null || email.isBlank())
        {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        return email.trim().toLowerCase();
    }
}
