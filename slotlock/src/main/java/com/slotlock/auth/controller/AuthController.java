package com.slotlock.auth.controller;

import com.slotlock.auth.dto.ForgotPasswordRequest;
import com.slotlock.auth.dto.ResetPasswordRequest;
import com.slotlock.auth.dto.VerifyRegistrationRequest;
import com.slotlock.auth.service.AuthService;
import com.slotlock.user.dto.AuthResponse;
import com.slotlock.user.dto.LoginRequest;
import com.slotlock.user.dto.RefreshTokenRequest;
import com.slotlock.user.dto.RegisterRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<String> register(
            @Valid @RequestBody RegisterRequest request)
    {
        authService.register(request);

        return ResponseEntity.accepted()
                .body("Registration started. Please check your email for the OTP");
    }

    @PostMapping("/verify-registration")
    public ResponseEntity<String> verifyRegistration(
            @Valid @RequestBody VerifyRegistrationRequest request)
    {
        authService.verifyRegistration(request.getEmail(), request.getOtp());

        return ResponseEntity.ok("Email verified. Your account has been created successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request)
    {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request)
    {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request)
    {
        authService.forgotPassword(request);
        return ResponseEntity.ok("If an account exists for this email, a password-reset OTP has been sent");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request)
    {
        authService.resetPassword(request);
        return ResponseEntity.ok("Password reset successfully. You can now login with your new password");
    }
}
