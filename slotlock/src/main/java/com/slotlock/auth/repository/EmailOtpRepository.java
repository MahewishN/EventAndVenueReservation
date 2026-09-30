package com.slotlock.auth.repository;

import com.slotlock.auth.entity.EmailOtp;
import com.slotlock.auth.entity.OtpPurpose;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailOtpRepository
        extends JpaRepository<EmailOtp, Long> {

    Optional<EmailOtp> findTopByEmailAndOtpPurposeAndUsedFalseOrderByIdDesc
            (String email, OtpPurpose otpPurpose);

    void deleteByEmailAndOtpPurpose(String email, OtpPurpose otpPurpose);
}
