package com.slotlock.auth.service;

import com.slotlock.auth.dto.ForgotPasswordRequest;
import com.slotlock.auth.dto.ResetPasswordRequest;
import com.slotlock.auth.entity.OtpPurpose;
import com.slotlock.auth.entity.PendingRegistration;
import com.slotlock.auth.repository.PendingRegistrationRepository;
import com.slotlock.exception.EmailAlreadyExistsException;
import com.slotlock.exception.InvalidRefreshTokenException;
import com.slotlock.security.JwtService;
import com.slotlock.user.dto.AuthResponse;
import com.slotlock.user.dto.LoginRequest;
import com.slotlock.user.dto.RefreshTokenRequest;
import com.slotlock.user.dto.RegisterRequest;
import com.slotlock.user.entity.Role;
import com.slotlock.user.entity.User;
import com.slotlock.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Locale;


@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    private final PendingRegistrationRepository pendingRegistrationRepository;
    private final EmailOtpService emailOtpService;

    public void register(RegisterRequest request)
    {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);

        if(userRepository.existsByEmail(email))
        {
            throw new EmailAlreadyExistsException("Email is already registered");
        }

        PendingRegistration pending = pendingRegistrationRepository
                .findByEmail(email)
                .orElseGet(PendingRegistration::new);
        pending.setUsername(request.getUsername().trim());
        pending.setEmail(email);

        pending.setPassword(passwordEncoder.encode(request.getPassword()));

        pending.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        pendingRegistrationRepository.save(pending);

        try
        {
            emailOtpService.sendOtp(email, OtpPurpose.REGISTRATION);
        }
        catch (RuntimeException ex)
        {
            pendingRegistrationRepository.delete(pending);
            throw ex;
        }
    }

    @Transactional
    public void verifyRegistration(String email, String otp) {

        String normalizedEmail = email.trim()
                .toLowerCase(Locale.ROOT);

        PendingRegistration pending = pendingRegistrationRepository
                .findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "No pending registration found"));

        if (pending.getExpiresAt().isBefore(LocalDateTime.now())) {
            pendingRegistrationRepository.delete(pending);

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Registration has expired. Please register again.");
        }

        if (userRepository.existsByEmail(normalizedEmail)) {
            pendingRegistrationRepository.delete(pending);

            throw new EmailAlreadyExistsException("Email is already registered");
        }

        emailOtpService.verifyOtp(
                normalizedEmail, otp, OtpPurpose.REGISTRATION);

        User user = User.builder()
                .username(pending.getUsername())
                .email(pending.getEmail())
                .password(pending.getPassword())
                .role(Role.USER)
                .active(true)
                .build();

        userRepository.save(user);
        pendingRegistrationRepository.delete(pending);
    }

    public AuthResponse login(LoginRequest request)
    {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        UserDetails userDetails =
                (UserDetails) authentication.getPrincipal();

        String accessToken = jwtService.generateAccessToken(userDetails);

        String refreshToken = jwtService.generateRefreshToken(userDetails);

        return new AuthResponse(accessToken, refreshToken);
    }

    public void forgotPassword(ForgotPasswordRequest request) {

        String email = request.getEmail().trim()
                .toLowerCase(Locale.ROOT);

        if (userRepository.findByEmail(email).isEmpty()) {
            return;
        }

        emailOtpService.sendOtp(email, OtpPurpose.PASSWORD_RESET);
    }

    public void resetPassword(ResetPasswordRequest request) {

        String email = request.getEmail().trim()
                .toLowerCase(Locale.ROOT);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Unable to reset password. Please request a new OTP."));

        // This verifies the OTP for PASSWORD_RESET only.
        emailOtpService.verifyOtp(email, request.getOtp(), OtpPurpose.PASSWORD_RESET);

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {

        String refreshToken = request.getRefreshToken();

        try {
            String email = jwtService.extractEmail(refreshToken);

            if (!"REFRESH".equals(jwtService.extractTokenType(refreshToken))) {
                throw new InvalidRefreshTokenException("Invalid refresh token");
            }

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new InvalidRefreshTokenException("Invalid refresh token"));

            UserDetails userDetails =
                    org.springframework.security.core.userdetails.User
                            .withUsername(user.getEmail())
                            .password(user.getPassword())
                            .roles(user.getRole().name())
                            .disabled(!user.getActive())
                            .build();

            if (!jwtService.isTokenValid(refreshToken, userDetails)) {
                throw new InvalidRefreshTokenException("Invalid or expired refresh token");}

            String newAccessToken = jwtService.generateAccessToken(userDetails);

            return new AuthResponse(
                    newAccessToken,
                    refreshToken
            );

        } catch(InvalidRefreshTokenException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new InvalidRefreshTokenException("Invalid or expired refresh token");
        }
    }
}
